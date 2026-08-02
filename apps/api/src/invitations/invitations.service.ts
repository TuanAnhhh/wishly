import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  ClaimInvitations,
  CreateDraftInvitation,
  PublishInvitation,
  UpdateDraftInvitation,
} from '@wishly/contracts';
import {
  CoverContentSchema,
  DraftInvitationContentSchema,
  InviteContentSchema,
  InvitationContentSchema,
  PartyContentSchema,
  isReservedSlug,
} from '@wishly/contracts';
import type { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/auth.types';
import { MediaService } from '../media/media.service';
import { OgService } from '../og/og.service';
import {
  getPalette,
  getFont,
  getStyle,
  getTexture,
  getMotif,
  motifDataUri,
  DEFAULT_STYLE_ID,
} from '@wishly/templates/themes';
import { ensurePassCodes } from '../checkin/passcode-assign';
import { evaluatePartnerAccess } from './partner-access';
import { ViewBufferService } from './view-buffer.service';

const REQUIRED_BLOCKS = ['cover', 'invite', 'party'] as const;

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
    private readonly og: OgService,
    private readonly views: ViewBufferService
  ) {}

  async createDraft(input: CreateDraftInvitation, anonSessionId: string) {
    const slug = await this.ensureUniqueSlug(
      input.slug ??
        `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
    );
    return this.prisma.invitation.create({
      data: {
        slug,
        templateId: input.templateId,
        eventType: input.eventType,
        anonSessionId,
        content: (input.content ?? { version: 1 }) as Prisma.InputJsonValue,
        theme: (input.theme ?? {
          paletteId: 'co-ngu',
          fontId: 'be-cormorant',
        }) as Prisma.InputJsonValue,
        blocks: (input.blocks ?? []) as Prisma.InputJsonValue,
        brandColor:
          input.eventType === 'CORPORATE' ? '#1F4E5F' : null,
      },
    });
  }

  async listMine(user: AuthUser | undefined, anonSessionId: string) {
    // Invitation has Guest[] but no Rsvp[] relation — count RSVPs via groupBy.
    const include = {
      _count: {
        select: {
          guests: true,
        },
      },
    } as const;

    const rows = user
      ? await this.prisma.invitation.findMany({
          where: { ownerId: user.id },
          orderBy: { updatedAt: 'desc' },
          include,
        })
      : anonSessionId
        ? await this.prisma.invitation.findMany({
            where: { anonSessionId, ownerId: null },
            orderBy: { updatedAt: 'desc' },
            include,
          })
        : [];

    const ids = rows.map((r) => r.id);
    const rsvpByInv = new Map<string, number>();
    const attendingByInv = new Map<string, number>();
    if (ids.length > 0) {
      const [allRsvps, attending] = await Promise.all([
        this.prisma.rsvp.groupBy({
          by: ['invitationId'],
          where: { invitationId: { in: ids } },
          _count: { _all: true },
        }),
        this.prisma.rsvp.groupBy({
          by: ['invitationId'],
          where: { invitationId: { in: ids }, attending: true },
          _count: { _all: true },
        }),
      ]);
      for (const g of allRsvps) rsvpByInv.set(g.invitationId, g._count._all);
      for (const g of attending)
        attendingByInv.set(g.invitationId, g._count._all);
    }

    return rows.map((r) => {
      const { _count, ...inv } = r;
      return {
        ...inv,
        guestCount: _count.guests,
        rsvpCount: rsvpByInv.get(r.id) ?? 0,
        attendingCount: attendingByInv.get(r.id) ?? 0,
      };
    });
  }

  async getOne(
    id: string,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    return this.assertCanAccess(id, user, anonSessionId);
  }

  /**
   * Public guest-facing payload — PUBLISHED or ENDED invitations.
   * ENDED is read-only, never 404: the invitation is a keepsake, not a
   * resource that disappears. FE renders ExpiredState when `ended` is true.
   */
  async getPublicBySlug(slug: string) {
    const invitation = await this.findPublishedBySlug(slug);
    const ended = invitation.status === 'ENDED';
    if (!ended) this.views.bump(invitation.id);

    let partnerBrand: {
      color: string | null;
      signature: string | null;
      logoKey: string | null;
      partnerName: string;
    } | null = null;
    if (invitation.partnerId) {
      const partner = await this.prisma.partner.findUnique({
        where: { id: invitation.partnerId },
        select: {
          status: true,
          name: true,
          brand: {
            select: { color: true, signature: true, logoKey: true },
          },
        },
      });
      // White-label only while partner is active — past_due restores Thiệp Việt watermark
      if (partner?.status === 'active' && partner.brand) {
        partnerBrand = {
          color: partner.brand.color,
          signature: partner.brand.signature,
          logoKey: partner.brand.logoKey,
          partnerName: partner.name,
        };
      }
    }

    return {
      id: invitation.id,
      slug: invitation.slug,
      eventType: invitation.eventType,
      tier: invitation.tier,
      content: invitation.content,
      theme: invitation.theme,
      blocks: invitation.blocks,
      brandColor: partnerBrand?.color ?? invitation.brandColor,
      partnerBrand,
      ogImageKey: invitation.ogImageKey,
      publishedAt: invitation.publishedAt,
      expiresAt: invitation.expiresAt,
      ended,
      eventDate: invitation.eventDate,
      publicGuestbook: invitation.publicGuestbook,
      hideGift: invitation.hideGift,
    };
  }

  /**
   * Crawler-facing HTML shell with OG meta.
   * Humans are redirected to the SPA; bots keep the meta tags.
   * Full static HTML → CDN lands later; this unblocks Zalo/FB preview.
   */
  async getShareHtml(slug: string): Promise<string> {
    const invitation = await this.findPublishedBySlug(slug);
    const content = invitation.content as {
      cover?: { nameLeft?: string; nameRight?: string; dateLine?: string };
      invite?: { body?: string };
    };
    const cover = content.cover;
    const title =
      cover?.nameLeft && cover?.nameRight
        ? `${cover.nameLeft} & ${cover.nameRight} — Thiệp Việt`
        : `Thiệp mời — ${invitation.slug}`;
    const description =
      cover?.dateLine ||
      content.invite?.body?.slice(0, 160) ||
      'Thiệp mời online từ Thiệp Việt';
    const webBase =
      process.env.PUBLIC_WEB_URL?.replace(/\/$/, '') ?? 'http://localhost:4200';
    const apiBase =
      process.env.PUBLIC_API_URL?.replace(/\/$/, '') ??
      `http://localhost:${process.env.API_PORT ?? process.env.PORT ?? 3001}/api`;
    const v = invitation.publishedAt?.getTime() ?? Date.now();
    const pageUrl = `${webBase}/${invitation.slug}?v=${v}`;
    const shareUrl = `${apiBase}/invitations/public/${invitation.slug}/share?v=${v}`;
    const ogImage = invitation.ogImageKey
      ? `${this.media.resolvePublicUrl(invitation.ogImageKey)}?v=${v}`
      : '';

    return buildShareHtml({
      title,
      description,
      pageUrl,
      ogImage,
      shareCanonical: shareUrl,
    });
  }

  async updateDraft(
    id: string,
    input: UpdateDraftInvitation,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    const invitation = await this.assertCanAccess(id, user, anonSessionId, {
      write: true,
    });
    if (invitation.status === 'ENDED') {
      throw new BadRequestException(
        'Thiệp đã kết thúc, không chỉnh sửa được. Hãy nhân bản nếu cần tạo lại.'
      );
    }

    if (input.slug && input.slug !== invitation.slug) {
      await this.assertSlugAvailable(input.slug, invitation.id);
    }

    if (input.content) {
      DraftInvitationContentSchema.parse(input.content);
    }

    return this.prisma.invitation.update({
      where: { id },
      data: {
        ...(input.content
          ? { content: input.content as Prisma.InputJsonValue }
          : {}),
        ...(input.theme
          ? { theme: input.theme as Prisma.InputJsonValue }
          : {}),
        ...(input.blocks
          ? { blocks: input.blocks as Prisma.InputJsonValue }
          : {}),
        ...(input.slug ? { slug: input.slug } : {}),
        ...(input.eventDate !== undefined
          ? {
              eventDate: input.eventDate ? new Date(input.eventDate) : null,
            }
          : {}),
        ...(input.brandColor !== undefined
          ? { brandColor: input.brandColor }
          : {}),
      },
    });
  }

  async duplicate(
    id: string,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    const source = await this.assertCanAccess(id, user, anonSessionId, {
      write: true,
    });
    const slug = await this.ensureUniqueSlug(`${source.slug}-ban-sao`);
    return this.prisma.invitation.create({
      data: {
        slug,
        templateId: source.templateId,
        eventType: source.eventType,
        eventDate: source.eventDate,
        tier: source.tier,
        content: source.content as Prisma.InputJsonValue,
        theme: source.theme as Prisma.InputJsonValue,
        blocks: source.blocks as Prisma.InputJsonValue,
        brandColor: source.brandColor,
        ownerId: user?.id ?? null,
        anonSessionId: user ? null : anonSessionId,
        status: 'DRAFT',
      },
    });
  }

  /**
   * Publish order (locked):
   * 1 validate · 2 slug · 3 OG sync · 4 status · 5 revalidate hook · 6 return url
   */
  async publish(
    id: string,
    input: PublishInvitation,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    const invitation = await this.assertCanAccess(id, user, anonSessionId, {
      write: true,
    });
    if (invitation.status === 'ENDED') {
      throw new BadRequestException('Thiệp đã kết thúc, không xuất bản lại được.');
    }

    const content = InvitationContentSchema.parse(invitation.content);
    const blocks = invitation.blocks as Array<{
      key: string;
      enabled: boolean;
      order: number;
    }>;

    for (const key of REQUIRED_BLOCKS) {
      const cfg = blocks.find((b) => b.key === key);
      if (!cfg?.enabled) {
        throw new BadRequestException(
          `Phần bắt buộc đang tắt: ${key}. Bật lại trước khi xuất bản.`
        );
      }
      const slice = content[key];
      if (!slice) {
        throw new BadRequestException(
          `Thiếu nội dung phần ${key}. Bạn có thể xuất bản khi thiếu ảnh, nhưng tên và ngày vẫn cần có.`
        );
      }
    }

    CoverContentSchema.parse(content.cover);
    InviteContentSchema.parse(content.invite);
    PartyContentSchema.parse(content.party);

    const slug = input.slug ?? invitation.slug;
    await this.assertSlugAvailable(slug, invitation.id);

    const publishedAt = new Date();
    const theme = invitation.theme as {
      paletteId?: string;
      fontId?: string;
      styleId?: string;
    };
    // Deliberately does NOT call derivePalette(invitation.brandColor) the way
    // resolveTheme() does for the live page — that's a pre-existing gap (the
    // old palette-bridge.ts never read brandColor either), not introduced
    // here. Adding it would be a real behaviour change (CORPORATE + custom
    // brand accent would start showing a different OG colour than today),
    // which this phase's "zero visual change" scope excludes. Tracked as a
    // known inconsistency, not fixed in this pass.
    const palette = getPalette(theme.paletteId ?? 'co-ngu');
    const font = getFont(theme.fontId ?? 'be-cormorant');
    const style = getStyle(theme.styleId ?? DEFAULT_STYLE_ID);
    const cover = content.cover!;
    // Resolve style.surfaceTexture/motifSetId → flat scalars here (not inside
    // OgService — it never touches the registries, same boundary as
    // palette/font/style above). Absent for every template today, so this
    // is a no-op until a real family sets these fields (P02).
    // `surfaceTexture` can be a tile (`{ tileId }`) or, since P08 (`lua`), a
    // raw CSS gradient (`{ gradient }`) — OG's bespoke layout only supports
    // `url(...)` image textures (`OgService.renderCoverPng`, hardcoded
    // `backgroundImage: \`url(${textureDataUri})\``), so a gradient resolves
    // to "no OG texture" here. Consistent with invariant 2 (OG parity ≠
    // pixel-identical, not every visual axis needs to render there) — not a
    // bug, see phase-08 report §Unresolved.
    const texture =
      style.surfaceTexture && 'tileId' in style.surfaceTexture
        ? getTexture(style.surfaceTexture.tileId)
        : null;
    const motif = getMotif(style.motifSetId ?? 'no-motif');
    const ogPng = await this.og.renderCoverPng({
      nameLeft: cover.nameLeft,
      nameRight: cover.nameRight,
      dateLine: cover.dateLine,
      placeLine: cover.placeLine,
      accent: palette.accent,
      background: palette.bg,
      ink: palette.ink,
      inkMuted: palette.inkMuted,
      inkSoft: palette.inkSoft,
      surface: palette.surface,
      fontDisplay: font.display,
      fontBody: font.body,
      displayXl: style.displayXl,
      displayMd: style.displayMd,
      textureDataUri: texture?.dataUri || undefined,
      textureOpacity: style.surfaceTexture?.opacity,
      motifDividerDataUri: motif.dividerGlyph
        ? motifDataUri(motif.dividerGlyph, palette.accent)
        : undefined,
      frameShape: style.frameShape,
    });
    const ogImageKey = await this.media.putPublicObject(
      `og/${invitation.id}-${publishedAt.getTime()}.png`,
      ogPng,
      'image/png'
    );

    const expiresAt = new Date(publishedAt);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    const purgeAt = computePurgeAt(
      invitation.eventDate ?? publishedAt,
      invitation.retentionMonths
    );

    const updated = await this.prisma.invitation.update({
      where: { id },
      data: {
        slug,
        status: 'PUBLISHED',
        publishedAt,
        expiresAt,
        ogImageKey,
        purgeAt,
      },
    });

    await ensurePassCodes(this.prisma, id);

    // P11 — album + recap share token (idempotent on re-publish)
    const existingAlbum = await this.prisma.album.findUnique({
      where: { invitationId: id },
      select: { id: true },
    });
    if (!existingAlbum) {
      const opensAt = invitation.eventDate ?? publishedAt;
      const closesAt = new Date(opensAt);
      closesAt.setDate(closesAt.getDate() + 30);
      await this.prisma.album.create({
        data: {
          invitationId: id,
          title: 'Album ảnh',
          opensAt,
          closesAt,
        },
      });
    }
    if (!invitation.recapToken) {
      const { nanoid } = await import('nanoid');
      await this.prisma.invitation.update({
        where: { id },
        data: { recapToken: nanoid(12) },
      });
    }

    // Share URL hits Nest OG HTML shell (crawlers). Humans redirect to SPA.
    // Static HTML → CDN worker lands in a later slice.
    const apiBase =
      process.env.PUBLIC_API_URL?.replace(/\/$/, '') ??
      `http://localhost:${process.env.API_PORT ?? process.env.PORT ?? 3001}/api`;
    const url = `${apiBase}/invitations/public/${updated.slug}/share?v=${publishedAt.getTime()}`;
    const webBase =
      process.env.PUBLIC_WEB_URL?.replace(/\/$/, '') ?? 'http://localhost:4200';
    const pageUrl = `${webBase}/${updated.slug}?v=${publishedAt.getTime()}`;

    return {
      id: updated.id,
      slug: updated.slug,
      url,
      pageUrl,
      ogImageKey: updated.ogImageKey,
      publishedAt: updated.publishedAt,
    };
  }

  /** Owner-only. Extends a PUBLISHED or ENDED invitation by 12 more months. */
  async renew(
    id: string,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    const invitation = await this.assertCanAccess(id, user, anonSessionId, {
      write: true,
    });
    if (invitation.status === 'DRAFT') {
      throw new BadRequestException('Thiệp chưa xuất bản, chưa cần gia hạn.');
    }
    const base =
      invitation.expiresAt && invitation.expiresAt > new Date()
        ? invitation.expiresAt
        : new Date();
    const expiresAt = new Date(base);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const updated = await this.prisma.invitation.update({
      where: { id },
      data: { expiresAt, status: 'PUBLISHED' },
    });
    return { expiresAt: updated.expiresAt, status: updated.status };
  }

  /** Nghị định 13/2023 consent, collected once per event before the first guest-list save. */
  async giveConsent(
    id: string,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    const invitation = await this.assertCanAccess(id, user, anonSessionId, {
      write: true,
    });
    const consentAt = invitation.consentAt ?? new Date();
    await this.prisma.invitation.update({
      where: { id },
      data: { consentAt, consentBy: user?.id ?? anonSessionId ?? null },
    });
    return { consentAt };
  }

  async getPrivacySettings(
    id: string,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    const invitation = await this.assertCanAccess(id, user, anonSessionId);
    return this.serializePrivacy(invitation);
  }

  async updatePrivacy(
    id: string,
    input: {
      publicGuestbook?: boolean;
      hideGift?: boolean;
      retentionMonths?: 3 | 6 | 12;
      password?: string | null;
    },
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    const invitation = await this.assertCanAccess(id, user, anonSessionId, {
      write: true,
    });
    const data: Prisma.InvitationUpdateInput = {};

    if (input.publicGuestbook !== undefined) {
      data.publicGuestbook = input.publicGuestbook;
    }
    if (input.hideGift !== undefined) {
      data.hideGift = input.hideGift;
    }
    if (input.retentionMonths !== undefined) {
      data.retentionMonths = input.retentionMonths;
      data.purgeAt = computePurgeAt(
        invitation.eventDate ?? invitation.publishedAt ?? new Date(),
        input.retentionMonths
      );
    }
    if (input.password !== undefined) {
      if (invitation.tier === 'FREE') {
        throw new ForbiddenException(
          'Mật khẩu thiệp chỉ dùng được cho gói trả phí.'
        );
      }
      data.passwordHash = input.password
        ? await bcrypt.hash(input.password, 10)
        : null;
    }

    const updated = await this.prisma.invitation.update({
      where: { id },
      data,
    });
    return this.serializePrivacy(updated);
  }

  private serializePrivacy(invitation: {
    passwordHash: string | null;
    publicGuestbook: boolean;
    hideGift: boolean;
    retentionMonths: number;
    purgeAt: Date | null;
    consentAt: Date | null;
  }) {
    return {
      passwordProtected: Boolean(invitation.passwordHash),
      publicGuestbook: invitation.publicGuestbook,
      hideGift: invitation.hideGift,
      retentionMonths: invitation.retentionMonths,
      purgeAt: invitation.purgeAt,
      consentGiven: Boolean(invitation.consentAt),
    };
  }

  /** Owner-only. 4-sheet workbook: guests, RSVPs, guestbook wishes, gift ledger. */
  async exportAll(
    id: string,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ): Promise<Buffer> {
    await this.assertCanAccess(id, user, anonSessionId);
    const [guests, rsvps, wishes, gifts] = await Promise.all([
      this.prisma.guest.findMany({ where: { invitationId: id } }),
      this.prisma.rsvp.findMany({ where: { invitationId: id } }),
      this.prisma.guestbookEntry.findMany({ where: { invitationId: id } }),
      this.prisma.giftEntry.findMany({ where: { invitationId: id } }),
    ]);

    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.json_to_sheet(
        guests.map((g) => ({
          Tên: g.name,
          'Số điện thoại': g.phone ?? '',
          Nhóm: g.group ?? '',
          'Ghi chú': g.note ?? '',
          'Đồng ý xử lý dữ liệu': g.consentAt ? 'Có' : '',
        }))
      ),
      'Khách'
    );
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.json_to_sheet(
        rsvps.map((r) => ({
          Tên: r.name,
          'Tham dự': r.attending ? 'Có' : 'Không',
          'Số người đi cùng': r.plusOnes,
          'Lời nhắn': r.note ?? '',
          'Thời gian': r.createdAt.toISOString(),
        }))
      ),
      'Phản hồi'
    );
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.json_to_sheet(
        wishes.map((w) => ({
          Tên: w.name,
          'Lời chúc': w.message,
          'Trạng thái': w.status,
          'Thời gian': w.createdAt.toISOString(),
        }))
      ),
      'Lời chúc'
    );
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.json_to_sheet(
        gifts.map((g) => ({
          'Người gửi': g.giverName,
          'Số tiền': g.amount,
          Bên: g.side,
          'Ghi chú': g.note ?? '',
          'Thời gian nhận': g.receivedAt.toISOString(),
        }))
      ),
      'Sổ tiền mừng'
    );

    return XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  /**
   * Type-to-confirm delete. Order is detached (SetNull), never deleted —
   * invoices must survive 10y for accounting law regardless of NĐ 13
   * deletion of guest data. Rsvp/GuestbookEntry/GiftAccount/GiftEntry have
   * no real FK to Invitation (tracked as tech debt), so they're deleted
   * explicitly rather than relying on cascade.
   */
  async deleteEvent(
    id: string,
    confirmName: string,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    const invitation = await this.assertCanAccess(id, user, anonSessionId, {
      write: true,
    });
    const cover = invitation.content as
      | { cover?: { nameLeft?: string; nameRight?: string } }
      | null;
    const title =
      cover?.cover?.nameLeft && cover?.cover?.nameRight
        ? `${cover.cover.nameLeft} & ${cover.cover.nameRight}`
        : invitation.slug;
    if (confirmName.trim() !== title.trim()) {
      throw new BadRequestException(
        'Tên chưa khớp. Kiểm tra dấu và khoảng trắng, hoặc sao chép tên ở trên.'
      );
    }

    await this.prisma.$transaction([
      this.prisma.order.updateMany({
        where: { invitationId: id },
        data: {
          invitationId: null,
          invoiceInfo: { invitationTitle: title } as Prisma.InputJsonValue,
        },
      }),
      this.prisma.rsvp.deleteMany({ where: { invitationId: id } }),
      this.prisma.guestbookEntry.deleteMany({ where: { invitationId: id } }),
      this.prisma.giftAccount.deleteMany({ where: { invitationId: id } }),
      this.prisma.giftEntry.deleteMany({ where: { invitationId: id } }),
      // Guest also cascades from this delete; explicit for a clean count.
      this.prisma.guest.deleteMany({ where: { invitationId: id } }),
      this.prisma.invitation.delete({ where: { id } }),
    ]);

    return { deleted: true as const };
  }

  async claim(user: AuthUser, anonSessionId: string, body: ClaimInvitations) {
    const where = body.invitationIds?.length
      ? {
          id: { in: body.invitationIds },
          anonSessionId,
          ownerId: null,
        }
      : {
          anonSessionId,
          ownerId: null,
        };

    const result = await this.prisma.invitation.updateMany({
      where,
      data: {
        ownerId: user.id,
        claimedAt: new Date(),
        anonSessionId: null,
      },
    });

    return { claimed: result.count };
  }

  /**
   * Access gate for invitations.
   * Branches: (1) B2C owner (2) anon draft (3) partner member — P12.
   */
  async assertCanAccess(
    invitationId: string,
    user: AuthUser | undefined,
    anonSessionId: string | undefined,
    opts?: { write?: boolean; partnerMemberId?: string; partnerRole?: string }
  ) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
    });
    if (!invitation) {
      throw new NotFoundException('Không tìm thấy thiệp.');
    }
    const owned = user && invitation.ownerId === user.id;
    const anonOk =
      !invitation.ownerId &&
      anonSessionId &&
      invitation.anonSessionId === anonSessionId;
    if (owned || anonOk) return invitation;

    // Partner tenant branch (P12) — membership looked up by userId.
    if (user && invitation.partnerId) {
      const member = await this.prisma.partnerMember.findFirst({
        where: {
          partnerId: invitation.partnerId,
          userId: user.id,
          joinedAt: { not: null },
        },
      });
      if (member) {
        const decision = evaluatePartnerAccess({
          role: member.role,
          write: opts?.write,
          assignedMemberId: invitation.assignedMemberId,
          memberId: member.id,
        });
        if (!decision.ok) {
          throw new ForbiddenException(
            decision.reason === 'view_write'
              ? 'Vai chỉ xem không được chỉnh sửa.'
              : 'Bạn chỉ được xem/chỉnh thiệp được giao phụ trách.'
          );
        }
        return invitation;
      }
    }

    throw new ForbiddenException('Bạn không có quyền với thiệp này.');
  }

  private async findPublishedBySlug(slug: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { slug },
    });
    if (
      !invitation ||
      (invitation.status !== 'PUBLISHED' && invitation.status !== 'ENDED')
    ) {
      throw new NotFoundException('Không tìm thấy thiệp đã xuất bản.');
    }
    return invitation;
  }

  private async assertSlugAvailable(slug: string, excludeId?: string) {
    if (isReservedSlug(slug)) {
      throw new BadRequestException(
        'Slug này đã được giữ cho hệ thống. Hãy chọn tên khác.'
      );
    }
    const existing = await this.prisma.invitation.findUnique({
      where: { slug },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(
        'Slug này đã có người dùng. Hãy thử thêm số hoặc tên khác.'
      );
    }
  }

  private async ensureUniqueSlug(base: string) {
    let slug = base
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48);
    if (slug.length < 3) slug = `invite-${Date.now().toString(36)}`;
    if (isReservedSlug(slug)) slug = `${slug}-thiep`;

    let candidate = slug;
    let i = 2;
    while (await this.prisma.invitation.findUnique({ where: { slug: candidate } })) {
      candidate = `${slug}-${i}`;
      i += 1;
    }
    return candidate;
  }
}

/** purgeAt anchors on eventDate when known (a postponed wedding shouldn't lose its guest list early), else publishedAt. */
export function computePurgeAt(anchor: Date, retentionMonths: number): Date {
  const purgeAt = new Date(anchor);
  purgeAt.setMonth(purgeAt.getMonth() + retentionMonths);
  return purgeAt;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildShareHtml(input: {
  title: string;
  description: string;
  pageUrl: string;
  ogImage: string;
  shareCanonical: string;
}): string {
  const title = escapeHtml(input.title);
  const description = escapeHtml(input.description);
  const pageUrl = escapeHtml(input.pageUrl);
  const ogImage = escapeHtml(input.ogImage);
  const canonical = escapeHtml(input.shareCanonical);
  const imageMeta = ogImage
    ? `<meta property="og:image" content="${ogImage}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:image" content="${ogImage}" />`
    : '';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<meta name="description" content="${description}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Thiệp Việt" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:url" content="${canonical}" />
${imageMeta}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<link rel="canonical" href="${canonical}" />
<meta http-equiv="refresh" content="0;url=${pageUrl}" />
</head>
<body>
<p>Đang mở thiệp… <a href="${pageUrl}">Xem thiệp</a></p>
</body>
</html>`;
}

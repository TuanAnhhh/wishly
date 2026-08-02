import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateGiftEntry,
  CreateGuest,
  ImportGiftEntries,
  ImportGuests,
  MessageTone,
  UpdateGuest,
} from '@wishly/contracts';
import {
  DEFAULT_GUEST_GROUPS,
  deriveGuestRole,
  renderMessage,
} from '@wishly/contracts';
import { customAlphabet } from 'nanoid';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/auth.types';
import { assignPassCodeIfPublished } from '../checkin/passcode-assign';
import { InvitationsService } from '../invitations/invitations.service';
import { ViewBufferService } from '../invitations/view-buffer.service';

const MAX_REMINDERS = 2;

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10);

/** Compact helpers — ZNS body must stay ≤ 200 chars with long VN names. */
function compactPlace(place: string): string {
  const t = place.trim();
  return t.length > 40 ? `${t.slice(0, 37)}…` : t;
}

function compactTime(time: string): string {
  const t = time.trim();
  const m = t.match(/(\d{1,2})\s*[:h]\s*(\d{2})/i);
  if (m) return `${m[1]}h${m[2]}`;
  return t.length > 12 ? t.slice(0, 12) : t;
}

function compactDate(
  dateLine: string | undefined,
  eventDate: Date | null
): string {
  const raw = dateLine?.trim() || '';
  const m = raw.match(/(\d{1,2})\D+(\d{1,2})\D+(\d{4})/);
  if (m) {
    return `${m[1]!.padStart(2, '0')}.${m[2]!.padStart(2, '0')}.${m[3]}`;
  }
  if (eventDate) {
    const dd = String(eventDate.getDate()).padStart(2, '0');
    const mm = String(eventDate.getMonth() + 1).padStart(2, '0');
    return `${dd}.${mm}.${eventDate.getFullYear()}`;
  }
  return raw.length > 16 ? raw.slice(0, 16) : raw;
}

/** token is a Zalo-shareable link, not a secret — never echo the full phone through it. */
function maskPhone(phone: string | null): string | null {
  if (!phone) return null;
  if (phone.length <= 6) return `${phone.slice(0, 2)}****`;
  return `${phone.slice(0, 3)}****${phone.slice(-3)}`;
}

@Injectable()
export class GuestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invitations: InvitationsService,
    private readonly views: ViewBufferService
  ) {}

  defaultGroups() {
    return [...DEFAULT_GUEST_GROUPS];
  }

  async list(
    invitationId: string,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    await this.invitations.assertCanAccess(invitationId, user, anonSessionId);
    const guests = await this.prisma.guest.findMany({
      where: { invitationId },
      orderBy: [{ group: 'asc' }, { name: 'asc' }],
      include: {
        rsvps: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    const invitation = await this.prisma.invitation.findUniqueOrThrow({
      where: { id: invitationId },
      select: {
        guestLimit: true,
        slug: true,
        status: true,
        eventType: true,
      },
    });
    return {
      guests: guests.map((g) => ({
        id: g.id,
        name: g.name,
        phone: g.phone,
        group: g.group,
        role: g.role ?? deriveGuestRole(g.group),
        remindedCount: g.remindedCount,
        note: g.note,
        token: g.token,
        passCode: g.passCode,
        checkedInAt: g.checkedInAt,
        walkIn: g.walkIn,
        mealChoice: g.mealChoice,
        allergyNote: g.allergyNote,
        lang: g.lang,
        title: g.title,
        tableId: g.tableId,
        consentAt: g.consentAt,
        createdAt: g.createdAt,
        rsvp: g.rsvps[0]
          ? {
              attending: g.rsvps[0].attending,
              plusOnes: g.rsvps[0].plusOnes,
              note: g.rsvps[0].note,
              createdAt: g.rsvps[0].createdAt,
            }
          : null,
      })),
      guestLimit: invitation.guestLimit,
      count: guests.length,
      slug: invitation.slug,
      eventType: invitation.eventType,
      groups: this.defaultGroups(),
    };
  }

  async create(
    invitationId: string,
    input: CreateGuest,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    await this.invitations.assertCanAccess(invitationId, user, anonSessionId, { write: true });
    await this.assertConsent(invitationId);
    await this.assertUnderLimit(invitationId, 1);
    const group = input.group?.trim() || null;
    const role =
      input.role?.trim() || deriveGuestRole(group);
    const guest = await this.prisma.guest.create({
      data: {
        invitationId,
        name: input.name.trim(),
        phone: input.phone?.trim() || null,
        group,
        role,
        note: input.note?.trim() || null,
        token: await this.uniqueToken(),
        consentAt: input.consentAt ? new Date(input.consentAt) : null,
      },
    });
    await assignPassCodeIfPublished(this.prisma, invitationId, guest.id);
    return this.prisma.guest.findUniqueOrThrow({ where: { id: guest.id } });
  }

  async update(
    invitationId: string,
    guestId: string,
    input: UpdateGuest,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    await this.invitations.assertCanAccess(invitationId, user, anonSessionId, { write: true });
    await this.assertGuestBelongs(invitationId, guestId);
    const nextGroup =
      input.group !== undefined ? input.group?.trim() || null : undefined;
    let nextRole: string | null | undefined;
    if (input.role !== undefined) {
      nextRole = input.role?.trim() || null;
    } else if (nextGroup !== undefined) {
      nextRole = deriveGuestRole(nextGroup);
    }
    return this.prisma.guest.update({
      where: { id: guestId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.phone !== undefined
          ? { phone: input.phone?.trim() || null }
          : {}),
        ...(nextGroup !== undefined ? { group: nextGroup } : {}),
        ...(nextRole !== undefined ? { role: nextRole } : {}),
        ...(input.note !== undefined
          ? { note: input.note?.trim() || null }
          : {}),
        ...(input.consentAt !== undefined
          ? {
              consentAt: input.consentAt ? new Date(input.consentAt) : null,
            }
          : {}),
      },
    });
  }

  async remove(
    invitationId: string,
    guestId: string,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    await this.invitations.assertCanAccess(invitationId, user, anonSessionId, { write: true });
    await this.assertGuestBelongs(invitationId, guestId);
    await this.prisma.guest.delete({ where: { id: guestId } });
    return { ok: true };
  }

  async importText(
    invitationId: string,
    input: ImportGuests,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    await this.invitations.assertCanAccess(invitationId, user, anonSessionId, { write: true });
    await this.assertConsent(invitationId);
    const rows = input.text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.toLowerCase().startsWith('tên'));
    const parsed = rows.map((line) => {
      const parts = line.split(/[,;\t]/).map((p) => p.trim());
      return {
        name: parts[0] ?? '',
        phone: parts[1] || null,
        group: parts[2] || null,
      };
    }).filter((r) => r.name.length > 0);

    if (!parsed.length) {
      throw new BadRequestException('Không tìm thấy dòng khách hợp lệ.');
    }
    await this.assertUnderLimit(invitationId, parsed.length);
    const consentAt = new Date();
    const created = [];
    for (const row of parsed) {
      created.push(
        await this.prisma.guest.create({
          data: {
            invitationId,
            name: row.name,
            phone: row.phone,
            group: row.group,
            role: deriveGuestRole(row.group),
            token: await this.uniqueToken(),
            consentAt,
          },
        })
      );
    }
    return { imported: created.length, guests: created };
  }

  async importFromInvitation(
    invitationId: string,
    sourceId: string,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    await this.invitations.assertCanAccess(invitationId, user, anonSessionId, { write: true });
    await this.invitations.assertCanAccess(sourceId, user, anonSessionId, { write: true });
    await this.assertConsent(invitationId);
    const source = await this.prisma.guest.findMany({
      where: { invitationId: sourceId },
    });
    await this.assertUnderLimit(invitationId, source.length);
    let imported = 0;
    for (const g of source) {
      await this.prisma.guest.create({
        data: {
          invitationId,
          name: g.name,
          role: g.role ?? deriveGuestRole(g.group),
          phone: g.phone,
          group: g.group,
          note: g.note,
          token: await this.uniqueToken(),
          consentAt: g.consentAt,
        },
      });
      imported += 1;
    }
    return { imported };
  }

  /** Public: resolve guest token → invitation shell (no phone). */
  async getByToken(token: string, opts?: { countView?: boolean }) {
    const guest = await this.prisma.guest.findUnique({
      where: { token },
      include: {
        invitation: true,
        rsvps: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (
      !guest ||
      (guest.invitation.status !== 'PUBLISHED' &&
        guest.invitation.status !== 'ENDED')
    ) {
      throw new NotFoundException('Không tìm thấy thiệp cho liên kết này.');
    }
    const inv = guest.invitation;
    const ended = inv.status === 'ENDED';
    if (opts?.countView && !ended) this.views.bump(inv.id);
    let tableLabel: string | null = null;
    if (guest.tableId) {
      const table = await this.prisma.seatingTable.findUnique({
        where: { id: guest.tableId },
        select: { label: true },
      });
      tableLabel = table?.label ?? null;
    }

    return {
      guest: {
        name: guest.name,
        token: guest.token,
        group: guest.group,
        attending: guest.rsvps[0]?.attending ?? null,
        passCode: guest.passCode,
        tableLabel,
        mealChoice: guest.mealChoice,
        lang: guest.lang,
      },
      invitation: {
        id: inv.id,
        slug: inv.slug,
        eventType: inv.eventType,
        tier: inv.tier,
        content: inv.content,
        theme: inv.theme,
        blocks: inv.blocks,
        brandColor: inv.brandColor,
        ogImageKey: inv.ogImageKey,
        publishedAt: inv.publishedAt,
        expiresAt: inv.expiresAt,
        ended,
      },
    };
  }

  /** Guest self-service (Nghị định 13/2023 data-subject rights) — no login, gated by the token itself. */
  async getSelf(token: string) {
    const guest = await this.prisma.guest.findUnique({
      where: { token },
      include: { rsvps: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!guest) throw new NotFoundException('Không tìm thấy khách.');
    return {
      name: guest.name,
      phone: maskPhone(guest.phone),
      attending: guest.rsvps[0]?.attending ?? null,
      wish: guest.rsvps[0]?.note ?? null,
    };
  }

  async updateSelf(
    token: string,
    input: { attending?: boolean; wish?: string }
  ) {
    const guest = await this.prisma.guest.findUnique({
      where: { token },
      include: { rsvps: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!guest) throw new NotFoundException('Không tìm thấy khách.');
    const previous = guest.rsvps[0];
    await this.prisma.rsvp.create({
      data: {
        invitationId: guest.invitationId,
        guestId: guest.id,
        name: guest.name,
        attending: input.attending ?? previous?.attending ?? true,
        note: input.wish ?? previous?.note ?? null,
      },
    });
    return { ok: true as const };
  }

  /** Anonymises immediately — no 72h wait for in-product requests (email requests keep the SLA). */
  async removeSelf(token: string) {
    const guest = await this.prisma.guest.findUnique({ where: { token } });
    if (!guest) throw new NotFoundException('Không tìm thấy khách.');
    await this.prisma.$transaction([
      this.prisma.guest.update({
        where: { id: guest.id },
        data: { name: '[đã xoá]', phone: null, note: null },
      }),
      this.prisma.rsvp.updateMany({
        where: { guestId: guest.id },
        data: { name: '[đã xoá]', note: null },
      }),
    ]);
    return { ok: true as const };
  }

  private async assertConsent(invitationId: string) {
    const inv = await this.prisma.invitation.findUniqueOrThrow({
      where: { id: invitationId },
      select: { consentAt: true },
    });
    if (!inv.consentAt) {
      throw new ConflictException({
        code: 'CONSENT_REQUIRED',
        message:
          'Cần xác nhận đồng ý xử lý dữ liệu khách (Nghị định 13/2023) trước khi lưu danh sách.',
      });
    }
  }

  async getGuestShareHtml(token: string): Promise<string> {
    const data = await this.getByToken(token);
    const cover = (data.invitation.content as { cover?: { nameLeft?: string; nameRight?: string; dateLine?: string } }).cover;
    const couple =
      cover?.nameLeft && cover?.nameRight
        ? `${cover.nameLeft} & ${cover.nameRight}`
        : 'Thiệp Việt';
    const title = `${data.guest.name} ơi, ${couple} kính mời`;
    const webBase =
      process.env.PUBLIC_WEB_URL?.replace(/\/$/, '') ?? 'http://localhost:4200';
    const apiBase =
      process.env.PUBLIC_API_URL?.replace(/\/$/, '') ??
      `http://localhost:${process.env.API_PORT ?? process.env.PORT ?? 3001}/api`;
    const v = data.invitation.publishedAt
      ? new Date(data.invitation.publishedAt).getTime()
      : Date.now();
    const pageUrl = `${webBase}/guest/${token}?v=${v}`;
    const shareUrl = `${apiBase}/guests/public/${token}/share?v=${v}`;
    const ogImage = data.invitation.ogImageKey
      ? `${process.env.S3_PUBLIC_URL?.replace(/\/$/, '') ?? 'http://localhost:9000/wishly'}/${data.invitation.ogImageKey}?v=${v}`
      : '';

    const escape = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    return `<!DOCTYPE html>
<html lang="vi"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escape(title)}</title>
<meta property="og:type" content="website" />
<meta property="og:title" content="${escape(title)}" />
<meta property="og:description" content="${escape(cover?.dateLine || 'Thiệp mời online')}" />
<meta property="og:url" content="${escape(shareUrl)}" />
${ogImage ? `<meta property="og:image" content="${escape(ogImage)}" />` : ''}
<meta name="twitter:card" content="summary_large_image" />
<link rel="canonical" href="${escape(shareUrl)}" />
<meta http-equiv="refresh" content="0;url=${escape(pageUrl)}" />
</head>
<body><p><a href="${escape(pageUrl)}">Mở thiệp</a></p></body></html>`;
  }

  async buildZaloMessages(
    invitationId: string,
    guests: Array<{
      name: string;
      token: string;
      role?: string | null;
      group?: string | null;
    }>,
    slug: string,
    tone: MessageTone = 'formal'
  ) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
      select: { content: true, eventDate: true },
    });
    const cover = (invitation?.content as { cover?: Record<string, string> })
      ?.cover;
    const nameLeft = cover?.nameLeft ?? 'Cô dâu';
    const nameRight = cover?.nameRight ?? 'Chú rể';
    // Compact vars keep ZNS ≤ 200 chars with long Vietnamese names.
    const place = compactPlace(cover?.placeLine ?? cover?.venue ?? '');
    const time = compactTime(cover?.timeLine ?? cover?.giờ ?? '');
    const dateLine = compactDate(
      cover?.dateLine,
      invitation?.eventDate ?? null
    );

    const apiBase =
      process.env.PUBLIC_API_URL?.replace(/\/$/, '') ??
      `http://localhost:${process.env.API_PORT ?? process.env.PORT ?? 3001}/api`;

    return guests.map((g) => {
      const link = `${apiBase}/guests/public/${g.token}/share`;
      const role = g.role?.trim() || deriveGuestRole(g.group);
      const body = renderMessage(
        'zns.invite',
        {
          guest_name: g.name,
          bride_name: nameLeft,
          groom_name: nameRight,
          role,
          time,
          weekday_date: dateLine,
          venue: place,
        },
        tone
      );
      const text = `${body}\n${link}`;
      return {
        name: g.name,
        token: g.token,
        text,
        link,
        slug,
        charCount: body.length,
      };
    });
  }

  /**
   * Soft RSVP reminder — max 2 per guest, enforced server-side.
   * Returns ZNS copy for manual paste (OA not live yet).
   */
  async remindGuest(
    invitationId: string,
    guestId: string,
    user: AuthUser | undefined,
    anonSessionId: string | undefined,
    tone: MessageTone = 'formal'
  ) {
    await this.invitations.assertCanAccess(invitationId, user, anonSessionId, { write: true });
    const guest = await this.prisma.guest.findUnique({
      where: { id: guestId },
    });
    if (!guest || guest.invitationId !== invitationId) {
      throw new NotFoundException('Không tìm thấy khách.');
    }
    if (guest.remindedCount >= MAX_REMINDERS) {
      throw new ForbiddenException(
        'Đã nhắc tối đa 2 lần — không gửi thêm để tránh làm phiền khách.'
      );
    }

    const invitation = await this.prisma.invitation.findUniqueOrThrow({
      where: { id: invitationId },
      select: { content: true, eventDate: true, slug: true },
    });
    const cover = (invitation.content as { cover?: Record<string, string> })
      ?.cover;
    const key = guest.remindedCount === 0 ? 'zns.remind1' : 'zns.remind2';
    const body = renderMessage(
      key,
      {
        guest_name: guest.name,
        bride_name: cover?.nameLeft ?? 'Cô dâu',
        groom_name: cover?.nameRight ?? 'Chú rể',
        role: guest.role ?? deriveGuestRole(guest.group),
        time: compactTime(cover?.timeLine ?? ''),
        weekday_date: compactDate(cover?.dateLine, invitation.eventDate),
        venue: compactPlace(cover?.placeLine ?? ''),
      },
      tone
    );

    const updated = await this.prisma.guest.update({
      where: { id: guestId },
      data: { remindedCount: { increment: 1 } },
    });

    const apiBase =
      process.env.PUBLIC_API_URL?.replace(/\/$/, '') ??
      `http://localhost:${process.env.API_PORT ?? process.env.PORT ?? 3001}/api`;
    const link = `${apiBase}/guests/public/${guest.token}/share`;

    return {
      remindedCount: updated.remindedCount,
      lastReminder: guest.remindedCount === 0,
      text: `${body}\n${link}`,
      link,
      messageKey: key,
    };
  }

  async listGiftEntries(
    invitationId: string,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    await this.invitations.assertCanAccess(invitationId, user, anonSessionId);
    const entries = await this.prisma.giftEntry.findMany({
      where: { invitationId },
      orderBy: { receivedAt: 'desc' },
    });
    const total = entries.reduce((s, e) => s + e.amount, 0);
    const bySide = entries.reduce<Record<string, number>>((acc, e) => {
      acc[e.side] = (acc[e.side] ?? 0) + e.amount;
      return acc;
    }, {});
    return { entries, total, bySide };
  }

  async createGiftEntry(
    invitationId: string,
    input: CreateGiftEntry,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    await this.invitations.assertCanAccess(invitationId, user, anonSessionId, { write: true });
    if (input.guestId) {
      await this.assertGuestBelongs(invitationId, input.guestId);
    }
    return this.prisma.giftEntry.create({
      data: {
        invitationId,
        giverName: input.giverName.trim(),
        amount: input.amount,
        side: input.side.trim(),
        note: input.note?.trim() || null,
        guestId: input.guestId ?? null,
        receivedAt: input.receivedAt ? new Date(input.receivedAt) : new Date(),
      },
    });
  }

  async deleteGiftEntry(
    invitationId: string,
    entryId: string,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    await this.invitations.assertCanAccess(invitationId, user, anonSessionId, { write: true });
    const entry = await this.prisma.giftEntry.findUnique({
      where: { id: entryId },
    });
    if (!entry || entry.invitationId !== invitationId) {
      throw new NotFoundException('Không tìm thấy dòng sổ.');
    }
    await this.prisma.giftEntry.delete({ where: { id: entryId } });
    return { ok: true };
  }

  async markBulkSent(
    invitationId: string,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    await this.invitations.assertCanAccess(invitationId, user, anonSessionId, { write: true });
    await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { bulkSentAt: new Date() },
    });
    return { ok: true };
  }

  async importGiftEntries(
    invitationId: string,
    input: ImportGiftEntries,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    await this.invitations.assertCanAccess(invitationId, user, anonSessionId, { write: true });
    const created = [];
    for (const row of input.entries) {
      created.push(
        await this.prisma.giftEntry.create({
          data: {
            invitationId,
            giverName: row.giverName.trim(),
            amount: row.amount,
            side: (row.side || input.defaultSide).trim(),
            note: row.note?.trim() || null,
            guestId: row.guestId ?? null,
            receivedAt: row.receivedAt
              ? new Date(row.receivedAt)
              : new Date(),
          },
        })
      );
    }
    return { imported: created.length };
  }

  private async assertUnderLimit(invitationId: string, add: number) {
    const inv = await this.prisma.invitation.findUniqueOrThrow({
      where: { id: invitationId },
      select: { guestLimit: true },
    });
    const count = await this.prisma.guest.count({ where: { invitationId } });
    if (count + add > inv.guestLimit) {
      throw new ForbiddenException({
        message: `Đã đạt giới hạn ${inv.guestLimit} khách của gói hiện tại. Nâng cấp để thêm khách.`,
        code: 'GUEST_LIMIT',
        guestLimit: inv.guestLimit,
        count,
      });
    }
  }

  private async assertGuestBelongs(invitationId: string, guestId: string) {
    const g = await this.prisma.guest.findUnique({ where: { id: guestId } });
    if (!g || g.invitationId !== invitationId) {
      throw new NotFoundException('Không tìm thấy khách.');
    }
    return g;
  }

  private async uniqueToken() {
    for (let i = 0; i < 5; i++) {
      const token = nanoid();
      const exists = await this.prisma.guest.findUnique({ where: { token } });
      if (!exists) return token;
    }
    throw new BadRequestException('Không tạo được mã khách. Thử lại.');
  }
}

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PartnerPlanTier,
  isReservedSlug,
  type CreatePartnerClient,
  type InviteMember,
  type RegisterPartner,
  type SavePartnerTemplate,
  type UpdateMemberRole,
  type UpdatePartnerBrand,
} from '@wishly/contracts';
import type { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { Inject } from '@nestjs/common';
import type { AuthUser } from '../auth/auth.types';
import type { PartnerContext } from '../auth/partner.types';
import { MAILER, type Mailer } from '../notifications/mailer.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  parseDataTemplate,
  stripPersonalContent,
} from './data-template.util';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const PAST_DUE_CREATE_LOCK_DAYS = 7;

@Injectable()
export class PartnerService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(MAILER) private readonly mailer: Mailer
  ) {}

  async register(user: AuthUser, input: RegisterPartner) {
    if (!user.email) {
      throw new BadRequestException('Cần email để đăng ký studio.');
    }
    if (isReservedSlug(input.slug)) {
      throw new BadRequestException('Slug này đã được giữ chỗ.');
    }
    const existing = await this.prisma.partner.findUnique({
      where: { slug: input.slug },
    });
    if (existing) {
      throw new ConflictException('Slug studio đã tồn tại.');
    }
    const plan = PartnerPlanTier[input.planTier];
    const periodStart = new Date();
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    const invoiceCode = await this.nextInvoiceCode(this.prisma);

    const partner = await this.prisma.$transaction(async (tx) => {
      const p = await tx.partner.create({
        data: {
          name: input.name,
          slug: input.slug,
          planTier: input.planTier,
          slotLimit: plan.slotLimit,
          status: 'active',
          brand: { create: {} },
          members: {
            create: {
              userId: user.id,
              email: user.email!.toLowerCase(),
              role: 'admin',
              joinedAt: new Date(),
            },
          },
          subscriptions: {
            create: {
              planTier: input.planTier,
              amountMonthly: plan.amountMonthly,
              slotLimit: plan.slotLimit,
              status: 'active',
              periodStart,
              periodEnd,
              provider: 'bank_manual',
              invoices: {
                create: {
                  code: invoiceCode,
                  periodStart,
                  periodEnd,
                  amount: plan.amountMonthly,
                  status: 'pending',
                },
              },
            },
          },
        },
        include: { brand: true, members: true },
      });
      return p;
    });
    return this.serializePartner(partner);
  }

  async me(user: AuthUser, ctx: PartnerContext | undefined) {
    if (!ctx) {
      const pending = await this.prisma.partnerMember.findFirst({
        where: { userId: user.id, joinedAt: { not: null } },
      });
      return { partner: null, membership: pending ? 'orphan' : null };
    }
    const partner = await this.prisma.partner.findUniqueOrThrow({
      where: { id: ctx.partnerId },
      include: { brand: true },
    });
    const slotUsed = await this.countSlots(ctx.partnerId);
    return {
      partner: {
        ...this.serializePartner(partner),
        role: ctx.role,
        memberId: ctx.memberId,
        slotUsed,
        createLocked: await this.isCreateLocked(partner),
      },
    };
  }

  async dashboard(ctx: PartnerContext) {
    const partnerId = ctx.partnerId;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const whereBase =
      ctx.role === 'edit'
        ? { partnerId, assignedMemberId: ctx.memberId }
        : { partnerId };

    const [slotUsed, totalClients, createdThisMonth, createdPrevMonth, invitations] =
      await Promise.all([
        this.countSlots(partnerId),
        this.prisma.invitation.count({ where: whereBase }),
        this.prisma.invitation.count({
          where: { ...whereBase, createdAt: { gte: monthStart } },
        }),
        this.prisma.invitation.count({
          where: {
            ...whereBase,
            createdAt: { gte: prevMonthStart, lt: monthStart },
          },
        }),
        this.prisma.invitation.findMany({
          where: whereBase,
          select: {
            id: true,
            createdAt: true,
            status: true,
            _count: { select: { guests: true } },
          },
        }),
      ]);

    const invIds = invitations.map((i) => i.id);
    const rsvpStats = invIds.length
      ? await this.prisma.rsvp.groupBy({
          by: ['invitationId'],
          where: { invitationId: { in: invIds } },
          _count: true,
        })
      : [];

    const byMonth = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonth.set(key, 0);
    }
    for (const inv of invitations) {
      const key = `${inv.createdAt.getFullYear()}-${String(inv.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (byMonth.has(key)) byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
    }

    const rsvpByInv = new Map(
      rsvpStats.map((r) => [r.invitationId, r._count])
    );
    const responseRate = invitations.map((inv) => {
      const guests = inv._count.guests;
      const rsvps = rsvpByInv.get(inv.id) ?? 0;
      return {
        invitationId: inv.id,
        rate: guests === 0 ? 0 : Math.round((rsvps / guests) * 100),
      };
    });

    const partner = await this.prisma.partner.findUniqueOrThrow({
      where: { id: partnerId },
    });

    return {
      slotUsed,
      slotLimit: partner.slotLimit,
      totalClients,
      createdThisMonth,
      createdDelta: createdThisMonth - createdPrevMonth,
      createLocked: await this.isCreateLocked(partner),
      chartByMonth: [...byMonth.entries()].map(([month, count]) => ({
        month,
        count,
      })),
      chartResponseRate: responseRate.slice(0, 12),
      rsvpGroupCount: rsvpStats.length,
    };
  }

  async listClients(
    ctx: PartnerContext,
    opts: { status?: string; q?: string }
  ) {
    const where: Prisma.InvitationWhereInput = {
      partnerId: ctx.partnerId,
      ...(ctx.role === 'edit'
        ? { assignedMemberId: ctx.memberId }
        : {}),
      ...(opts.status ? { status: opts.status as never } : {}),
      ...(opts.q
        ? {
            OR: [
              { clientCode: { contains: opts.q, mode: 'insensitive' } },
              { slug: { contains: opts.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const rows = await this.prisma.invitation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 200,
      select: {
        id: true,
        slug: true,
        status: true,
        eventType: true,
        eventDate: true,
        clientCode: true,
        assignedMemberId: true,
        createdAt: true,
        updatedAt: true,
        content: true,
        _count: { select: { guests: true } },
      },
    });
    const ids = rows.map((r) => r.id);
    const rsvpCounts = ids.length
      ? await this.prisma.rsvp.groupBy({
          by: ['invitationId'],
          where: { invitationId: { in: ids } },
          _count: true,
        })
      : [];
    const rsvpMap = new Map(rsvpCounts.map((r) => [r.invitationId, r._count]));
    return rows.map((r) => {
      const content = r.content as {
        cover?: { nameLeft?: string; nameRight?: string };
      };
      return {
        id: r.id,
        slug: r.slug,
        status: r.status,
        eventType: r.eventType,
        eventDate: r.eventDate,
        clientCode: r.clientCode,
        assignedMemberId: r.assignedMemberId,
        nameLeft: content.cover?.nameLeft ?? '',
        nameRight: content.cover?.nameRight ?? '',
        guestCount: r._count.guests,
        rsvpCount: rsvpMap.get(r.id) ?? 0,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });
  }

  async createClient(ctx: PartnerContext, input: CreatePartnerClient) {
    const partner = await this.prisma.partner.findUniqueOrThrow({
      where: { id: ctx.partnerId },
    });
    if (await this.isCreateLocked(partner)) {
      throw new ForbiddenException({
        code: 'CREATE_LOCKED',
        message:
          'Gói quá hạn — không tạo sự kiện mới. Thiệp đang chạy vẫn mở bình thường.',
      });
    }
    if (ctx.role === 'view') {
      throw new ForbiddenException('Vai chỉ xem không được tạo khách hàng.');
    }

    const slotUsed = await this.countSlots(ctx.partnerId);
    if (slotUsed >= partner.slotLimit) {
      throw new HttpException(
        {
          code: 'SLOT_LIMIT',
          message: `Đã dùng hết ${partner.slotLimit} slot. Nâng gói để thêm khách hàng.`,
        },
        HttpStatus.PAYMENT_REQUIRED
      );
    }

    let theme: Prisma.InputJsonValue;
    let blocks: Prisma.InputJsonValue;
    let content: Prisma.InputJsonValue;
    let templateId: string;
    let eventType = input.eventType;

    if (input.partnerTemplateId) {
      const pt = await this.prisma.partnerTemplate.findFirst({
        where: { id: input.partnerTemplateId, partnerId: ctx.partnerId },
      });
      if (!pt) throw new NotFoundException('Không tìm thấy mẫu studio.');
      const parsed = parseDataTemplate({
        theme: pt.theme,
        blocks: pt.blocks,
        content: pt.content,
      });
      theme = parsed.theme as Prisma.InputJsonValue;
      blocks = parsed.blocks as Prisma.InputJsonValue;
      content = {
        ...parsed.content,
        cover: {
          ...(parsed.content.cover as object),
          nameLeft: input.nameLeft,
          nameRight: input.nameRight,
        },
      } as Prisma.InputJsonValue;
      templateId = `pt_${pt.id}`;
      eventType = pt.eventType;
      await this.prisma.partnerTemplate.update({
        where: { id: pt.id },
        data: { useCount: { increment: 1 } },
      });
    } else {
      if (!input.theme || !input.blocks?.length || !input.content) {
        throw new BadRequestException(
          'Thiếu theme/blocks/content — studio phải gửi seed từ registry mẫu.'
        );
      }
      const parsed = parseDataTemplate({
        theme: input.theme,
        blocks: input.blocks,
        content: input.content,
      });
      theme = parsed.theme as Prisma.InputJsonValue;
      blocks = parsed.blocks as Prisma.InputJsonValue;
      const base = structuredClone(parsed.content) as Record<string, unknown>;
      const cover = (base.cover ?? {}) as Record<string, unknown>;
      cover.nameLeft = input.nameLeft;
      cover.nameRight = input.nameRight;
      base.cover = cover;
      content = base as Prisma.InputJsonValue;
      templateId = input.templateId;
      eventType = input.eventType;
    }

    const assignedMemberId =
      ctx.role === 'edit'
        ? ctx.memberId
        : input.assignedMemberId || ctx.memberId;

    if (assignedMemberId) {
      const m = await this.prisma.partnerMember.findFirst({
        where: {
          id: assignedMemberId,
          partnerId: ctx.partnerId,
          joinedAt: { not: null },
        },
      });
      if (!m) throw new BadRequestException('Người phụ trách không hợp lệ.');
    }

    const slug = await this.uniqueSlug(
      `${input.nameLeft}-${input.nameRight}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40) || `client-${Date.now().toString(36)}`
    );

    const clientCode =
      input.clientCode?.trim() ||
      `KH-${String((await this.countSlots(ctx.partnerId)) + 1).padStart(3, '0')}`;

    return this.prisma.invitation.create({
      data: {
        slug,
        templateId,
        eventType,
        eventDate: input.eventDate ? new Date(input.eventDate) : null,
        content,
        theme,
        blocks,
        partnerId: ctx.partnerId,
        assignedMemberId,
        clientCode,
        ownerId: null,
        status: 'DRAFT',
      },
    });
  }

  async getBrand(ctx: PartnerContext) {
    const brand = await this.prisma.partnerBrand.findUnique({
      where: { partnerId: ctx.partnerId },
    });
    return brand ?? { partnerId: ctx.partnerId, domainStatus: 'none' };
  }

  async updateBrand(ctx: PartnerContext, input: UpdatePartnerBrand) {
    if (input.subdomain) {
      if (isReservedSlug(input.subdomain)) {
        throw new BadRequestException('Subdomain này đã được giữ chỗ.');
      }
      const taken = await this.prisma.partnerBrand.findFirst({
        where: {
          subdomain: input.subdomain,
          NOT: { partnerId: ctx.partnerId },
        },
      });
      if (taken) throw new ConflictException('Subdomain đã được dùng.');
    }
    return this.prisma.partnerBrand.upsert({
      where: { partnerId: ctx.partnerId },
      create: {
        partnerId: ctx.partnerId,
        logoKey: input.logoKey ?? null,
        color: input.color ?? null,
        subdomain: input.subdomain ?? null,
        signature: input.signature ?? null,
        domainStatus: input.subdomain ? 'pending' : 'none',
      },
      update: {
        ...(input.logoKey !== undefined ? { logoKey: input.logoKey } : {}),
        ...(input.color !== undefined ? { color: input.color } : {}),
        ...(input.signature !== undefined
          ? { signature: input.signature }
          : {}),
        ...(input.subdomain !== undefined
          ? {
              subdomain: input.subdomain,
              domainStatus: input.subdomain ? 'pending' : 'none',
            }
          : {}),
      },
    });
  }

  async publicBrandBySubdomain(subdomain: string) {
    const brand = await this.prisma.partnerBrand.findFirst({
      where: {
        subdomain: subdomain.toLowerCase(),
        partner: { status: 'active' },
      },
      include: { partner: { select: { name: true, status: true } } },
    });
    if (!brand) throw new NotFoundException('Không tìm thấy thương hiệu.');
    return {
      partnerName: brand.partner.name,
      logoKey: brand.logoKey,
      color: brand.color,
      signature: brand.signature,
      subdomain: brand.subdomain,
      domainStatus: brand.domainStatus,
      customDomainDeferred: true,
    };
  }

  async listMembers(ctx: PartnerContext) {
    return this.prisma.partnerMember.findMany({
      where: { partnerId: ctx.partnerId },
      orderBy: { invitedAt: 'asc' },
      select: {
        id: true,
        email: true,
        role: true,
        userId: true,
        invitedAt: true,
        joinedAt: true,
        lastSeenAt: true,
      },
    });
  }

  async inviteMember(ctx: PartnerContext, input: InviteMember) {
    const email = input.email.toLowerCase();
    const existing = await this.prisma.partnerMember.findUnique({
      where: {
        partnerId_email: { partnerId: ctx.partnerId, email },
      },
    });
    if (existing?.joinedAt) {
      throw new ConflictException('Email này đã là thành viên.');
    }
    const token = randomBytes(24).toString('hex');
    const member = existing
      ? await this.prisma.partnerMember.update({
          where: { id: existing.id },
          data: {
            role: input.role,
            inviteToken: token,
            invitedAt: new Date(),
          },
        })
      : await this.prisma.partnerMember.create({
          data: {
            partnerId: ctx.partnerId,
            email,
            role: input.role,
            inviteToken: token,
          },
        });

    const partner = await this.prisma.partner.findUniqueOrThrow({
      where: { id: ctx.partnerId },
    });
    const studioUrl =
      process.env.STUDIO_URL ?? 'http://localhost:4200';
    await this.mailer.send({
      to: email,
      subject: `Mời tham gia studio ${partner.name}`,
      html: `<p>Bạn được mời vào studio <b>${partner.name}</b> với vai <b>${input.role}</b>.</p>
<p><a href="${studioUrl}/partner/accept?token=${token}">Nhận lời mời</a> (hết hạn 7 ngày)</p>`,
      messageKey: 'email.partnerInvite',
    });
    return { id: member.id, email: member.email, role: member.role };
  }

  async acceptInvite(user: AuthUser, token: string) {
    if (!user.email) {
      throw new BadRequestException('Cần email để nhận lời mời.');
    }
    const member = await this.prisma.partnerMember.findUnique({
      where: { inviteToken: token },
    });
    if (!member) throw new NotFoundException('Lời mời không hợp lệ.');
    if (
      member.invitedAt.getTime() + INVITE_TTL_MS < Date.now()
    ) {
      throw new BadRequestException('Lời mời đã hết hạn.');
    }
    if (member.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new ForbiddenException(
        'Email đăng nhập phải khớp email được mời.'
      );
    }
    return this.prisma.partnerMember.update({
      where: { id: member.id },
      data: {
        userId: user.id,
        joinedAt: new Date(),
        inviteToken: null,
      },
    });
  }

  async updateMemberRole(
    ctx: PartnerContext,
    memberId: string,
    input: UpdateMemberRole
  ) {
    const member = await this.requireMember(ctx.partnerId, memberId);
    if (member.role === 'admin' && input.role !== 'admin') {
      await this.assertNotLastAdmin(ctx.partnerId, memberId);
    }
    return this.prisma.partnerMember.update({
      where: { id: memberId },
      data: { role: input.role },
    });
  }

  async removeMember(ctx: PartnerContext, memberId: string) {
    const member = await this.requireMember(ctx.partnerId, memberId);
    if (member.role === 'admin') {
      await this.assertNotLastAdmin(ctx.partnerId, memberId);
    }
    if (member.id === ctx.memberId) {
      throw new BadRequestException('Không thể tự gỡ chính mình.');
    }
    await this.prisma.partnerMember.delete({ where: { id: memberId } });
    return { ok: true as const };
  }

  async listTemplates(ctx: PartnerContext) {
    // Code templates live in FE registry (@wishly/templates) — API only stores partner data templates.
    const partner = await this.prisma.partnerTemplate.findMany({
      where: { partnerId: ctx.partnerId },
      orderBy: { createdAt: 'desc' },
    });
    return {
      partner: partner.map((t) => ({
        id: t.id,
        name: t.name,
        eventType: t.eventType,
        thumbKey: t.thumbKey,
        useCount: t.useCount,
        createdAt: t.createdAt,
        source: 'partner' as const,
      })),
    };
  }

  async saveTemplate(
    ctx: PartnerContext,
    input: SavePartnerTemplate,
    user: AuthUser
  ) {
    const inv = await this.prisma.invitation.findFirst({
      where: { id: input.invitationId, partnerId: ctx.partnerId },
    });
    if (!inv) throw new NotFoundException('Không tìm thấy thiệp.');
    // Use assert via ownership: partner admin/edit on this inv
    if (ctx.role === 'view') {
      throw new ForbiddenException('Vai chỉ xem không lưu mẫu.');
    }
    if (
      ctx.role === 'edit' &&
      inv.assignedMemberId !== ctx.memberId
    ) {
      throw new ForbiddenException('Chỉ lưu mẫu từ thiệp được giao.');
    }
    void user;
    const stripped = stripPersonalContent(
      inv.content as Record<string, unknown>
    );
    const parsed = parseDataTemplate({
      theme: inv.theme,
      blocks: inv.blocks,
      content: stripped,
    });
    return this.prisma.partnerTemplate.create({
      data: {
        partnerId: ctx.partnerId,
        name: input.name,
        eventType: inv.eventType,
        theme: parsed.theme as Prisma.InputJsonValue,
        blocks: parsed.blocks as Prisma.InputJsonValue,
        content: parsed.content as Prisma.InputJsonValue,
      },
    });
  }

  async deleteTemplate(ctx: PartnerContext, templateId: string) {
    const t = await this.prisma.partnerTemplate.findFirst({
      where: { id: templateId, partnerId: ctx.partnerId },
    });
    if (!t) throw new NotFoundException('Không tìm thấy mẫu.');
    await this.prisma.partnerTemplate.delete({ where: { id: templateId } });
    return { ok: true as const };
  }

  /** Brand payload for a published invitation (active partner only). */
  async brandForInvitation(invitationId: string) {
    const inv = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
      select: {
        partnerId: true,
        partner: {
          select: {
            status: true,
            brand: true,
            name: true,
          },
        },
      },
    });
    if (!inv?.partnerId || !inv.partner || inv.partner.status !== 'active') {
      return null;
    }
    const b = inv.partner.brand;
    if (!b) return null;
    return {
      color: b.color,
      signature: b.signature,
      logoKey: b.logoKey,
      partnerName: inv.partner.name,
    };
  }

  private async countSlots(partnerId: string) {
    return this.prisma.invitation.count({
      where: {
        partnerId,
        status: { in: ['DRAFT', 'PUBLISHED'] },
      },
    });
  }

  private async isCreateLocked(partner: {
    status: string;
    id: string;
  }): Promise<boolean> {
    if (partner.status === 'cancelled') return true;
    if (partner.status !== 'past_due') return false;
    const sub = await this.prisma.partnerSubscription.findFirst({
      where: { partnerId: partner.id, status: 'past_due' },
      orderBy: { periodEnd: 'desc' },
    });
    if (!sub) return true;
    const lockAt = new Date(sub.periodEnd);
    lockAt.setDate(lockAt.getDate() + PAST_DUE_CREATE_LOCK_DAYS);
    return lockAt.getTime() < Date.now();
  }

  private serializePartner(partner: {
    id: string;
    name: string;
    slug: string;
    planTier: string;
    slotLimit: number;
    status: string;
    createdAt: Date;
    brand?: unknown;
  }) {
    return {
      id: partner.id,
      name: partner.name,
      slug: partner.slug,
      planTier: partner.planTier,
      slotLimit: partner.slotLimit,
      status: partner.status,
      createdAt: partner.createdAt,
      brand: partner.brand ?? null,
    };
  }

  private async uniqueSlug(base: string) {
    const slug = base.slice(0, 48) || `draft-${Date.now().toString(36)}`;
    for (let i = 0; i < 8; i++) {
      const candidate =
        i === 0 ? slug : `${slug.slice(0, 40)}-${randomBytes(2).toString('hex')}`;
      if (isReservedSlug(candidate)) continue;
      const exists = await this.prisma.invitation.findUnique({
        where: { slug: candidate },
      });
      if (!exists) return candidate;
    }
    return `client-${Date.now().toString(36)}`;
  }

  private async nextInvoiceCode(
    tx: Prisma.TransactionClient | PrismaService
  ) {
    const now = new Date();
    const prefix = `HD-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const count = await tx.partnerInvoice.count({
      where: { code: { startsWith: prefix } },
    });
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }

  private async requireMember(partnerId: string, memberId: string) {
    const m = await this.prisma.partnerMember.findFirst({
      where: { id: memberId, partnerId },
    });
    if (!m) throw new NotFoundException('Không tìm thấy thành viên.');
    return m;
  }

  private async assertNotLastAdmin(partnerId: string, memberId: string) {
    const admins = await this.prisma.partnerMember.count({
      where: {
        partnerId,
        role: 'admin',
        joinedAt: { not: null },
        NOT: { id: memberId },
      },
    });
    if (admins < 1) {
      throw new BadRequestException('Không thể gỡ admin cuối cùng.');
    }
  }
}

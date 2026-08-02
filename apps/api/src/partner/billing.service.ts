import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PartnerPlanTier, type ChangePartnerPlan } from '@wishly/contracts';
import type { PartnerContext } from '../auth/partner.types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async getBilling(ctx: PartnerContext) {
    const partner = await this.prisma.partner.findUniqueOrThrow({
      where: { id: ctx.partnerId },
    });
    const sub = await this.prisma.partnerSubscription.findFirst({
      where: { partnerId: ctx.partnerId },
      orderBy: { createdAt: 'desc' },
      include: {
        invoices: { orderBy: { periodStart: 'desc' }, take: 24 },
      },
    });
    const slotUsed = await this.prisma.invitation.count({
      where: {
        partnerId: ctx.partnerId,
        status: { in: ['DRAFT', 'PUBLISHED'] },
      },
    });
    return {
      planTier: partner.planTier,
      slotLimit: partner.slotLimit,
      slotUsed,
      status: partner.status,
      provider: sub?.provider ?? 'bank_manual',
      periodStart: sub?.periodStart ?? null,
      periodEnd: sub?.periodEnd ?? null,
      amountMonthly: sub?.amountMonthly ?? PartnerPlanTier.studio.amountMonthly,
      invoices: (sub?.invoices ?? []).map((i) => ({
        id: i.id,
        code: i.code,
        periodStart: i.periodStart,
        periodEnd: i.periodEnd,
        amount: i.amount,
        status: i.status,
        paidAt: i.paidAt,
      })),
      bankManual: {
        method: 'bank_manual' as const,
        note: 'Chuyển khoản theo cú pháp HD-YYYY-MM-xxxx · xác nhận tay trong 1–2 ngày làm việc.',
      },
    };
  }

  async changePlan(ctx: PartnerContext, input: ChangePartnerPlan) {
    const plan = PartnerPlanTier[input.planTier];
    const partner = await this.prisma.partner.findUniqueOrThrow({
      where: { id: ctx.partnerId },
    });
    const slotUsed = await this.prisma.invitation.count({
      where: {
        partnerId: ctx.partnerId,
        status: { in: ['DRAFT', 'PUBLISHED'] },
      },
    });
    if (slotUsed > plan.slotLimit) {
      throw new BadRequestException(
        `Đang dùng ${slotUsed} slot — không hạ xuống gói ${plan.slotLimit} slot.`
      );
    }

    const periodStart = new Date();
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await this.prisma.partnerSubscription.updateMany({
      where: { partnerId: ctx.partnerId, status: 'active' },
      data: { status: 'cancelled' },
    });

    const code = await this.nextInvoiceCode();
    await this.prisma.$transaction([
      this.prisma.partner.update({
        where: { id: partner.id },
        data: {
          planTier: input.planTier,
          slotLimit: plan.slotLimit,
          status: 'active',
        },
      }),
      this.prisma.partnerSubscription.create({
        data: {
          partnerId: partner.id,
          planTier: input.planTier,
          amountMonthly: plan.amountMonthly,
          slotLimit: plan.slotLimit,
          status: 'active',
          periodStart,
          periodEnd,
          provider: 'bank_manual',
          invoices: {
            create: {
              code,
              periodStart,
              periodEnd,
              amount: plan.amountMonthly,
              status: 'pending',
            },
          },
        },
      }),
    ]);
    return this.getBilling(ctx);
  }

  /** Admin/ops — mark invoice paid (bank_manual). */
  async markInvoicePaid(ctx: PartnerContext, invoiceId: string) {
    const invoice = await this.prisma.partnerInvoice.findFirst({
      where: {
        id: invoiceId,
        subscription: { partnerId: ctx.partnerId },
      },
      include: { subscription: true },
    });
    if (!invoice) throw new NotFoundException('Không tìm thấy hoá đơn.');

    await this.prisma.$transaction([
      this.prisma.partnerInvoice.update({
        where: { id: invoiceId },
        data: { status: 'paid', paidAt: new Date() },
      }),
      this.prisma.partnerSubscription.update({
        where: { id: invoice.subscriptionId },
        data: { status: 'active' },
      }),
      this.prisma.partner.update({
        where: { id: ctx.partnerId },
        data: { status: 'active' },
      }),
    ]);
    return this.getBilling(ctx);
  }

  private async nextInvoiceCode() {
    const now = new Date();
    const prefix = `HD-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const count = await this.prisma.partnerInvoice.count({
      where: { code: { startsWith: prefix } },
    });
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }
}

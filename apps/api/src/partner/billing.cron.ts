import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PartnerPlanTier } from '@wishly/contracts';
import { withAdvisoryLock } from '../common/advisory-lock';
import { PrismaService } from '../prisma/prisma.service';

/** Distinct from P07/P11 locks */
const LOCK_PARTNER_BILLING = 42104;
const PAST_DUE_GRACE_DAYS = 7;

@Injectable()
export class BillingCron {
  private readonly logger = new Logger(BillingCron.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async run() {
    await withAdvisoryLock(this.prisma, LOCK_PARTNER_BILLING, async () => {
      await this.markPastDue();
      await this.renewPeriods();
      this.logger.log('Partner billing cron done');
    });
  }

  /** periodEnd < now → past_due (does NOT take down live invitations). */
  private async markPastDue() {
    const now = new Date();
    const due = await this.prisma.partnerSubscription.findMany({
      where: {
        status: 'active',
        periodEnd: { lt: now },
      },
    });
    for (const sub of due) {
      await this.prisma.$transaction([
        this.prisma.partnerSubscription.update({
          where: { id: sub.id },
          data: { status: 'past_due' },
        }),
        this.prisma.partner.update({
          where: { id: sub.partnerId },
          data: { status: 'past_due' },
        }),
        this.prisma.partnerInvoice.updateMany({
          where: {
            subscriptionId: sub.id,
            status: 'pending',
            periodEnd: { lt: now },
          },
          data: { status: 'overdue' },
        }),
      ]);
    }
  }

  /**
   * For active subs near period end: create next invoice.
   * past_due + grace elapsed → still only blocks create (checked in service).
   */
  private async renewPeriods() {
    const now = new Date();
    const horizon = new Date(now);
    horizon.setDate(horizon.getDate() + 3);

    const subs = await this.prisma.partnerSubscription.findMany({
      where: {
        status: { in: ['active', 'past_due'] },
        periodEnd: { lte: horizon },
      },
      include: { invoices: { orderBy: { periodEnd: 'desc' }, take: 1 } },
    });

    for (const sub of subs) {
      const last = sub.invoices[0];
      if (last && last.periodEnd > now && last.status === 'pending') continue;

      const periodStart = sub.periodEnd > now ? sub.periodEnd : now;
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      const plan =
        PartnerPlanTier[sub.planTier as keyof typeof PartnerPlanTier] ??
        PartnerPlanTier.studio;
      const code = await this.nextInvoiceCode();

      await this.prisma.partnerInvoice.create({
        data: {
          subscriptionId: sub.id,
          code,
          periodStart,
          periodEnd,
          amount: plan.amountMonthly,
          status: 'pending',
        },
      });

      if (sub.status === 'active' && sub.periodEnd <= now) {
        await this.prisma.partnerSubscription.update({
          where: { id: sub.id },
          data: { periodStart, periodEnd },
        });
      }

      // Log grace for ops — create lock is evaluated in PartnerService
      if (sub.status === 'past_due') {
        const lockAt = new Date(sub.periodEnd);
        lockAt.setDate(lockAt.getDate() + PAST_DUE_GRACE_DAYS);
        if (lockAt < now) {
          this.logger.warn(
            `Partner ${sub.partnerId} create-locked (past_due > ${PAST_DUE_GRACE_DAYS}d)`
          );
        }
      }
    }
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

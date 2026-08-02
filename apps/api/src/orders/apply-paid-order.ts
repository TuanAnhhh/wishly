import { BadRequestException } from '@nestjs/common';
import type { Order } from '@prisma/client';
import type { NotificationsService } from '../notifications/notifications.service';
import type { PrismaService } from '../prisma/prisma.service';

const UNLIMITED_GUESTS = 10_000;

type PlanSnap = {
  id: string;
  name: string;
  price: number;
  guestLimit: number | null;
  features: Record<string, unknown>;
};

/**
 * Single place that promotes an invitation after payment.
 * MoMo webhook + admin bank confirm both call this.
 */
export async function applyPaidOrder(
  prisma: PrismaService,
  order: Order,
  meta?: { confirmedBy?: string; notifications?: NotificationsService }
) {
  if (order.status === 'paid') {
    return order;
  }
  // invitationId is nullable only after the event was deleted (P07) —
  // a deleted event can no longer be promoted.
  const invitationId = order.invitationId;
  if (!invitationId) {
    throw new BadRequestException('Thiệp của đơn này đã bị xoá.');
  }

  const snap = order.planSnapshot as PlanSnap;
  const guestLimit =
    snap.guestLimit == null || snap.guestLimit <= 0
      ? UNLIMITED_GUESTS
      : snap.guestLimit;

  const updated = await prisma.$transaction(async (tx) => {
    const paid = await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'paid',
        paidAt: new Date(),
        refundable: true,
        confirmedBy: meta?.confirmedBy ?? order.confirmedBy,
        confirmedAt: meta?.confirmedBy ? new Date() : order.confirmedAt,
      },
    });

    await tx.invitation.update({
      where: { id: invitationId },
      data: {
        tier: order.tier,
        guestLimit,
      },
    });

    if (order.discountCode) {
      await tx.discount.updateMany({
        where: { code: order.discountCode.toUpperCase() },
        data: { usedCount: { increment: 1 } },
      });
    }

    return paid;
  });

  if (meta?.notifications) {
    const user = await prisma.user.findUnique({
      where: { id: order.userId },
      select: { email: true },
    });
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      select: { expiresAt: true },
    });
    if (user?.email) {
      await meta.notifications.sendPaidReceipt({
        to: user.email,
        amount: order.amount,
        plan: snap.name,
        invoice: order.shortCode,
        expiresAt: invitation?.expiresAt?.toLocaleDateString('vi-VN') ?? null,
        invitationId,
      });
    }
  }

  return updated;
}

export async function revertToFree(
  prisma: PrismaService,
  order: Order
) {
  const invitationId = order.invitationId;
  if (!invitationId) {
    throw new BadRequestException('Thiệp của đơn này đã bị xoá.');
  }
  return prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: order.id },
      data: { status: 'refunded', refundable: false },
    });
    await tx.invitation.update({
      where: { id: invitationId },
      data: { tier: 'FREE', guestLimit: 30 },
    });
    return updated;
  });
}

export function computeRefundable(
  order: Pick<Order, 'paidAt' | 'status'>,
  invitation: { viewCount: number; bulkSentAt: Date | null }
): boolean {
  if (order.status !== 'paid' || !order.paidAt) return false;
  const within7d =
    Date.now() - order.paidAt.getTime() < 7 * 24 * 60 * 60 * 1000;
  return (
    within7d && invitation.viewCount < 20 && invitation.bulkSentAt == null
  );
}

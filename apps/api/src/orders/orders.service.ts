import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { CreateOrder } from '@wishly/contracts';
import type { Tier } from '@prisma/client';
import { customAlphabet } from 'nanoid';
import type { AuthUser } from '../auth/auth.types';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  applyPaidOrder,
  computeRefundable,
  revertToFree,
} from './apply-paid-order';

const shortNano = customAlphabet('0123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 4);

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService
  ) {}

  private bankConfig() {
    return {
      bin: process.env.BANK_BIN ?? '970422',
      accountNo: process.env.BANK_ACCOUNT_NO ?? '0123456789',
      holder: process.env.BANK_ACCOUNT_HOLDER ?? 'CONG TY TNHH THIEP VIET',
      bankName: process.env.BANK_NAME ?? 'MB Bank',
    };
  }

  private async uniqueShortCode() {
    for (let i = 0; i < 8; i++) {
      const code = `TV-${shortNano()}`;
      const exists = await this.prisma.order.findUnique({
        where: { shortCode: code },
      });
      if (!exists) return code;
    }
    throw new BadRequestException('Không tạo được mã đơn. Thử lại.');
  }

  async create(input: CreateOrder, user: AuthUser) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: input.invitationId },
    });
    if (!invitation) throw new NotFoundException('Không tìm thấy thiệp.');
    if (invitation.ownerId !== user.id) {
      throw new ForbiddenException('Thiệp không thuộc tài khoản này.');
    }

    const plan = await this.prisma.plan.findFirst({
      where: { id: input.planId, active: true },
    });
    if (!plan || plan.price <= 0) {
      throw new BadRequestException('Gói không hợp lệ.');
    }

    const tier = (
      plan.id === 'premium' ? 'PREMIUM' : 'BASIC'
    ) as Tier;

    let amount = plan.price;
    const byEvent = plan.priceByEvent as Record<string, number> | null;
    if (byEvent && byEvent[invitation.eventType] != null) {
      amount = byEvent[invitation.eventType]!;
    }

    let discountCode: string | null = null;
    if (input.discountCode?.trim()) {
      const code = input.discountCode.trim().toUpperCase();
      const discount = await this.prisma.discount.findUnique({
        where: { code },
      });
      if (
        !discount ||
        !discount.active ||
        (discount.expiresAt && discount.expiresAt < new Date()) ||
        (discount.maxUses != null && discount.usedCount >= discount.maxUses)
      ) {
        throw new BadRequestException('Mã giảm giá không hợp lệ hoặc đã hết.');
      }
      amount = Math.max(
        0,
        Math.round(amount * (1 - discount.percent / 100))
      );
      discountCode = code;
    }

    if (input.provider === 'momo') {
      if (!process.env.MOMO_PARTNER_CODE) {
        throw new ServiceUnavailableException(
          'MoMo chưa cấu hình. Dùng chuyển khoản xác nhận tay.'
        );
      }
    }

    const shortCode = await this.uniqueShortCode();
    const planSnapshot = {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      guestLimit: plan.guestLimit,
      features: plan.features,
      eventType: invitation.eventType,
      listPriceApplied: amount,
    };

    const order = await this.prisma.order.create({
      data: {
        userId: user.id,
        invitationId: invitation.id,
        planId: plan.id,
        tier,
        amount,
        planSnapshot,
        discountCode,
        provider: input.provider,
        status: 'pending',
        shortCode,
        invoiceInfo: input.invoiceInfo ?? undefined,
      },
    });

    const bank = this.bankConfig();
    const vietqr = `https://img.vietqr.io/image/${bank.bin}-${bank.accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(shortCode)}&accountName=${encodeURIComponent(bank.holder)}`;

    return {
      order: this.serialize(order),
      payment:
        input.provider === 'bank_manual'
          ? {
              method: 'bank_manual' as const,
              shortCode,
              amount,
              bank,
              vietqrUrl: vietqr,
              transferContent: shortCode,
            }
          : { method: 'momo' as const, payUrl: null as string | null },
    };
  }

  async get(orderId: string, user: AuthUser) {
    const order = await this.findOwned(orderId, user.id);
    if (!order.invitationId) {
      throw new NotFoundException('Thiệp của đơn này đã bị xoá.');
    }
    const invitation = await this.prisma.invitation.findUniqueOrThrow({
      where: { id: order.invitationId },
      select: { viewCount: true, bulkSentAt: true, tier: true, slug: true },
    });
    return {
      ...this.serialize(order),
      refundable: computeRefundable(order, invitation),
      invitation,
      payment:
        order.provider === 'bank_manual' && order.status === 'pending'
          ? {
              method: 'bank_manual' as const,
              shortCode: order.shortCode,
              amount: order.amount,
              bank: this.bankConfig(),
              vietqrUrl: `https://img.vietqr.io/image/${this.bankConfig().bin}-${this.bankConfig().accountNo}-compact2.png?amount=${order.amount}&addInfo=${encodeURIComponent(order.shortCode)}&accountName=${encodeURIComponent(this.bankConfig().holder)}`,
              transferContent: order.shortCode,
            }
          : null,
    };
  }

  async claimPaid(orderId: string, user: AuthUser) {
    const order = await this.findOwned(orderId, user.id);
    if (order.status === 'paid') return this.serialize(order);
    if (order.status !== 'pending') {
      throw new BadRequestException('Đơn không còn chờ thanh toán.');
    }
    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: { claimedAt: new Date() },
    });
    return this.serialize(updated);
  }

  async listPendingManual() {
    return this.prisma.order.findMany({
      where: {
        provider: 'bank_manual',
        status: 'pending',
        claimedAt: { not: null },
      },
      orderBy: { claimedAt: 'asc' },
      take: 100,
    });
  }

  async adminConfirm(orderId: string, adminId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn.');
    if (order.status === 'paid') return this.serialize(order);
    if (order.status !== 'pending') {
      throw new BadRequestException('Đơn không thể xác nhận.');
    }
    const paid = await applyPaidOrder(this.prisma, order, {
      confirmedBy: adminId,
      notifications: this.notifications,
    });
    return this.serialize(paid);
  }

  async adminRefund(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn.');
    if (!order.invitationId) {
      throw new BadRequestException('Thiệp của đơn này đã bị xoá.');
    }
    const invitation = await this.prisma.invitation.findUniqueOrThrow({
      where: { id: order.invitationId },
      select: { viewCount: true, bulkSentAt: true },
    });
    if (!computeRefundable(order, invitation)) {
      throw new BadRequestException(
        'Đơn không đủ điều kiện hoàn tiền (7 ngày · <20 view · chưa gửi hàng loạt).'
      );
    }
    const refunded = await revertToFree(this.prisma, order);
    return this.serialize(refunded);
  }

  private async findOwned(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn.');
    if (order.userId !== userId) {
      throw new ForbiddenException('Đơn không thuộc tài khoản này.');
    }
    return order;
  }

  private serialize(order: {
    id: string;
    userId: string;
    invitationId: string | null;
    planId: string;
    tier: string;
    amount: number;
    planSnapshot: unknown;
    discountCode: string | null;
    provider: string;
    status: string;
    shortCode: string;
    invoiceInfo: unknown;
    refundable: boolean;
    claimedAt: Date | null;
    confirmedBy: string | null;
    confirmedAt: Date | null;
    paidAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: order.id,
      invitationId: order.invitationId,
      planId: order.planId,
      tier: order.tier,
      amount: order.amount,
      planSnapshot: order.planSnapshot,
      discountCode: order.discountCode,
      provider: order.provider,
      status: order.status,
      shortCode: order.shortCode,
      invoiceInfo: order.invoiceInfo,
      refundable: order.refundable,
      claimedAt: order.claimedAt,
      confirmedBy: order.confirmedBy,
      confirmedAt: order.confirmedAt,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
    };
  }
}

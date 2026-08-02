import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { withAdvisoryLock } from '../common/advisory-lock';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

const LOCK_POST_EVENT = 42103;

/**
 * Owner-only reminders. Never sends ZNS/email to guests.
 */
@Injectable()
export class PostEventCron {
  private readonly logger = new Logger(PostEventCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService
  ) {}

  @Cron('0 4 * * *')
  async runOwnerReminders() {
    await withAdvisoryLock(this.prisma, LOCK_POST_EVENT, async () => {
      await this.albumPending();
      await this.thanksNudge();
      await this.albumClosing();
      await this.anniversary();
    });
  }

  private async albumPending() {
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);
    const dayAgoEnd = new Date(dayAgo);
    dayAgoEnd.setHours(23, 59, 59, 999);
    dayAgo.setHours(0, 0, 0, 0);

    const albums = await this.prisma.album.findMany({
      where: {
        invitation: {
          status: { in: ['PUBLISHED', 'ENDED'] },
          eventDate: { gte: dayAgo, lte: dayAgoEnd },
          owner: { email: { not: null } },
        },
        photos: { some: { status: 'pending' } },
      },
      include: {
        invitation: { include: { owner: true } },
        _count: { select: { photos: { where: { status: 'pending' } } } },
      },
    });

    for (const a of albums) {
      const email = a.invitation.owner?.email;
      if (!email) continue;
      const title = invitationTitle(a.invitation.content, a.invitation.slug);
      await this.notifications.sendOwnerReminder({
        to: email,
        invitationId: a.invitationId,
        messageKey: 'email.albumPending',
        vars: {
          invitation_title: title,
          pending_count: String(a._count.photos),
        },
        ctaLabel: 'Duyệt ảnh album',
        ctaPath: `/edit/${a.invitationId}/post-event`,
      });
    }
  }

  private async thanksNudge() {
    const target = new Date();
    target.setDate(target.getDate() - 3);
    const start = new Date(target);
    start.setHours(0, 0, 0, 0);
    const end = new Date(target);
    end.setHours(23, 59, 59, 999);

    const invitations = await this.prisma.invitation.findMany({
      where: {
        status: { in: ['PUBLISHED', 'ENDED'] },
        eventDate: { gte: start, lte: end },
        owner: { email: { not: null } },
      },
      include: { owner: true },
    });

    for (const inv of invitations) {
      const email = inv.owner?.email;
      if (!email) continue;
      await this.notifications.sendOwnerReminder({
        to: email,
        invitationId: inv.id,
        messageKey: 'email.thanksNudge',
        vars: {
          invitation_title: invitationTitle(inv.content, inv.slug),
          days: '3',
        },
        ctaLabel: 'Chép tin cảm ơn',
        ctaPath: `/edit/${inv.id}/post-event`,
      });
    }
  }

  private async albumClosing() {
    const in3 = new Date();
    in3.setDate(in3.getDate() + 3);
    const start = new Date(in3);
    start.setHours(0, 0, 0, 0);
    const end = new Date(in3);
    end.setHours(23, 59, 59, 999);

    const albums = await this.prisma.album.findMany({
      where: {
        closesAt: { gte: start, lte: end },
        invitation: { owner: { email: { not: null } } },
      },
      include: { invitation: { include: { owner: true } } },
    });

    for (const a of albums) {
      const email = a.invitation.owner?.email;
      if (!email) continue;
      await this.notifications.sendOwnerReminder({
        to: email,
        invitationId: a.invitationId,
        messageKey: 'email.albumClosing',
        vars: {
          invitation_title: invitationTitle(
            a.invitation.content,
            a.invitation.slug
          ),
          closes_at: a.closesAt.toLocaleDateString('vi-VN'),
        },
        ctaLabel: 'Tải album',
        ctaPath: `/edit/${a.invitationId}/post-event`,
      });
    }
  }

  private async anniversary() {
    const yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    const start = new Date(yearAgo);
    start.setHours(0, 0, 0, 0);
    const end = new Date(yearAgo);
    end.setHours(23, 59, 59, 999);

    const invitations = await this.prisma.invitation.findMany({
      where: {
        publishedAt: { gte: start, lte: end },
        owner: { email: { not: null } },
        recapToken: { not: null },
      },
      include: { owner: true },
    });

    for (const inv of invitations) {
      const email = inv.owner?.email;
      if (!email) continue;
      await this.notifications.sendOwnerReminder({
        to: email,
        invitationId: inv.id,
        messageKey: 'email.anniversary',
        vars: {
          invitation_title: invitationTitle(inv.content, inv.slug),
        },
        ctaLabel: 'Xem tổng kết',
        ctaPath: `/edit/${inv.id}/post-event`,
      });
    }
    this.logger.log(`anniversary reminders: ${invitations.length}`);
  }
}

function invitationTitle(content: unknown, slug: string): string {
  const cover = (content as { cover?: { nameLeft?: string; nameRight?: string } })
    ?.cover;
  if (cover?.nameLeft && cover?.nameRight) {
    return `${cover.nameLeft} & ${cover.nameRight}`;
  }
  return slug;
}

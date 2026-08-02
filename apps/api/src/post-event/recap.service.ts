import { Injectable, NotFoundException } from '@nestjs/common';
import type { UpdateRecapPrivacy } from '@wishly/contracts';
import type { AuthUser } from '../auth/auth.types';
import { InvitationsService } from '../invitations/invitations.service';
import { MediaService } from '../media/media.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invitations: InvitationsService,
    private readonly media: MediaService
  ) {}

  async getOwner(
    invitationId: string,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    const inv = await this.invitations.assertCanAccess(invitationId, user, anonSessionId);
    return this.buildRecap(inv.id, {
      includeGift: true,
      shareToken: inv.recapToken,
      showGiftOnRecap: inv.showGiftOnRecap,
    });
  }

  async getPublic(shareToken: string) {
    const inv = await this.prisma.invitation.findFirst({
      where: {
        recapToken: shareToken,
        status: { in: ['PUBLISHED', 'ENDED'] },
      },
    });
    if (!inv) throw new NotFoundException('Không tìm thấy trang tổng kết.');
    return this.buildRecap(inv.id, {
      includeGift: inv.showGiftOnRecap,
      shareToken: inv.recapToken,
      showGiftOnRecap: inv.showGiftOnRecap,
      public: true,
    });
  }

  async updatePrivacy(
    invitationId: string,
    input: UpdateRecapPrivacy,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    await this.invitations.assertCanAccess(invitationId, user, anonSessionId, { write: true });
    return this.prisma.invitation.update({
      where: { id: invitationId },
      data: { showGiftOnRecap: input.showGiftOnRecap },
      select: { showGiftOnRecap: true, recapToken: true },
    });
  }

  private async buildRecap(
    invitationId: string,
    opts: {
      includeGift: boolean;
      shareToken: string | null;
      showGiftOnRecap: boolean;
      public?: boolean;
    }
  ) {
    const inv = await this.prisma.invitation.findUniqueOrThrow({
      where: { id: invitationId },
      include: { album: true },
    });
    const content = inv.content as {
      cover?: { nameLeft?: string; nameRight?: string; dateLine?: string };
    };
    const title =
      content.cover?.nameLeft && content.cover?.nameRight
        ? `${content.cover.nameLeft} & ${content.cover.nameRight}`
        : inv.slug;

    const [checkedIn, rsvpYes, wishes, gifts, photos, wishSamples] =
      await Promise.all([
        this.prisma.guest.count({
          where: { invitationId, checkedInAt: { not: null } },
        }),
        this.prisma.rsvp.count({
          where: { invitationId, attending: true },
        }),
        this.prisma.guestbookEntry.count({
          where: { invitationId, status: 'approved' },
        }),
        this.prisma.giftEntry.aggregate({
          where: { invitationId },
          _sum: { amount: true },
          _count: true,
        }),
        inv.album
          ? this.prisma.albumPhoto.findMany({
              where: { albumId: inv.album.id, status: 'ok' },
              orderBy: { createdAt: 'desc' },
              take: 24,
              select: { id: true, mediaKey: true, uploaderName: true },
            })
          : Promise.resolve([]),
        this.prisma.guestbookEntry.findMany({
          where: { invitationId, status: 'approved' },
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: { name: true, message: true },
        }),
      ]);

    const attended = checkedIn > 0 ? checkedIn : rsvpYes;
    const giftTotal = gifts._sum.amount ?? 0;

    return {
      title,
      slug: inv.slug,
      eventDate: inv.eventDate,
      shareToken: opts.shareToken,
      showGiftOnRecap: opts.showGiftOnRecap,
      stats: {
        attended,
        wishes,
        photos: photos.length,
        giftCount: gifts._count,
        giftTotal: opts.includeGift ? giftTotal : null,
        views: inv.viewCount,
      },
      wishSamples: wishSamples.map((w) => ({
        name: w.name,
        text: w.message,
      })),
      photos: photos.map((p) => ({
        id: p.id,
        url: this.media.resolvePublicUrl(p.mediaKey),
        uploaderName: p.uploaderName,
      })),
      albumSlug: inv.slug,
      upsell: {
        anniversary: true,
        babyMonth: true,
        birthday: true,
        openingSoon: true,
      },
    };
  }
}

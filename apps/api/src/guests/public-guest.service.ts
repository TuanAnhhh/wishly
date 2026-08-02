import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PublicGuestbook, PublicRsvp } from '@wishly/contracts';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicGuestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService
  ) {}

  async submitRsvp(input: PublicRsvp) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: input.invitationId },
    });
    if (!invitation || invitation.status !== 'PUBLISHED') {
      throw new NotFoundException('Thiệp không còn nhận xác nhận.');
    }

    const plusOnes = input.plusOnes ?? 0;
    if (invitation.eventType === 'CORPORATE' && plusOnes > 2) {
      throw new BadRequestException(
        'Thiệp doanh nghiệp chỉ cho phép tối đa 2 người đi kèm.'
      );
    }

    let guestId: string | null = null;
    if (input.guestToken) {
      const guest = await this.prisma.guest.findUnique({
        where: { token: input.guestToken },
      });
      if (!guest || guest.invitationId !== invitation.id) {
        throw new BadRequestException('Mã khách không khớp thiệp này.');
      }
      guestId = guest.id;
    }

    const rsvp = await this.prisma.rsvp.create({
      data: {
        invitationId: invitation.id,
        guestId,
        name: input.name.trim(),
        attending: input.attending,
        plusOnes,
        note: input.note?.trim() || null,
      },
    });

    if (guestId) {
      // Seating unit is party size — sync unless owner overrode manually (P08).
      await this.prisma.guest.updateMany({
        where: { id: guestId, partySizeManual: false },
        data: { partySize: Math.max(1, 1 + rsvp.plusOnes) },
      });
      if (invitation.eventType === 'CORPORATE') {
        // Meal/allergy/lang are sensitive — owner-only surfaces; not in RSVP response.
        await this.prisma.guest.update({
          where: { id: guestId },
          data: {
            mealChoice: input.attending ? input.mealChoice ?? null : null,
            allergyNote: input.attending
              ? input.allergyNote?.trim() || null
              : null,
            lang: input.lang ?? null,
          },
        });
      }
    }

    if (rsvp.attending) {
      void this.notifications.sendRsvpAlert({
        invitationId: invitation.id,
        guestName: rsvp.name,
        companionCount: rsvp.plusOnes,
        wish: rsvp.note,
      });
    }

    return {
      id: rsvp.id,
      attending: rsvp.attending,
      message: rsvp.attending
        ? 'Cảm ơn bạn đã xác nhận sẽ đến!'
        : 'Cảm ơn bạn đã phản hồi.',
    };
  }

  async submitGuestbook(input: PublicGuestbook) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: input.invitationId },
    });
    if (!invitation || invitation.status !== 'PUBLISHED') {
      throw new NotFoundException('Thiệp không còn nhận lời chúc.');
    }
    const entry = await this.prisma.guestbookEntry.create({
      data: {
        invitationId: invitation.id,
        name: input.name.trim(),
        message: input.message.trim(),
        status: 'pending',
      },
    });
    return {
      id: entry.id,
      status: entry.status,
      message: 'Lời chúc đã gửi — chủ thiệp sẽ duyệt trước khi hiện công khai.',
    };
  }

  async listApprovedWishes(invitationId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
    });
    if (
      !invitation ||
      (invitation.status !== 'PUBLISHED' && invitation.status !== 'ENDED')
    ) {
      throw new NotFoundException('Không tìm thấy thiệp.');
    }
    const rows = await this.prisma.guestbookEntry.findMany({
      where: { invitationId, status: 'approved' },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { name: true, message: true, createdAt: true },
    });
    return rows.map((r) => ({
      name: r.name,
      text: r.message,
      time: r.createdAt.toISOString(),
    }));
  }

  async listGuestbookForOwner(invitationId: string) {
    return this.prisma.guestbookEntry.findMany({
      where: { invitationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async moderate(
    invitationId: string,
    entryId: string,
    status: 'approved' | 'hidden' | 'pending'
  ) {
    const entry = await this.prisma.guestbookEntry.findUnique({
      where: { id: entryId },
    });
    if (!entry || entry.invitationId !== invitationId) {
      throw new NotFoundException('Không tìm thấy lời chúc.');
    }
    return this.prisma.guestbookEntry.update({
      where: { id: entryId },
      data: { status },
    });
  }
}

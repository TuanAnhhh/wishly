import { Injectable, NotFoundException } from '@nestjs/common';
import {
  computePersona,
  PERSONA_LABELS,
  renderMessage,
  type MarkThanksSent,
  type OverridePersona,
  type ThankYouPersona,
} from '@wishly/contracts';
import type { AuthUser } from '../auth/auth.types';
import { InvitationsService } from '../invitations/invitations.service';
import { PrismaService } from '../prisma/prisma.service';

function coverNames(content: unknown): { left: string; right: string } {
  const cover = (content as { cover?: { nameLeft?: string; nameRight?: string } })
    ?.cover;
  return {
    left: cover?.nameLeft ?? 'Cô dâu',
    right: cover?.nameRight ?? 'Chú rể',
  };
}

@Injectable()
export class ThanksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invitations: InvitationsService
  ) {}

  async recipients(
    invitationId: string,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    const inv = await this.invitations.assertCanAccess(invitationId, user, anonSessionId);
    const names = coverNames(inv.content);
    const [guests, gifts, sent] = await Promise.all([
      this.prisma.guest.findMany({
        where: { invitationId },
        orderBy: [{ group: 'asc' }, { name: 'asc' }],
        include: {
          rsvps: { orderBy: { createdAt: 'desc' }, take: 1 },
          giftEntries: { take: 1 },
        },
      }),
      this.prisma.giftEntry.findMany({
        where: { invitationId },
        select: { guestId: true, giverName: true },
      }),
      this.prisma.thankYouSend.findMany({
        where: { invitationId },
        select: { guestId: true, persona: true, sentAt: true },
      }),
    ]);
    const sentMap = new Map(sent.map((s) => [s.guestId, s]));
    const giftByGuest = new Set(
      gifts.filter((g) => g.guestId).map((g) => g.guestId as string)
    );
    const giftByName = new Set(
      gifts.map((g) => g.giverName.trim().toLowerCase())
    );

    const rows = guests.map((g) => {
      const persona = computePersona({
        hasGift:
          g.giftEntries.length > 0 ||
          giftByGuest.has(g.id) ||
          giftByName.has(g.name.trim().toLowerCase()),
        attending: g.rsvps[0]?.attending,
        override: (g.thanksPersona as ThankYouPersona | null) ?? null,
      });
      const preview = renderMessage(
        `zns.thanks.${persona}`,
        {
          guest_name: g.name,
          bride_name: names.left,
          groom_name: names.right,
          role: g.role ?? 'bạn',
        },
        'formal'
      );
      const already = sentMap.get(g.id);
      return {
        guestId: g.id,
        name: g.name,
        group: g.group,
        persona,
        personaLabel: PERSONA_LABELS[persona],
        preview,
        sentAt: already?.sentAt ?? null,
      };
    });

    const counts: Record<ThankYouPersona, number> = {
      gift: 0,
      came: 0,
      absent: 0,
      quiet: 0,
    };
    for (const r of rows) counts[r.persona] += 1;

    return { recipients: rows, counts };
  }

  async overridePersona(
    invitationId: string,
    guestId: string,
    input: OverridePersona,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    await this.invitations.assertCanAccess(invitationId, user, anonSessionId, { write: true });
    const guest = await this.prisma.guest.findFirst({
      where: { id: guestId, invitationId },
    });
    if (!guest) throw new NotFoundException('Không tìm thấy khách.');
    await this.prisma.guest.update({
      where: { id: guestId },
      data: { thanksPersona: input.persona },
    });
    return { guestId, persona: input.persona };
  }

  async markSent(
    invitationId: string,
    input: MarkThanksSent,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    const data = await this.recipients(invitationId, user, anonSessionId);
    const byId = new Map(data.recipients.map((r) => [r.guestId, r]));
    let marked = 0;
    for (const guestId of input.guestIds) {
      const row = byId.get(guestId);
      if (!row) continue;
      await this.prisma.thankYouSend.upsert({
        where: {
          invitationId_guestId: { invitationId, guestId },
        },
        create: {
          invitationId,
          guestId,
          persona: row.persona,
        },
        update: { persona: row.persona, sentAt: new Date() },
      });
      marked += 1;
    }
    return { marked };
  }
}

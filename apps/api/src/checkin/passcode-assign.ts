import { formatPassCode, passCodePrefix } from '@wishly/contracts';
import type { PrismaService } from '../prisma/prisma.service';

/** Assign passCodes to guests missing one (publish / backfill). */
export async function ensurePassCodes(
  prisma: PrismaService,
  invitationId: string
) {
  const invitation = await prisma.invitation.findUniqueOrThrow({
    where: { id: invitationId },
    select: { slug: true, eventDate: true },
  });
  const guests = await prisma.guest.findMany({
    where: { invitationId, passCode: null },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  if (!guests.length) return;

  const existing = await prisma.guest.count({
    where: { invitationId, passCode: { not: null } },
  });
  let seq = existing + 1;
  const year = (invitation.eventDate ?? new Date()).getFullYear();
  const prefix = passCodePrefix(invitation.slug);

  for (const g of guests) {
    let code = formatPassCode(prefix, year, seq);
    for (let attempt = 0; attempt < 20; attempt++) {
      const clash = await prisma.guest.findUnique({ where: { passCode: code } });
      if (!clash) break;
      seq += 1;
      code = formatPassCode(prefix, year, seq);
    }
    await prisma.guest.update({
      where: { id: g.id },
      data: { passCode: code },
    });
    seq += 1;
  }
}

export async function assignPassCodeIfPublished(
  prisma: PrismaService,
  invitationId: string,
  guestId: string
) {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    select: { slug: true, eventDate: true, status: true },
  });
  if (!invitation || invitation.status !== 'PUBLISHED') return;

  const guest = await prisma.guest.findUnique({ where: { id: guestId } });
  if (!guest || guest.passCode) return;

  const existing = await prisma.guest.count({
    where: { invitationId, passCode: { not: null } },
  });
  const year = (invitation.eventDate ?? new Date()).getFullYear();
  const prefix = passCodePrefix(invitation.slug);
  let seq = existing + 1;
  for (let i = 0; i < 50; i++) {
    const code = formatPassCode(prefix, year, seq);
    const clash = await prisma.guest.findUnique({ where: { passCode: code } });
    if (!clash) {
      await prisma.guest.update({
        where: { id: guestId },
        data: { passCode: code },
      });
      return;
    }
    seq += 1;
  }
}

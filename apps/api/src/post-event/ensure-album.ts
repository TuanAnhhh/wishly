import { nanoid } from 'nanoid';
import type { PrismaClient } from '@prisma/client';

/** Idempotent — safe on every publish. */
export async function ensureAlbumOnPublish(
  prisma: PrismaClient,
  invitationId: string
) {
  const inv = await prisma.invitation.findUniqueOrThrow({
    where: { id: invitationId },
    select: {
      eventDate: true,
      publishedAt: true,
      recapToken: true,
      album: { select: { id: true } },
    },
  });
  const opensAt = inv.eventDate ?? inv.publishedAt ?? new Date();
  const closesAt = new Date(opensAt);
  closesAt.setDate(closesAt.getDate() + 30);

  if (!inv.album) {
    await prisma.album.create({
      data: {
        invitationId,
        title: 'Album ảnh',
        opensAt,
        closesAt,
      },
    });
  }
  if (!inv.recapToken) {
    await prisma.invitation.update({
      where: { id: invitationId },
      data: { recapToken: nanoid(12) },
    });
  }
}

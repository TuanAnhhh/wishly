import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { withAdvisoryLock } from '../common/advisory-lock';

const LOCK_ANON_DRAFTS = 42100;
const LOCK_MARK_EXPIRED = 42101;
const LOCK_PURGE_GUEST_DATA = 42102;

@Injectable()
export class InvitationsCleanupService {
  private readonly logger = new Logger(InvitationsCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Draft anonymous chưa claim > 30 ngày */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purgeStaleAnonDrafts() {
    await withAdvisoryLock(this.prisma, LOCK_ANON_DRAFTS, async () => {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const result = await this.prisma.invitation.deleteMany({
        where: {
          ownerId: null,
          anonSessionId: { not: null },
          status: 'DRAFT',
          createdAt: { lt: cutoff },
        },
      });
      if (result.count > 0) {
        this.logger.log(
          `Purged ${result.count} anonymous draft(s) older than 30d`
        );
      }
    });
  }

  /**
   * PUBLISHED -> ENDED once expiresAt passes. Never deletes anything —
   * ENDED is read-only, not gone. Runs before purgeGuestData so a freshly
   * ended invitation is picked up by both jobs in the same night if needed.
   */
  @Cron('15 3 * * *')
  async markExpired() {
    await withAdvisoryLock(this.prisma, LOCK_MARK_EXPIRED, async () => {
      const result = await this.prisma.invitation.updateMany({
        where: { status: 'PUBLISHED', expiresAt: { lt: new Date() } },
        data: { status: 'ENDED' },
      });
      if (result.count > 0) {
        this.logger.log(`Marked ${result.count} invitation(s) ENDED`);
      }
    });
  }

  /**
   * Anonymises guest PII past purgeAt. Never deleteMany(Guest) — that
   * cascades Rsvp.guestId to null and corrupts the "N khách đã đến"
   * aggregate the owner is entitled to keep. Guestbook wishes and photos
   * are untouched by design (see privacy-data.md §04).
   */
  @Cron('30 3 * * *')
  async purgeGuestData() {
    await withAdvisoryLock(this.prisma, LOCK_PURGE_GUEST_DATA, async () => {
      const due = await this.prisma.invitation.findMany({
        where: { purgeAt: { lt: new Date() }, purgedAt: null },
        select: { id: true },
      });
      if (due.length === 0) return;

      const ids = due.map((d) => d.id);
      const [guestResult, rsvpResult] = await Promise.all([
        this.prisma.guest.updateMany({
          where: { invitationId: { in: ids } },
          data: { name: '[đã xoá]', phone: null, note: null },
        }),
        this.prisma.rsvp.updateMany({
          where: { invitationId: { in: ids } },
          data: { name: '[đã xoá]', note: null },
        }),
      ]);
      await this.prisma.invitation.updateMany({
        where: { id: { in: ids } },
        data: { purgedAt: new Date() },
      });
      this.logger.log(
        `Purged guest data for ${ids.length} invitation(s): ` +
          `${guestResult.count} guest(s), ${rsvpResult.count} rsvp(s) anonymised`
      );
    });
  }
}

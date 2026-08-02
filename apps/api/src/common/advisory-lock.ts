import { Logger } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';

const logger = new Logger('AdvisoryLock');

/**
 * Runs `fn` only if this instance acquires the Postgres advisory lock for
 * `key`. Required around every cron that writes/deletes data — @Cron runs on
 * every instance, and a single-instance deploy today doesn't guarantee that
 * stays true. Cheap to add now, expensive to retrofit after a double-delete.
 */
export async function withAdvisoryLock(
  prisma: PrismaService,
  key: number,
  fn: () => Promise<void>
): Promise<void> {
  const rows = await prisma.$queryRaw<Array<{ locked: boolean }>>`
    SELECT pg_try_advisory_lock(${key}) AS locked
  `;
  const acquired = rows[0]?.locked === true;
  if (!acquired) {
    logger.log(`Skipped — lock ${key} held by another instance`);
    return;
  }
  try {
    await fn();
  } finally {
    await prisma.$queryRaw`SELECT pg_advisory_unlock(${key})`;
  }
}

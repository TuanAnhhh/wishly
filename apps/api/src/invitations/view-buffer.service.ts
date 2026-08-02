import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Batches public view increments and flushes every 30s. */
@Injectable()
export class ViewBufferService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(ViewBufferService.name);
  private readonly buf = new Map<string, number>();
  private timer?: ReturnType<typeof setInterval>;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.flush().catch((err) =>
        this.log.warn(`view flush failed: ${String(err)}`)
      );
    }, 30_000);
    this.timer.unref?.();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    return this.flush();
  }

  bump(invitationId: string) {
    this.buf.set(invitationId, (this.buf.get(invitationId) ?? 0) + 1);
  }

  async flush() {
    const entries = [...this.buf.entries()];
    this.buf.clear();
    await Promise.all(
      entries.map(([id, n]) =>
        this.prisma.invitation.update({
          where: { id },
          data: { viewCount: { increment: n } },
        })
      )
    );
  }
}

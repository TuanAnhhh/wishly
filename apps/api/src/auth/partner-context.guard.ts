import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { PartnerRole } from '@wishly/contracts';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from './auth.types';
import type { PartnerContext } from './partner.types';

/**
 * Runs after JwtAuthGuard — loads PartnerMember onto req.partner.
 * Middleware cannot see req.user (guards run after middleware).
 */
@Injectable()
export class PartnerContextGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      user?: AuthUser;
      partner?: PartnerContext;
      query?: { partnerId?: string };
      headers: Record<string, string | string[] | undefined>;
    }>();
    const user = req.user;
    if (!user?.id) return true;

    const header = req.headers['x-partner-id'];
    const requested =
      req.query?.partnerId ||
      (typeof header === 'string' ? header : undefined);

    const members = await this.prisma.partnerMember.findMany({
      where: {
        userId: user.id,
        joinedAt: { not: null },
        partner: { status: { in: ['active', 'past_due'] } },
      },
      include: {
        partner: { select: { id: true, status: true, slotLimit: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });
    if (!members.length) return true;

    const pick =
      (requested && members.find((m) => m.partnerId === requested)) ||
      members.find((m) => m.role === 'admin') ||
      members[0]!;

    req.partner = {
      partnerId: pick.partnerId,
      memberId: pick.id,
      role: pick.role as PartnerRole,
      partnerStatus: pick.partner.status,
      slotLimit: pick.partner.slotLimit,
    };

    void this.prisma.partnerMember
      .update({
        where: { id: pick.id },
        data: { lastSeenAt: new Date() },
      })
      .catch(() => undefined);

    return true;
  }
}

import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import type { AnonRequest } from './anon-session.middleware';
import type { AuthUser } from './auth.types';
import type { PartnerContext } from './partner.types';
import { PrismaService } from '../prisma/prisma.service';

type PartnerRequest = AnonRequest & {
  user?: AuthUser;
  partner?: PartnerContext;
};

/**
 * Loads active PartnerMembership for the logged-in user onto req.partner.
 * If multiple memberships, prefers ?partnerId= or first joined admin.
 */
@Injectable()
export class PartnerContextMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: PartnerRequest, _res: Response, next: NextFunction) {
    const user = req.user;
    if (!user?.id) {
      next();
      return;
    }
    const requested =
      (typeof req.query.partnerId === 'string' && req.query.partnerId) ||
      (typeof req.headers['x-partner-id'] === 'string'
        ? req.headers['x-partner-id']
        : undefined);

    const members = await this.prisma.partnerMember.findMany({
      where: {
        userId: user.id,
        joinedAt: { not: null },
        partner: { status: { in: ['active', 'past_due'] } },
      },
      include: { partner: { select: { id: true, status: true, slotLimit: true } } },
      orderBy: { joinedAt: 'asc' },
    });
    if (!members.length) {
      next();
      return;
    }
    const pick =
      (requested && members.find((m) => m.partnerId === requested)) ||
      members.find((m) => m.role === 'admin') ||
      members[0]!;

    req.partner = {
      partnerId: pick.partnerId,
      memberId: pick.id,
      role: pick.role as PartnerContext['role'],
      partnerStatus: pick.partner.status,
      slotLimit: pick.partner.slotLimit,
    };

    void this.prisma.partnerMember
      .update({
        where: { id: pick.id },
        data: { lastSeenAt: new Date() },
      })
      .catch(() => undefined);

    next();
  }
}

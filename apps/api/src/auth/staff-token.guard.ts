import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { StaffContext } from './staff.decorator';

@Injectable()
export class StaffTokenGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      query: Record<string, string | undefined>;
      staff?: StaffContext;
    }>();

    const token =
      req.headers['x-staff-token']?.trim() ||
      req.query.s?.trim() ||
      '';

    if (!token || token.length < 12) {
      throw new UnauthorizedException('Thiếu mã nhân viên quầy.');
    }

    const access = await this.prisma.staffAccess.findUnique({
      where: { token },
    });
    if (!access || access.revokedAt) {
      throw new UnauthorizedException('Link nhân viên đã bị thu hồi.');
    }
    if (access.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Link nhân viên đã hết hạn.');
    }

    await this.prisma.staffAccess.update({
      where: { id: access.id },
      data: { lastSeenAt: new Date() },
    });

    req.staff = {
      invitationId: access.invitationId,
      label: access.label,
      staffAccessId: access.id,
    };
    return true;
  }
}

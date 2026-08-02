import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { PartnerRole } from '@wishly/contracts';
import type { PartnerContext } from './partner.types';

export const PARTNER_ROLES_KEY = 'partner_roles';
export const PartnerRoles = (...roles: PartnerRole[]) =>
  SetMetadata(PARTNER_ROLES_KEY, roles);

@Injectable()
export class PartnerRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<PartnerRole[]>(
      PARTNER_ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (!roles?.length) return true;

    const req = context.switchToHttp().getRequest<{
      partner?: PartnerContext;
    }>();
    const partner = req.partner;
    if (!partner) {
      throw new ForbiddenException('Bạn chưa thuộc studio đối tác nào.');
    }
    if (!roles.includes(partner.role)) {
      throw new ForbiddenException('Bạn không có quyền thao tác này.');
    }
    return true;
  }
}

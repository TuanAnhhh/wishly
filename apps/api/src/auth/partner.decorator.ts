import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { PartnerContext } from './partner.types';

export const CurrentPartner = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PartnerContext | undefined => {
    const req = ctx.switchToHttp().getRequest<{ partner?: PartnerContext }>();
    return req.partner;
  }
);

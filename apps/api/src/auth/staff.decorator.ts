import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type StaffContext = {
  invitationId: string;
  label: string;
  staffAccessId: string;
};

export const Staff = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): StaffContext => {
    const req = ctx.switchToHttp().getRequest<{ staff?: StaffContext }>();
    if (!req.staff) {
      throw new Error('Staff decorator used without StaffTokenGuard');
    }
    return req.staff;
  }
);

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const expected = process.env.ADMIN_SECRET;
    const secret = request.headers['x-admin-secret'];
    if (!expected || !secret || secret !== expected) {
      throw new ForbiddenException('Admin only.');
    }
    return true;
  }
}

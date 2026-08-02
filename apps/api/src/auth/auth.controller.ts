import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from '../common/public.decorator';
import { AuthService } from './auth.service';
import type { AuthUser } from './auth.types';
import { CurrentUser } from './current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('dev-login')
  async devLogin(@Res({ passthrough: true }) res: Response) {
    const user = await this.auth.devLogin();
    this.auth.setAuthCookies(res, user);
    return { user };
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const token = req.cookies?.['refresh_token'] as string | undefined;
    if (!token) {
      throw new UnauthorizedException('Thiếu refresh token.');
    }
    const user = await this.auth.refreshFromToken(token);
    this.auth.setAuthCookies(res, user);
    return { user };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return { user };
  }

  @Public()
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    this.auth.clearAuthCookies(res);
    return { ok: true };
  }
}

import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { Public } from '../common/public.decorator';
import { AuthService } from './auth.service';
import type { AuthUser } from './auth.types';
import { GoogleAuthGuard } from './google-auth.guard';

const RETURN_COOKIE = 'oauth_return';

function isSafeReturnTo(
  value: string | undefined,
  allowedOrigins: string[]
): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return allowedOrigins.some((origin) => origin === url.origin);
  } catch {
    return false;
  }
}

@Controller('auth')
export class GoogleAuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService
  ) {}

  private allowedOrigins() {
    return [
      this.config.get<string>('WEB_ORIGIN') ?? 'http://localhost:4200',
      this.config.get<string>('STUDIO_ORIGIN') ?? 'http://localhost:4201',
    ];
  }

  /** Set return cookie then hand off to Passport Google. */
  @Public()
  @Get('google')
  beginGoogle(
    @Query('returnTo') returnTo: string | undefined,
    @Res() res: Response
  ) {
    if (isSafeReturnTo(returnTo, this.allowedOrigins())) {
      res.cookie(RETURN_COOKIE, returnTo, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 10 * 60 * 1000,
      });
    } else {
      res.clearCookie(RETURN_COOKIE);
    }
    return res.redirect('/api/auth/google/oauth');
  }

  @Public()
  @Get('google/oauth')
  @UseGuards(GoogleAuthGuard)
  googleOAuth() {
    // Passport redirects to Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  googleCallback(
    @Req() req: Request & { user: AuthUser },
    @Res() res: Response
  ) {
    this.auth.setAuthCookies(res, req.user);
    const raw = req.cookies?.[RETURN_COOKIE] as string | undefined;
    res.clearCookie(RETURN_COOKIE);
    const fallback =
      this.config.get<string>('STUDIO_ORIGIN') ?? 'http://localhost:4201';
    const dest = isSafeReturnTo(raw, this.allowedOrigins()) ? raw : fallback;
    return res.redirect(dest);
  }
}

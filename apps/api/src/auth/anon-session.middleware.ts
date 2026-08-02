import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

const COOKIE_NAME = 'anon_session';

export type AnonRequest = Request & { anonSessionId?: string };

function sign(id: string, secret: string): string {
  const sig = createHmac('sha256', secret).update(id).digest('base64url');
  return `${id}.${sig}`;
}

function verify(value: string, secret: string): string | null {
  const [id, sig] = value.split('.');
  if (!id || !sig) return null;
  const expected = createHmac('sha256', secret).update(id).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return id;
}

@Injectable()
export class AnonSessionMiddleware implements NestMiddleware {
  constructor(private readonly config: ConfigService) {}

  use(req: AnonRequest, res: Response, next: NextFunction) {
    const secret = this.config.getOrThrow<string>('ANON_SESSION_SECRET');
    const raw = req.cookies?.[COOKIE_NAME] as string | undefined;
    let id = raw ? verify(raw, secret) : null;

    if (!id) {
      id = randomBytes(16).toString('base64url');
      res.cookie(COOKIE_NAME, sign(id, secret), {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env['NODE_ENV'] === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/',
      });
    }

    req.anonSessionId = id;
    next();
  }
}

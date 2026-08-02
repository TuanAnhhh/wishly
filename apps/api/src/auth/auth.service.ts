import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser, JwtPayload } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService
  ) {}

  async upsertGoogleUser(profile: {
    email?: string;
    name: string;
    avatarUrl?: string;
  }): Promise<AuthUser> {
    if (!profile.email) {
      throw new UnauthorizedException('Google không trả email.');
    }
    const user = await this.prisma.user.upsert({
      where: { email: profile.email },
      create: {
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        provider: 'google',
      },
      update: {
        name: profile.name,
        avatarUrl: profile.avatarUrl,
      },
    });
    return this.toAuthUser(user);
  }

  async devLogin(): Promise<AuthUser> {
    if (
      process.env['NODE_ENV'] === 'production' ||
      this.config.get('DEV_AUTH_BYPASS') !== '1'
    ) {
      throw new ForbiddenException('DEV_AUTH_BYPASS chỉ dùng khi phát triển.');
    }
    const user = await this.prisma.user.upsert({
      where: { email: 'dev@wishly.local' },
      create: {
        email: 'dev@wishly.local',
        name: 'Dev User',
        provider: 'dev',
      },
      update: {},
    });
    return this.toAuthUser(user);
  }

  setAuthCookies(res: Response, user: AuthUser) {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const accessTtl = this.config.get<string>('JWT_ACCESS_TTL') ?? '15m';
    const refreshTtl = this.config.get<string>('JWT_REFRESH_TTL') ?? '30d';
    const accessToken = this.jwt.sign(payload, {
      expiresIn: accessTtl as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });
    const refreshToken = this.jwt.sign(payload, {
      expiresIn: refreshTtl as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });
    const secure = process.env['NODE_ENV'] === 'production';
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      maxAge: 15 * 60 * 1000,
      path: '/',
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }

  clearAuthCookies(res: Response) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
  }

  async refreshFromToken(refreshToken: string): Promise<AuthUser> {
    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ.');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại.');
    }
    return this.toAuthUser(user);
  }

  private toAuthUser(user: {
    id: string;
    email: string | null;
    phone: string | null;
    name: string;
    avatarUrl: string | null;
    provider: string;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      avatarUrl: user.avatarUrl,
      provider: user.provider,
    };
  }
}

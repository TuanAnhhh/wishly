import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleAuthController } from './google-auth.controller';
import { GoogleStrategy } from './google.strategy';
import { JwtStrategy } from './jwt.strategy';

@Module({})
export class AuthModule {
  static register(): DynamicModule {
    const googleEnabled = Boolean(
      process.env['GOOGLE_CLIENT_ID'] && process.env['GOOGLE_CLIENT_SECRET']
    );

    return {
      module: AuthModule,
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            secret: config.getOrThrow<string>('JWT_SECRET'),
          }),
        }),
      ],
      controllers: [
        AuthController,
        ...(googleEnabled ? [GoogleAuthController] : []),
      ],
      providers: [
        AuthService,
        JwtStrategy,
        ...(googleEnabled ? [GoogleStrategy] : []),
      ],
      exports: [AuthService],
    };
  }
}

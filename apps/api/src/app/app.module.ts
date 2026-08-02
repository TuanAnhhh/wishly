import 'dotenv/config';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AnonSessionMiddleware } from '../auth/anon-session.middleware';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InvitationsModule } from '../invitations/invitations.module';
import { MediaModule } from '../media/media.module';
import { GuestsModule } from '../guests/guests.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrdersModule } from '../orders/orders.module';
import { PlansModule } from '../plans/plans.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CheckinModule } from '../checkin/checkin.module';
import { PartnerModule } from '../partner/partner.module';
import { PostEventModule } from '../post-event/post-event.module';
import { SeatingModule } from '../seating/seating.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    NotificationsModule,
    AuthModule.register(),
    MediaModule,
    InvitationsModule,
    GuestsModule,
    PlansModule,
    OrdersModule,
    SeatingModule,
    CheckinModule,
    PostEventModule,
    PartnerModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AnonSessionMiddleware).forRoutes('*');
  }
}

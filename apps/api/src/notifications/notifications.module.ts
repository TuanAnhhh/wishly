import { Global, Module } from '@nestjs/common';
import { createMailer, MAILER } from './mailer.service';
import { NotificationsService } from './notifications.service';

@Global()
@Module({
  providers: [
    { provide: MAILER, useFactory: createMailer },
    NotificationsService,
  ],
  exports: [NotificationsService, MAILER],
})
export class NotificationsModule {}

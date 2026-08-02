import { Module } from '@nestjs/common';
import { InvitationsModule } from '../invitations/invitations.module';
import { MediaModule } from '../media/media.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AlbumController } from './album.controller';
import { AlbumService } from './album.service';
import { PostEventCron } from './post-event.cron';
import { RecapController } from './recap.controller';
import { RecapService } from './recap.service';
import { ThanksController } from './thanks.controller';
import { ThanksService } from './thanks.service';

@Module({
  imports: [InvitationsModule, MediaModule, NotificationsModule],
  controllers: [AlbumController, ThanksController, RecapController],
  providers: [
    AlbumService,
    ThanksService,
    RecapService,
    PostEventCron,
  ],
  exports: [AlbumService],
})
export class PostEventModule {}

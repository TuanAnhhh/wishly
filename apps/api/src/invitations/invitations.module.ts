import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { OgModule } from '../og/og.module';
import { InvitationsCleanupService } from './invitations.cleanup';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { ViewBufferService } from './view-buffer.service';

@Module({
  imports: [MediaModule, OgModule],
  controllers: [InvitationsController],
  providers: [InvitationsService, InvitationsCleanupService, ViewBufferService],
  exports: [InvitationsService, ViewBufferService],
})
export class InvitationsModule {}

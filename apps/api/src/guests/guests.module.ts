import { Module } from '@nestjs/common';
import { InvitationsModule } from '../invitations/invitations.module';
import { GuestsController } from './guests.controller';
import { GuestsService } from './guests.service';
import { PublicController } from './public.controller';
import { PublicGuestService } from './public-guest.service';

@Module({
  imports: [InvitationsModule],
  controllers: [GuestsController, PublicController],
  providers: [GuestsService, PublicGuestService],
  exports: [GuestsService, PublicGuestService],
})
export class GuestsModule {}

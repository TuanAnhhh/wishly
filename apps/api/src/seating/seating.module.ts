import { Module } from '@nestjs/common';
import { InvitationsModule } from '../invitations/invitations.module';
import { SeatingController } from './seating.controller';
import { SeatingService } from './seating.service';

@Module({
  imports: [InvitationsModule],
  controllers: [SeatingController],
  providers: [SeatingService],
  exports: [SeatingService],
})
export class SeatingModule {}

import { Module } from '@nestjs/common';
import { StaffTokenGuard } from '../auth/staff-token.guard';
import { InvitationsModule } from '../invitations/invitations.module';
import { CheckinController } from './checkin.controller';
import { CheckinService } from './checkin.service';

@Module({
  imports: [InvitationsModule],
  controllers: [CheckinController],
  providers: [CheckinService, StaffTokenGuard],
  exports: [CheckinService],
})
export class CheckinModule {}

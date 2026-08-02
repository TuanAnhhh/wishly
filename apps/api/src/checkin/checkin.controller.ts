import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  CheckinManualSchema,
  CheckinScanSchema,
  CheckinSyncBatchSchema,
  CheckinWalkInSchema,
  CreateStaffAccessSchema,
} from '@wishly/contracts';
import type { AnonRequest } from '../auth/anon-session.middleware';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { Staff, type StaffContext } from '../auth/staff.decorator';
import { StaffTokenGuard } from '../auth/staff-token.guard';
import { HttpExceptionEnvelopeFilter } from '../common/http-exception-envelope.filter';
import { Public } from '../common/public.decorator';
import { ResponseEnvelopeInterceptor } from '../common/response-envelope.interceptor';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CheckinService } from './checkin.service';

@Controller()
@UseInterceptors(ResponseEnvelopeInterceptor)
@UseFilters(HttpExceptionEnvelopeFilter)
export class CheckinController {
  constructor(private readonly checkin: CheckinService) {}

  @Public()
  @UseGuards(StaffTokenGuard)
  @Get('checkin/roster')
  roster(@Staff() staff: StaffContext) {
    return this.checkin.roster(staff);
  }

  @Public()
  @UseGuards(StaffTokenGuard)
  @Throttle({ default: { limit: 90, ttl: 60_000 } })
  @Post('checkin/scan')
  scan(
    @Staff() staff: StaffContext,
    @Body(new ZodValidationPipe(CheckinScanSchema)) body: { passCode: string }
  ) {
    return this.checkin.scan(staff, body.passCode);
  }

  @Public()
  @UseGuards(StaffTokenGuard)
  @Post('checkin/manual')
  manual(
    @Staff() staff: StaffContext,
    @Body(new ZodValidationPipe(CheckinManualSchema)) body: { guestId: string }
  ) {
    return this.checkin.manual(staff, body.guestId);
  }

  @Public()
  @UseGuards(StaffTokenGuard)
  @Post('checkin/walk-in')
  walkIn(
    @Staff() staff: StaffContext,
    @Body(new ZodValidationPipe(CheckinWalkInSchema)) body: unknown
  ) {
    return this.checkin.walkIn(staff, body as never);
  }

  @Public()
  @UseGuards(StaffTokenGuard)
  @Post('checkin/sync')
  sync(
    @Staff() staff: StaffContext,
    @Body(new ZodValidationPipe(CheckinSyncBatchSchema)) body: unknown
  ) {
    return this.checkin.sync(staff, body as never);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('invitations/:id/staff')
  listStaff(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.checkin.listStaff(id, user ?? undefined, req.anonSessionId);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post('invitations/:id/staff')
  createStaff(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CreateStaffAccessSchema)) body: unknown,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.checkin.createStaff(
      id,
      body as never,
      user ?? undefined,
      req.anonSessionId
    );
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Delete('invitations/:id/staff/:sid')
  revokeStaff(
    @Param('id') id: string,
    @Param('sid') sid: string,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.checkin.revokeStaff(
      id,
      sid,
      user ?? undefined,
      req.anonSessionId
    );
  }
}

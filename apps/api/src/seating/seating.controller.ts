import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  AssignGuestSchema,
  CreateSeatingTableSchema,
  UpdateSeatingTableSchema,
} from '@wishly/contracts';
import type { AnonRequest } from '../auth/anon-session.middleware';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { HttpExceptionEnvelopeFilter } from '../common/http-exception-envelope.filter';
import { Public } from '../common/public.decorator';
import { ResponseEnvelopeInterceptor } from '../common/response-envelope.interceptor';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { SeatingService } from './seating.service';

@Controller('invitations/:id/seating')
@Public()
@UseGuards(OptionalJwtAuthGuard)
@UseInterceptors(ResponseEnvelopeInterceptor)
@UseFilters(HttpExceptionEnvelopeFilter)
export class SeatingController {
  constructor(private readonly seating: SeatingService) {}

  @Get()
  get(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.seating.getSeating(id, user ?? undefined, req.anonSessionId);
  }

  @Post('tables')
  createTable(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CreateSeatingTableSchema)) body: unknown,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.seating.createTable(
      id,
      body as never,
      user ?? undefined,
      req.anonSessionId
    );
  }

  @Patch('tables/:tableId')
  updateTable(
    @Param('id') id: string,
    @Param('tableId') tableId: string,
    @Body(new ZodValidationPipe(UpdateSeatingTableSchema)) body: unknown,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.seating.updateTable(
      id,
      tableId,
      body as never,
      user ?? undefined,
      req.anonSessionId
    );
  }

  @Delete('tables/:tableId')
  deleteTable(
    @Param('id') id: string,
    @Param('tableId') tableId: string,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.seating.deleteTable(
      id,
      tableId,
      user ?? undefined,
      req.anonSessionId
    );
  }

  @Patch('assign')
  assign(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AssignGuestSchema)) body: unknown,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.seating.assignGuest(
      id,
      body as never,
      user ?? undefined,
      req.anonSessionId
    );
  }

  @Post('lock')
  lock(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.seating.lock(id, user ?? undefined, req.anonSessionId);
  }
}

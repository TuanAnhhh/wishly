import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { MarkThanksSentSchema, OverridePersonaSchema } from '@wishly/contracts';
import type { AnonRequest } from '../auth/anon-session.middleware';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { HttpExceptionEnvelopeFilter } from '../common/http-exception-envelope.filter';
import { Public } from '../common/public.decorator';
import { ResponseEnvelopeInterceptor } from '../common/response-envelope.interceptor';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ThanksService } from './thanks.service';

@Controller('invitations/:id/thanks')
@Public()
@UseGuards(OptionalJwtAuthGuard)
@UseInterceptors(ResponseEnvelopeInterceptor)
@UseFilters(HttpExceptionEnvelopeFilter)
export class ThanksController {
  constructor(private readonly thanks: ThanksService) {}

  @Get('recipients')
  recipients(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.thanks.recipients(id, user ?? undefined, req.anonSessionId);
  }

  @Patch('recipients/:guestId')
  override(
    @Param('id') id: string,
    @Param('guestId') guestId: string,
    @Body(new ZodValidationPipe(OverridePersonaSchema)) body: unknown,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.thanks.overridePersona(
      id,
      guestId,
      body as never,
      user ?? undefined,
      req.anonSessionId
    );
  }

  @Post('mark-sent')
  markSent(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(MarkThanksSentSchema)) body: unknown,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.thanks.markSent(
      id,
      body as never,
      user ?? undefined,
      req.anonSessionId
    );
  }
}

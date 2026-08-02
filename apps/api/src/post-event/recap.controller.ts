import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UpdateRecapPrivacySchema } from '@wishly/contracts';
import type { AnonRequest } from '../auth/anon-session.middleware';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { HttpExceptionEnvelopeFilter } from '../common/http-exception-envelope.filter';
import { Public } from '../common/public.decorator';
import { ResponseEnvelopeInterceptor } from '../common/response-envelope.interceptor';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { RecapService } from './recap.service';

@Controller()
@UseInterceptors(ResponseEnvelopeInterceptor)
@UseFilters(HttpExceptionEnvelopeFilter)
export class RecapController {
  constructor(private readonly recap: RecapService) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('invitations/:id/recap')
  getOwner(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.recap.getOwner(id, user ?? undefined, req.anonSessionId);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Patch('invitations/:id/recap/privacy')
  privacy(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateRecapPrivacySchema)) body: unknown,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.recap.updatePrivacy(
      id,
      body as never,
      user ?? undefined,
      req.anonSessionId
    );
  }

  @Public()
  @Get('public/recap/:shareToken')
  getPublic(@Param('shareToken') shareToken: string) {
    return this.recap.getPublic(shareToken);
  }
}

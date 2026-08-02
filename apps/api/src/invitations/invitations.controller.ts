import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ClaimInvitationsSchema,
  CreateDraftInvitationSchema,
  PublishInvitationSchema,
  UpdateDraftInvitationSchema,
} from '@wishly/contracts';
import type { AnonRequest } from '../auth/anon-session.middleware';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { Public } from '../common/public.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ResponseEnvelopeInterceptor } from '../common/response-envelope.interceptor';
import { HttpExceptionEnvelopeFilter } from '../common/http-exception-envelope.filter';
import { InvitationsService } from './invitations.service';
import { UpdatePrivacyDto } from './dto/update-privacy.dto';
import { DeleteEventDto } from './dto/delete-event.dto';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Public()
  @Post('draft')
  createDraft(
    @Body(new ZodValidationPipe(CreateDraftInvitationSchema))
    body: ReturnType<typeof CreateDraftInvitationSchema.parse>,
    @Req() req: AnonRequest
  ) {
    return this.invitations.createDraft(body, req.anonSessionId ?? '');
  }

  @UseGuards(JwtAuthGuard)
  @Post('claim')
  claim(
    @CurrentUser() user: AuthUser,
    @Req() req: AnonRequest,
    @Body(new ZodValidationPipe(ClaimInvitationsSchema))
    body: ReturnType<typeof ClaimInvitationsSchema.parse>
  ) {
    return this.invitations.claim(user, req.anonSessionId ?? '', body);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  list(
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.invitations.listMine(user ?? undefined, req.anonSessionId ?? '');
  }

  @Public()
  @Get('public/:slug/share')
  @Header('Cache-Control', 'public, max-age=60')
  async getShareHtml(
    @Param('slug') slug: string,
    @Res() res: Response
  ) {
    const html = await this.invitations.getShareHtml(slug);
    res.type('html').send(html);
  }

  @Public()
  @Get('public/:slug')
  getPublic(@Param('slug') slug: string) {
    return this.invitations.getPublicBySlug(slug);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  getOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.invitations.getOne(id, user ?? undefined, req.anonSessionId);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Patch(':id/draft')
  updateDraft(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateDraftInvitationSchema))
    body: ReturnType<typeof UpdateDraftInvitationSchema.parse>,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.invitations.updateDraft(
      id,
      body,
      user ?? undefined,
      req.anonSessionId
    );
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post(':id/duplicate')
  duplicate(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.invitations.duplicate(id, user ?? undefined, req.anonSessionId);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post(':id/publish')
  publish(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(PublishInvitationSchema))
    body: ReturnType<typeof PublishInvitationSchema.parse>,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.invitations.publish(
      id,
      body,
      user ?? undefined,
      req.anonSessionId
    );
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(ResponseEnvelopeInterceptor)
  @UseFilters(HttpExceptionEnvelopeFilter)
  @Post(':id/renew')
  renew(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.invitations.renew(id, user ?? undefined, req.anonSessionId);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(ResponseEnvelopeInterceptor)
  @UseFilters(HttpExceptionEnvelopeFilter)
  @Post(':id/consent')
  giveConsent(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.invitations.giveConsent(
      id,
      user ?? undefined,
      req.anonSessionId
    );
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(ResponseEnvelopeInterceptor)
  @UseFilters(HttpExceptionEnvelopeFilter)
  @Get(':id/privacy')
  getPrivacy(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.invitations.getPrivacySettings(
      id,
      user ?? undefined,
      req.anonSessionId
    );
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(ResponseEnvelopeInterceptor)
  @UseFilters(HttpExceptionEnvelopeFilter)
  @Patch(':id/privacy')
  updatePrivacy(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdatePrivacyDto.schema)) body: UpdatePrivacyDto,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.invitations.updatePrivacy(
      id,
      body,
      user ?? undefined,
      req.anonSessionId
    );
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/export')
  async exportAll(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest,
    @Res() res: Response
  ) {
    const buffer = await this.invitations.exportAll(
      id,
      user ?? undefined,
      req.anonSessionId
    );
    res
      .type(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      .set('Content-Disposition', `attachment; filename="wishly-${id}.xlsx"`)
      .send(buffer);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(ResponseEnvelopeInterceptor)
  @UseFilters(HttpExceptionEnvelopeFilter)
  @Delete(':id')
  deleteEvent(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(DeleteEventDto.schema)) body: DeleteEventDto,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.invitations.deleteEvent(
      id,
      body.confirmName,
      user ?? undefined,
      req.anonSessionId
    );
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import {
  CreateGiftEntrySchema,
  CreateGuestSchema,
  ImportGiftEntriesSchema,
  ImportGuestsSchema,
  ModerateGuestbookSchema,
  UpdateGuestSchema,
} from '@wishly/contracts';
import type { AnonRequest } from '../auth/anon-session.middleware';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { Public } from '../common/public.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ResponseEnvelopeInterceptor } from '../common/response-envelope.interceptor';
import { HttpExceptionEnvelopeFilter } from '../common/http-exception-envelope.filter';
import { InvitationsService } from '../invitations/invitations.service';
import { GuestsService } from './guests.service';
import { PublicGuestService } from './public-guest.service';
import { UpdateGuestSelfDto } from './dto/update-guest-self.dto';

@Controller()
export class GuestsController {
  constructor(
    private readonly guests: GuestsService,
    private readonly publicGuest: PublicGuestService,
    private readonly invitations: InvitationsService
  ) {}

  @Public()
  @Get('guests/public/:token')
  getByToken(@Param('token') token: string) {
    return this.guests.getByToken(token, { countView: true });
  }

  @Public()
  @Get('guests/public/:token/share')
  @Header('Cache-Control', 'public, max-age=60')
  async shareHtml(@Param('token') token: string, @Res() res: Response) {
    const html = await this.guests.getGuestShareHtml(token);
    res.type('html').send(html);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('invitations/:id/guests')
  list(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.guests.list(id, user ?? undefined, req.anonSessionId);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post('invitations/:id/guests')
  create(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CreateGuestSchema))
    body: ReturnType<typeof CreateGuestSchema.parse>,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.guests.create(id, body, user ?? undefined, req.anonSessionId);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Patch('invitations/:id/guests/:guestId')
  update(
    @Param('id') id: string,
    @Param('guestId') guestId: string,
    @Body(new ZodValidationPipe(UpdateGuestSchema))
    body: ReturnType<typeof UpdateGuestSchema.parse>,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.guests.update(
      id,
      guestId,
      body,
      user ?? undefined,
      req.anonSessionId
    );
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Delete('invitations/:id/guests/:guestId')
  remove(
    @Param('id') id: string,
    @Param('guestId') guestId: string,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.guests.remove(
      id,
      guestId,
      user ?? undefined,
      req.anonSessionId
    );
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post('invitations/:id/guests/import')
  importText(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ImportGuestsSchema))
    body: ReturnType<typeof ImportGuestsSchema.parse>,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.guests.importText(
      id,
      body,
      user ?? undefined,
      req.anonSessionId
    );
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post('invitations/:id/guests/import-from/:sourceId')
  importFrom(
    @Param('id') id: string,
    @Param('sourceId') sourceId: string,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.guests.importFromInvitation(
      id,
      sourceId,
      user ?? undefined,
      req.anonSessionId
    );
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post('invitations/:id/guests/mark-bulk-sent')
  markBulkSent(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.guests.markBulkSent(
      id,
      user ?? undefined,
      req.anonSessionId
    );
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('invitations/:id/guests/messages')
  async messages(
    @Param('id') id: string,
    @Query('group') group: string | undefined,
    @Query('pendingOnly') pendingOnly: string | undefined,
    @Query('tone') toneRaw: string | undefined,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    const list = await this.guests.list(
      id,
      user ?? undefined,
      req.anonSessionId
    );
    let guests = list.guests;
    if (group) guests = guests.filter((g) => g.group === group);
    if (pendingOnly === '1') {
      guests = guests.filter((g) => g.rsvp == null);
    }
    const tone =
      (['formal', 'casual', 'corporate'] as const).find((t) => t === toneRaw) ??
      'formal';
    const messages = await this.guests.buildZaloMessages(
      id,
      guests.map((g) => ({
        name: g.name,
        token: g.token,
        role: g.role,
        group: g.group,
      })),
      list.slug,
      tone
    );
    return {
      count: messages.length,
      hint: 'Chép nội dung rồi dán vào Zalo cho từng nhóm — không gửi tự động.',
      messages,
    };
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(ResponseEnvelopeInterceptor)
  @UseFilters(HttpExceptionEnvelopeFilter)
  @Post('invitations/:id/guests/:guestId/remind')
  async remind(
    @Param('id') id: string,
    @Param('guestId') guestId: string,
    @Query('tone') toneRaw: string | undefined,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    const tone =
      (['formal', 'casual', 'corporate'] as const).find((t) => t === toneRaw) ??
      'formal';
    return this.guests.remindGuest(
      id,
      guestId,
      user ?? undefined,
      req.anonSessionId,
      tone
    );
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('invitations/:id/guestbook')
  async listGuestbook(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    await this.invitations.assertCanAccess(
      id,
      user ?? undefined,
      req.anonSessionId
    );
    return this.publicGuest.listGuestbookForOwner(id);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Patch('invitations/:id/guestbook/:entryId')
  async moderate(
    @Param('id') id: string,
    @Param('entryId') entryId: string,
    @Body(new ZodValidationPipe(ModerateGuestbookSchema))
    body: ReturnType<typeof ModerateGuestbookSchema.parse>,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    await this.invitations.assertCanAccess(
      id,
      user ?? undefined,
      req.anonSessionId
    );
    return this.publicGuest.moderate(id, entryId, body.status);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('invitations/:id/gift-entries')
  listGifts(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.guests.listGiftEntries(
      id,
      user ?? undefined,
      req.anonSessionId
    );
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post('invitations/:id/gift-entries')
  createGift(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CreateGiftEntrySchema))
    body: ReturnType<typeof CreateGiftEntrySchema.parse>,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.guests.createGiftEntry(
      id,
      body,
      user ?? undefined,
      req.anonSessionId
    );
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Delete('invitations/:id/gift-entries/:entryId')
  deleteGift(
    @Param('id') id: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.guests.deleteGiftEntry(
      id,
      entryId,
      user ?? undefined,
      req.anonSessionId
    );
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post('invitations/:id/gift-entries/import')
  importGifts(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ImportGiftEntriesSchema))
    body: ReturnType<typeof ImportGiftEntriesSchema.parse>,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.guests.importGiftEntries(
      id,
      body,
      user ?? undefined,
      req.anonSessionId
    );
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @UseInterceptors(ResponseEnvelopeInterceptor)
  @UseFilters(HttpExceptionEnvelopeFilter)
  @Get('guests/public/:token/me')
  getSelf(@Param('token') token: string) {
    return this.guests.getSelf(token);
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @UseInterceptors(ResponseEnvelopeInterceptor)
  @UseFilters(HttpExceptionEnvelopeFilter)
  @Patch('guests/public/:token/me')
  updateSelf(
    @Param('token') token: string,
    @Body(new ZodValidationPipe(UpdateGuestSelfDto.schema))
    body: UpdateGuestSelfDto
  ) {
    return this.guests.updateSelf(token, body);
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @UseInterceptors(ResponseEnvelopeInterceptor)
  @UseFilters(HttpExceptionEnvelopeFilter)
  @Delete('guests/public/:token/me')
  removeSelf(@Param('token') token: string) {
    return this.guests.removeSelf(token);
  }
}

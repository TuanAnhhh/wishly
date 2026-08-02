import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  PublicGuestbookSchema,
  PublicRsvpSchema,
} from '@wishly/contracts';
import { Public } from '../common/public.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { PublicGuestService } from './public-guest.service';

@Controller('public')
export class PublicController {
  constructor(private readonly publicGuest: PublicGuestService) {}

  @Public()
  @Post('rsvp')
  rsvp(
    @Body(new ZodValidationPipe(PublicRsvpSchema))
    body: ReturnType<typeof PublicRsvpSchema.parse>
  ) {
    return this.publicGuest.submitRsvp(body);
  }

  @Public()
  @Post('guestbook')
  guestbook(
    @Body(new ZodValidationPipe(PublicGuestbookSchema))
    body: ReturnType<typeof PublicGuestbookSchema.parse>
  ) {
    return this.publicGuest.submitGuestbook(body);
  }

  @Public()
  @Get('invitations/:id/wishes')
  wishes(@Param('id') id: string) {
    return this.publicGuest.listApprovedWishes(id);
  }
}

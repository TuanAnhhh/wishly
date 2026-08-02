import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { PresignRequestSchema } from '@wishly/contracts';
import type { AnonRequest } from '../auth/anon-session.middleware';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { Public } from '../common/public.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { MediaService } from './media.service';

@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post('presign')
  async presign(
    @Body(new ZodValidationPipe(PresignRequestSchema))
    body: ReturnType<typeof PresignRequestSchema.parse>,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    const ownerKey = user?.id
      ? `users/${user.id}`
      : `anon/${req.anonSessionId ?? 'unknown'}`;
    return this.media.createPresign(body, ownerKey);
  }
}

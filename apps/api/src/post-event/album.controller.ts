import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  AlbumPresignSchema,
  ModerateAlbumPhotoSchema,
  UpdateAlbumSchema,
  UploadAlbumPhotosSchema,
} from '@wishly/contracts';
import type { Response } from 'express';
import type { AnonRequest } from '../auth/anon-session.middleware';
import type { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { HttpExceptionEnvelopeFilter } from '../common/http-exception-envelope.filter';
import { Public } from '../common/public.decorator';
import { ResponseEnvelopeInterceptor } from '../common/response-envelope.interceptor';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AlbumService } from './album.service';

@Controller()
@UseInterceptors(ResponseEnvelopeInterceptor)
@UseFilters(HttpExceptionEnvelopeFilter)
export class AlbumController {
  constructor(private readonly album: AlbumService) {}

  @Public()
  @Get('public/album/:slug')
  getPublic(@Param('slug') slug: string) {
    return this.album.getPublic(slug);
  }

  @Public()
  @Post('public/album/:slug/presign')
  presign(
    @Param('slug') slug: string,
    @Body(new ZodValidationPipe(AlbumPresignSchema)) body: unknown,
    @Req() req: AnonRequest
  ) {
    return this.album.presign(
      slug,
      body as never,
      req.anonSessionId ?? ''
    );
  }

  @Public()
  @Post('public/album/:slug/photos')
  upload(
    @Param('slug') slug: string,
    @Body(new ZodValidationPipe(UploadAlbumPhotosSchema)) body: unknown,
    @Req() req: AnonRequest
  ) {
    return this.album.uploadPhotos(
      slug,
      body as never,
      req.anonSessionId ?? ''
    );
  }

  /** Raw zip stream — no envelope wrapper. */
  @Public()
  @Get('public/album/:slug/zip')
  async zip(@Param('slug') slug: string, @Res() res: Response) {
    const { file, filename, estimatedBytes } = await this.album.zipPublic(slug);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );
    res.setHeader('X-Estimated-Bytes', String(estimatedBytes));
    const stream = file.getStream();
    stream.pipe(res);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('invitations/:id/album')
  getOwner(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.album.getOwnerAlbum(id, user ?? undefined, req.anonSessionId);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Patch('invitations/:id/album')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateAlbumSchema)) body: unknown,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.album.updateAlbum(
      id,
      body as never,
      user ?? undefined,
      req.anonSessionId
    );
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Patch('invitations/:id/album/photos/:photoId')
  moderate(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
    @Body(new ZodValidationPipe(ModerateAlbumPhotoSchema)) body: unknown,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.album.moderate(
      id,
      photoId,
      body as never,
      user ?? undefined,
      req.anonSessionId
    );
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post('invitations/:id/album/approve-all')
  approveAll(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser | null | undefined,
    @Req() req: AnonRequest
  ) {
    return this.album.approveAll(id, user ?? undefined, req.anonSessionId);
  }
}

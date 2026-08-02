import { z } from 'zod';

export const AlbumPhotoStatusSchema = z.enum(['pending', 'ok', 'hidden']);
export type AlbumPhotoStatus = z.infer<typeof AlbumPhotoStatusSchema>;

export const UploadAlbumPhotosSchema = z.object({
  mediaKeys: z.array(z.string().min(1)).min(1).max(10),
  uploaderName: z.string().min(1).max(80),
  guestToken: z.string().min(1).optional().nullable(),
});
export type UploadAlbumPhotos = z.infer<typeof UploadAlbumPhotosSchema>;

export const ModerateAlbumPhotoSchema = z.object({
  status: AlbumPhotoStatusSchema,
});
export type ModerateAlbumPhoto = z.infer<typeof ModerateAlbumPhotoSchema>;

export const UpdateAlbumSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  /** ISO date — extend closesAt */
  closesAt: z.string().min(1).optional(),
});
export type UpdateAlbum = z.infer<typeof UpdateAlbumSchema>;

export const AlbumPresignSchema = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.enum([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ]),
  byteSize: z
    .number()
    .int()
    .positive()
    .max(8 * 1024 * 1024),
});
export type AlbumPresign = z.infer<typeof AlbumPresignSchema>;

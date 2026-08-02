import { z } from 'zod';

export const UserPublicSchema = z.object({
  id: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
  provider: z.string(),
});
export type UserPublic = z.infer<typeof UserPublicSchema>;

export const PresignRequestSchema = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.enum([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ]),
  byteSize: z.number().int().positive().max(8 * 1024 * 1024),
});
export type PresignRequest = z.infer<typeof PresignRequestSchema>;

export const PresignResponseSchema = z.object({
  uploadUrl: z.string().url(),
  key: z.string(),
  publicUrl: z.string().url().optional(),
});
export type PresignResponse = z.infer<typeof PresignResponseSchema>;

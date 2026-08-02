import { z } from 'zod';

import {
  BlockConfigSchema,
  DraftInvitationContentSchema,
  InvitationContentSchema,
  ThemeConfigSchema,
} from './invitation-content.js';

export {
  BLOCK_KEYS,
  BlockConfigSchema,
  BlockKeySchema,
  CoverContentSchema,
  DEFAULT_BLOCK_ORDER,
  DraftInvitationContentSchema,
  FieldTypeSchema,
  GiftContentSchema,
  GuestbookContentSchema,
  InviteContentSchema,
  InvitationContentSchema,
  MediaKeySchema,
  PartyContentSchema,
  RsvpContentSchema,
  StoryContentSchema,
  AlbumContentSchema,
  ThemeConfigSchema,
  BilingualTextSchema,
  AgendaContentSchema,
  PracticalContentSchema,
  EntryPassContentSchema,
  CORPORATE_BLOCK_ORDER,
} from './invitation-content.js';

export type {
  AlbumContent,
  BlockConfig,
  BlockKey,
  BilingualText,
  CoverContent,
  FieldDef,
  FieldType,
  GiftContent,
  GuestbookContent,
  InviteContent,
  InvitationContent,
  PartyContent,
  RsvpContent,
  StoryContent,
  ThemeConfig,
  AgendaContent,
  PracticalContent,
  EntryPassContent,
} from './invitation-content.js';

export const EventTypeSchema = z.enum([
  'WEDDING',
  'BIRTHDAY',
  'BABY_MONTH',
  'CORPORATE',
]);
export type EventType = z.infer<typeof EventTypeSchema>;

export const TierSchema = z.enum(['FREE', 'BASIC', 'PREMIUM']);
export type Tier = z.infer<typeof TierSchema>;

export const InvStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ENDED']);
export type InvStatus = z.infer<typeof InvStatusSchema>;

export const CreateDraftInvitationSchema = z.object({
  templateId: z.string().min(1),
  eventType: EventTypeSchema,
  slug: z.string().min(3).max(64).optional(),
  content: InvitationContentSchema.optional(),
  theme: ThemeConfigSchema.optional(),
  blocks: z.array(BlockConfigSchema).optional(),
});
export type CreateDraftInvitation = z.infer<typeof CreateDraftInvitationSchema>;

export const ClaimInvitationsSchema = z.object({
  invitationIds: z.array(z.string().min(1)).min(1).optional(),
});
export type ClaimInvitations = z.infer<typeof ClaimInvitationsSchema>;

const SlugSchema = z
  .string()
  .min(3)
  .max(64)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug chỉ dùng chữ thường, số và dấu gạch ngang.'
  );

export const BrandColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Màu thương hiệu phải là mã hex #RRGGBB.')
  .nullable();

export const UpdateDraftInvitationSchema = z.object({
  content: DraftInvitationContentSchema.optional(),
  theme: ThemeConfigSchema.optional(),
  blocks: z.array(BlockConfigSchema).optional(),
  slug: SlugSchema.optional(),
  eventDate: z.string().min(1).nullable().optional(),
  /** CORPORATE only — free accent; palette derived server/client-side */
  brandColor: BrandColorSchema.optional(),
});
export type UpdateDraftInvitation = z.infer<typeof UpdateDraftInvitationSchema>;

export const PublishInvitationSchema = z.object({
  slug: SlugSchema.optional(),
});
export type PublishInvitation = z.infer<typeof PublishInvitationSchema>;

export const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'login',
  'studio',
  'www',
  'app',
  'static',
  'assets',
  'health',
  'invitations',
  'media',
  'auth',
  'create',
  'dashboard',
  'edit',
  'new',
  'templates',
  'guest',
  'privacy-policy',
  'recap',
  'checkin',
  'album',
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

export const UpdatePrivacySchema = z.object({
  publicGuestbook: z.boolean().optional(),
  hideGift: z.boolean().optional(),
  retentionMonths: z.union([z.literal(3), z.literal(6), z.literal(12)]).optional(),
  /** Empty string clears the password; omit the field to leave it unchanged. */
  password: z.string().max(72).nullable().optional(),
});
export type UpdatePrivacy = z.infer<typeof UpdatePrivacySchema>;

export const DeleteEventSchema = z.object({
  confirmName: z.string().min(1),
});
export type DeleteEvent = z.infer<typeof DeleteEventSchema>;

export const UpdateGuestSelfSchema = z.object({
  attending: z.boolean().optional(),
  wish: z.string().max(2000).optional(),
});
export type UpdateGuestSelf = z.infer<typeof UpdateGuestSelfSchema>;

import { z } from 'zod';

export const DEFAULT_GUEST_GROUPS = [
  'Nhà trai',
  'Nhà gái',
  'Bạn cô dâu',
  'Bạn chú rể',
  'Đồng nghiệp',
] as const;

export const CreateGuestSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().max(32).optional().nullable(),
  group: z.string().max(80).optional().nullable(),
  /** Honorific override (anh/chị/cô/chú/bạn). If omitted, derived from group. */
  role: z.string().max(40).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  consentAt: z.string().datetime().optional().nullable(),
});
export type CreateGuest = z.infer<typeof CreateGuestSchema>;

export const UpdateGuestSchema = CreateGuestSchema.partial();
export type UpdateGuest = z.infer<typeof UpdateGuestSchema>;

export const ImportGuestsSchema = z.object({
  /** Pasted lines: "Tên, SĐT, Nhóm" or CSV rows */
  text: z.string().min(1).max(200_000),
  /** Required for NĐ 13/2023 when importing phone numbers */
  consentAccepted: z.literal(true),
});
export type ImportGuests = z.infer<typeof ImportGuestsSchema>;

export const PublicRsvpSchema = z.object({
  invitationId: z.string().min(1),
  guestToken: z.string().min(1).optional().nullable(),
  name: z.string().min(1).max(120),
  attending: z.boolean(),
  plusOnes: z.number().int().min(0).max(20).default(0),
  note: z.string().max(1000).optional().nullable(),
  mealChoice: z.enum(['standard', 'vegetarian']).optional().nullable(),
  allergyNote: z.string().max(500).optional().nullable(),
  lang: z.enum(['vi', 'en']).optional().nullable(),
});
export type PublicRsvp = z.infer<typeof PublicRsvpSchema>;

export const PublicGuestbookSchema = z.object({
  invitationId: z.string().min(1),
  name: z.string().min(1).max(120),
  message: z.string().min(1).max(2000),
});
export type PublicGuestbook = z.infer<typeof PublicGuestbookSchema>;

export const ModerateGuestbookSchema = z.object({
  status: z.enum(['approved', 'hidden', 'pending']),
});
export type ModerateGuestbook = z.infer<typeof ModerateGuestbookSchema>;

export const CreateGiftEntrySchema = z.object({
  giverName: z.string().min(1).max(120),
  amount: z.number().int().positive().max(1_000_000_000),
  side: z.string().min(1).max(40),
  note: z.string().max(500).optional().nullable(),
  guestId: z.string().min(1).optional().nullable(),
  receivedAt: z.string().datetime().optional(),
});
export type CreateGiftEntry = z.infer<typeof CreateGiftEntrySchema>;

export const ImportGiftEntriesSchema = z.object({
  entries: z.array(CreateGiftEntrySchema).min(1).max(500),
  /** Default side when a row omits it (bank CSV). */
  defaultSide: z.string().min(1).max(40).default('Chưa phân'),
});
export type ImportGiftEntries = z.infer<typeof ImportGiftEntriesSchema>;

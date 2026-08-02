import { z } from 'zod';

/** Invitation blocks — 8 classic + 3 corporate */
export const BlockKeySchema = z.enum([
  'cover',
  'invite',
  'story',
  'album',
  'party',
  'rsvp',
  'gift',
  'guestbook',
  'agenda',
  'practical',
  'entry-pass',
]);
export type BlockKey = z.infer<typeof BlockKeySchema>;

export const BLOCK_KEYS = BlockKeySchema.options;

/** Bilingual content — corporate blocks only; UI shows VI + optional EN. */
export const BilingualTextSchema = z.object({
  vi: z.string(),
  en: z.string().optional(),
});
export type BilingualText = z.infer<typeof BilingualTextSchema>;

/** Editor field descriptors — P03 generates forms from these */
export const FieldTypeSchema = z.enum([
  'text',
  'textarea',
  'date',
  'time',
  'datetime',
  'boolean',
  'media',
  'url',
  'number',
  'array',
  'bilingual-text',
  'bilingual-textarea',
]);
export type FieldType = z.infer<typeof FieldTypeSchema>;

export type FieldDef = {
  name: string;
  type: FieldType;
  label: string;
  help?: string;
  placeholder?: string;
  required?: boolean;
  itemFields?: FieldDef[];
};

/** Storage key only — never raw external URLs in content */
export const MediaKeySchema = z.string().min(1).nullable();

export const CoverContentSchema = z.object({
  guestLabel: z.string().default(''),
  eyebrow: z.string().default('SAVE THE DATE'),
  nameLeft: z.string().min(1),
  nameRight: z.string().min(1),
  dateLine: z.string().min(1),
  placeLine: z.string().default(''),
  coverMediaKey: MediaKeySchema.default(null),
  showCountdown: z.boolean().default(true),
  eventAt: z.string().min(1).optional(),
});
export type CoverContent = z.infer<typeof CoverContentSchema>;

export const InviteContentSchema = z.object({
  heading: z.string().default('TRÂN TRỌNG KÍNH MỜI'),
  body: z.string().min(1),
  signature: z.string().default(''),
});
export type InviteContent = z.infer<typeof InviteContentSchema>;

export const StoryItemSchema = z.object({
  year: z.string().min(1),
  title: z.string().min(1),
  text: z.string().min(1),
  mediaKey: MediaKeySchema.default(null),
});

export const StoryContentSchema = z.object({
  heading: z.string().default('Chuyện tình mình'),
  items: z.array(StoryItemSchema).max(8).default([]),
});
export type StoryContent = z.infer<typeof StoryContentSchema>;

export const AlbumContentSchema = z.object({
  heading: z.string().default('Album ảnh'),
  help: z.string().default('Bấm vào ảnh để xem lớn'),
  mediaKeys: z.array(z.string().min(1)).max(12).default([]),
});
export type AlbumContent = z.infer<typeof AlbumContentSchema>;

export const PartyScheduleItemSchema = z.object({
  label: z.string().min(1),
  time: z.string().min(1),
});

export const PartyContentSchema = z.object({
  heading: z.string().default('Tiệc cưới'),
  datetimeLabel: z.string().min(1),
  datetimeHelp: z.string().default(''),
  venueName: z.string().min(1),
  venueAddress: z.string().min(1),
  venueDetail: z.string().default(''),
  schedule: z.array(PartyScheduleItemSchema).max(8).default([]),
  mapMediaKey: MediaKeySchema.default(null),
  mapsUrl: z.string().default(''),
  calendarUrl: z.string().default(''),
});
export type PartyContent = z.infer<typeof PartyContentSchema>;

export const RsvpContentSchema = z.object({
  heading: z.string().default('Anh chị đến dự được không ạ?'),
  help: z
    .string()
    .default('Chỉ mất một phút, giúp chúng tôi chuẩn bị chỗ ngồi chu đáo.'),
  acceptLabel: z.string().default('Tôi sẽ đến'),
  declineLabel: z.string().default('Rất tiếc, tôi không đến được'),
  wishPlaceholder: z
    .string()
    .default('Chúc hai bạn trăm năm hạnh phúc…'),
  submitLabel: z.string().default('Gửi xác nhận'),
});
export type RsvpContent = z.infer<typeof RsvpContentSchema>;

export const GiftAccountSchema = z.object({
  side: z.string().min(1),
  owner: z.string().min(1),
  bank: z.string().min(1),
  accountNo: z.string().min(1),
  qrMediaKey: MediaKeySchema.default(null),
});

export const GiftContentSchema = z.object({
  heading: z.string().default('Hộp mừng cưới'),
  help: z
    .string()
    .default(
      'Sự có mặt của anh chị đã là món quà quý. Nếu ở xa không về được, anh chị có thể gửi lời chúc qua đây.'
    ),
  accounts: z.array(GiftAccountSchema).max(4).default([]),
});
export type GiftContent = z.infer<typeof GiftContentSchema>;

export const GuestbookContentSchema = z.object({
  heading: z.string().default('Sổ lưu bút'),
  empty: z.string().default('Chưa có lời chúc. Hãy là người đầu tiên nhé.'),
});
export type GuestbookContent = z.infer<typeof GuestbookContentSchema>;

const DraftBilingual = z.object({
  vi: z.string().default(''),
  en: z.string().optional(),
});

export const AgendaItemSchema = z.object({
  time: BilingualTextSchema,
  title: BilingualTextSchema,
  desc: BilingualTextSchema.optional(),
});

export const AgendaContentSchema = z.object({
  heading: BilingualTextSchema.default({ vi: 'Chương trình', en: 'Agenda' }),
  items: z.array(AgendaItemSchema).max(20).default([]),
});
export type AgendaContent = z.infer<typeof AgendaContentSchema>;

export const PracticalItemSchema = z.object({
  label: BilingualTextSchema,
  value: BilingualTextSchema,
  note: BilingualTextSchema.optional(),
});

export const PracticalContentSchema = z.object({
  heading: BilingualTextSchema.default({
    vi: 'Thông tin cần biết',
    en: 'Good to know',
  }),
  items: z.array(PracticalItemSchema).max(12).default([]),
});
export type PracticalContent = z.infer<typeof PracticalContentSchema>;

export const EntryPassContentSchema = z.object({
  heading: BilingualTextSchema.default({
    vi: 'Thẻ vào cổng',
    en: 'Entry pass',
  }),
  help: BilingualTextSchema.default({
    vi: 'Đưa mã này tại quầy đón khách',
    en: 'Show this code at the reception desk',
  }),
});
export type EntryPassContent = z.infer<typeof EntryPassContentSchema>;

export const ThemeConfigSchema = z.object({
  paletteId: z.string().min(1),
  fontId: z.string().min(1),
  // Optional (not default) — must still parse `theme` JSON of invitations
  // saved before styleId existed.
  styleId: z.string().min(1).optional(),
  overrides: z.record(z.string(), z.string()).optional(),
});
export type ThemeConfig = z.infer<typeof ThemeConfigSchema>;

export const BlockConfigSchema = z.object({
  key: BlockKeySchema,
  enabled: z.boolean(),
  order: z.number().int().nonnegative(),
  // Loose on purpose (forward-compatible for partner JSON) — enforcement
  // against a block's real allowlist happens in parseDataTemplate, not here.
  variant: z.string().min(1).optional(),
});
export type BlockConfig = z.infer<typeof BlockConfigSchema>;

export const InvitationContentSchema = z.object({
  version: z.literal(1),
  cover: CoverContentSchema.optional(),
  invite: InviteContentSchema.optional(),
  story: StoryContentSchema.optional(),
  album: AlbumContentSchema.optional(),
  party: PartyContentSchema.optional(),
  rsvp: RsvpContentSchema.optional(),
  gift: GiftContentSchema.optional(),
  guestbook: GuestbookContentSchema.optional(),
  agenda: AgendaContentSchema.optional(),
  practical: PracticalContentSchema.optional(),
  'entry-pass': EntryPassContentSchema.optional(),
});
export type InvitationContent = z.infer<typeof InvitationContentSchema>;

/** Soft schemas for autosave — allow empty rows mid-edit; publish stays strict */
const DraftStoryItemSchema = z.object({
  year: z.string().default(''),
  title: z.string().default(''),
  text: z.string().default(''),
  mediaKey: MediaKeySchema.default(null),
});

const DraftPartyScheduleItemSchema = z.object({
  label: z.string().default(''),
  time: z.string().default(''),
});

const DraftGiftAccountSchema = z.object({
  side: z.string().default(''),
  owner: z.string().default(''),
  bank: z.string().default(''),
  accountNo: z.string().default(''),
  qrMediaKey: MediaKeySchema.default(null),
});

const DraftCoverContentSchema = z.object({
  guestLabel: z.string().default(''),
  eyebrow: z.string().default('SAVE THE DATE'),
  nameLeft: z.string().default(''),
  nameRight: z.string().default(''),
  dateLine: z.string().default(''),
  placeLine: z.string().default(''),
  coverMediaKey: MediaKeySchema.default(null),
  showCountdown: z.boolean().default(true),
  eventAt: z.string().optional(),
});

const DraftInviteContentSchema = z.object({
  heading: z.string().default('TRÂN TRỌNG KÍNH MỜI'),
  body: z.string().default(''),
  signature: z.string().default(''),
});

const DraftPartyContentSchema = z.object({
  heading: z.string().default('Tiệc cưới'),
  datetimeLabel: z.string().default(''),
  datetimeHelp: z.string().default(''),
  venueName: z.string().default(''),
  venueAddress: z.string().default(''),
  venueDetail: z.string().default(''),
  schedule: z.array(DraftPartyScheduleItemSchema).max(8).default([]),
  mapMediaKey: MediaKeySchema.default(null),
  mapsUrl: z.string().default(''),
  calendarUrl: z.string().default(''),
});

export const DraftInvitationContentSchema = z.object({
  version: z.literal(1),
  cover: DraftCoverContentSchema.optional(),
  invite: DraftInviteContentSchema.optional(),
  story: z
    .object({
      heading: z.string().default('Chuyện tình mình'),
      items: z.array(DraftStoryItemSchema).max(8).default([]),
    })
    .optional(),
  album: AlbumContentSchema.optional(),
  party: DraftPartyContentSchema.optional(),
  rsvp: RsvpContentSchema.optional(),
  gift: z
    .object({
      heading: z.string().default('Hộp mừng cưới'),
      help: z.string().default(''),
      accounts: z.array(DraftGiftAccountSchema).max(4).default([]),
    })
    .optional(),
  guestbook: GuestbookContentSchema.optional(),
  agenda: z
    .object({
      heading: DraftBilingual.default({ vi: 'Chương trình', en: 'Agenda' }),
      items: z
        .array(
          z.object({
            time: DraftBilingual.default({ vi: '' }),
            title: DraftBilingual.default({ vi: '' }),
            desc: DraftBilingual.optional(),
          })
        )
        .max(20)
        .default([]),
    })
    .optional(),
  practical: z
    .object({
      heading: DraftBilingual.default({
        vi: 'Thông tin cần biết',
        en: 'Good to know',
      }),
      items: z
        .array(
          z.object({
            label: DraftBilingual.default({ vi: '' }),
            value: DraftBilingual.default({ vi: '' }),
            note: DraftBilingual.optional(),
          })
        )
        .max(12)
        .default([]),
    })
    .optional(),
  'entry-pass': EntryPassContentSchema.optional(),
});
export type DraftInvitationContent = z.infer<typeof DraftInvitationContentSchema>;

export const DEFAULT_BLOCK_ORDER: BlockConfig[] = [
  { key: 'cover', enabled: true, order: 0 },
  { key: 'invite', enabled: true, order: 1 },
  { key: 'story', enabled: false, order: 2 },
  { key: 'album', enabled: false, order: 3 },
  { key: 'party', enabled: true, order: 4 },
  { key: 'rsvp', enabled: true, order: 5 },
  { key: 'gift', enabled: false, order: 6 },
  { key: 'guestbook', enabled: false, order: 7 },
  { key: 'agenda', enabled: false, order: 8 },
  { key: 'practical', enabled: false, order: 9 },
  { key: 'entry-pass', enabled: false, order: 10 },
];

/** Corporate default block set — classic wedding blocks mostly off. */
export const CORPORATE_BLOCK_ORDER: BlockConfig[] = [
  { key: 'cover', enabled: true, order: 0 },
  { key: 'invite', enabled: true, order: 1 },
  { key: 'agenda', enabled: true, order: 2 },
  { key: 'practical', enabled: true, order: 3 },
  { key: 'party', enabled: true, order: 4 },
  { key: 'entry-pass', enabled: true, order: 5 },
  { key: 'rsvp', enabled: true, order: 6 },
  { key: 'story', enabled: false, order: 7 },
  { key: 'album', enabled: false, order: 8 },
  { key: 'gift', enabled: false, order: 9 },
  { key: 'guestbook', enabled: false, order: 10 },
];

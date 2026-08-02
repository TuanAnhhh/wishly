import type { ComponentType, CSSProperties, ReactNode } from 'react';
import type {
  BlockKey,
  FieldDef,
  ThemeConfig,
} from '@wishly/contracts';
import type { ZodType } from 'zod';

import type { CorpLang } from './i18n/corporate-strings.js';
import type { FontPreset } from './themes/fonts.js';
import type { PaletteTokens } from './themes/palettes.js';
import type { StyleTokens } from './themes/styles.js';

export type ResolvedTheme = {
  config: ThemeConfig;
  palette: PaletteTokens;
  font: FontPreset;
  style: StyleTokens;
  cssVars: CSSProperties;
  brandAdjusted?: boolean;
};

export type MediaResolver = (mediaKey: string) => string | undefined;

export type GuestbookWish = {
  text: string;
  name: string;
  time?: string;
};

export type EntryPassData = {
  passCode: string;
  guestName: string;
  tableLabel?: string | null;
};

export type InvitationInteractions = {
  guestName?: string;
  wishes?: GuestbookWish[];
  /** Active language for corporate bilingual blocks + UI chrome */
  lang?: CorpLang;
  /** CORPORATE RSVP extras */
  eventType?: 'WEDDING' | 'BIRTHDAY' | 'BABY_MONTH' | 'CORPORATE';
  onRsvp?: (payload: {
    attending: boolean;
    note: string;
    name: string;
    plusOnes?: number;
    mealChoice?: 'standard' | 'vegetarian' | null;
    allergyNote?: string | null;
    lang?: CorpLang;
  }) => void | Promise<void>;
  onGuestbook?: (payload: {
    name: string;
    message: string;
  }) => void | Promise<void>;
  /** Precomputed VietQR image URLs keyed by accountNo */
  giftQrUrls?: Record<string, string>;
  /** Personal entry pass — omit on shared slug pages */
  entryPass?: EntryPassData | null;
};

export type BlockRenderProps<T> = {
  data: T;
  theme: ResolvedTheme;
  resolveMedia?: MediaResolver;
  interactions?: InvitationInteractions;
  /** Invitation is ENDED — rsvp/guestbook forms and gift QR render static, read-only variants. */
  readOnly?: boolean;
  /** Structural archetype (e.g. cover 'arch-frame'). Unknown/absent -> block's own default. */
  variant?: string;
};

export type BlockDef<T> = {
  key: BlockKey;
  schema: ZodType<T>;
  fields: FieldDef[];
  Component: ComponentType<BlockRenderProps<T>>;
  required?: boolean;
  label: string;
  help: string;
  empty: string;
  /** Allowlist of `variant` ids this block accepts. Open-ended (add a key, no schema change). Absent/empty = block has no variants. */
  variants?: readonly string[];
};

export type TemplateMeta = {
  id: string;
  slug: string;
  name: string;
  eventType: 'WEDDING' | 'BIRTHDAY' | 'BABY_MONTH' | 'CORPORATE';
  tier: 'FREE' | 'BASIC' | 'PREMIUM';
  description: string;
  thumbKey: string;
  sortOrder: number;
};

export type TemplateDefinition = {
  meta: TemplateMeta;
  theme: ThemeConfig;
  blocks: Array<{
    key: BlockKey;
    enabled: boolean;
    order: number;
    variant?: string;
  }>;
  /** Demo / seed content */
  content: Record<string, unknown>;
};

/**
 * `families.ts`' `coverVariant` is baked into `registry.ts`'s `composeTemplate`
 * as the `cover` block's own `variant` (not a separate `TemplateMeta` field)
 * — this is the one place every `TemplateThumb` caller with a `blocks` array
 * already in scope (`TemplateDefinition.blocks`) can derive it without a new
 * fetch or a wider type. Callers whose `blocks` type doesn't carry `variant`
 * yet (e.g. some app-level `InvitationRecord` shapes) aren't wired — see
 * Phase 07 report Unresolved.
 */
export function coverVariantOf(
  blocks: Array<{ key: BlockKey; variant?: string }>
): string | undefined {
  return blocks.find((b) => b.key === 'cover')?.variant;
}

export type InvitationRendererProps = {
  content: Record<string, unknown>;
  theme: ThemeConfig;
  blocks: Array<{
    key: BlockKey;
    enabled: boolean;
    order: number;
    variant?: string;
  }>;
  resolveMedia?: MediaResolver;
  interactions?: InvitationInteractions;
  className?: string;
  footer?: ReactNode;
  /** FREE shows platform watermark unless custom footer provided */
  tier?: 'FREE' | 'BASIC' | 'PREMIUM';
  /** Invitation status is ENDED — content still renders, rsvp/guestbook/gift switch to static variants. */
  readOnly?: boolean;
  /** Hex brand accent — CORPORATE only; drives derivePalette */
  brandColor?: string | null;
  /** Optional lang override when interactions.lang not set */
  lang?: CorpLang;
};

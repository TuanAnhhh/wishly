import {
  BLOCK_KEYS,
  DataTemplateSchema,
  type BlockKey,
  type DataTemplate,
} from '@wishly/contracts';

import { COVER_VARIANT_IDS } from './blocks/cover/variants.js';
import { getFont } from './themes/fonts.js';
import { getPalette } from './themes/palettes.js';
import { STYLES } from './themes/styles.js';

const MEDIA_FIELD_HINTS = /mediaKey|MediaKey|coverMediaKey|mapMediaKey|qrMediaKey/;

/**
 * Allowed `variant` ids per block key — mirrors each block's `BlockDef.variants`.
 * Sourced from small React-free id-list files (not the block registries) so
 * this stays safe to import server-side without pulling in lazy-split
 * corporate block components (agenda/practical/entry-pass). Blocks with no
 * entry here have no variants yet — an explicit `variant` on them is rejected.
 */
const BLOCK_VARIANT_IDS: Partial<Record<BlockKey, readonly string[]>> = {
  cover: COVER_VARIANT_IDS,
};

/**
 * Validate a data-only template (theme/blocks/content).
 * No executable code — render only via InvitationRenderer + approved blocks.
 */
export function parseDataTemplate(raw: unknown): DataTemplate {
  const parsed = DataTemplateSchema.parse(raw);
  for (const b of parsed.blocks) {
    if (!(BLOCK_KEYS as readonly string[]).includes(b.key)) {
      throw new Error(`Block không hợp lệ: ${b.key}`);
    }
    if (b.variant) {
      const allowed = BLOCK_VARIANT_IDS[b.key];
      if (!allowed || !allowed.includes(b.variant)) {
        throw new Error(`Variant không hợp lệ cho block "${b.key}": ${b.variant}`);
      }
    }
  }
  if (!getPalette(parsed.theme.paletteId)) {
    throw new Error(`Palette không hợp lệ: ${parsed.theme.paletteId}`);
  }
  if (!getFont(parsed.theme.fontId)) {
    throw new Error(`Font không hợp lệ: ${parsed.theme.fontId}`);
  }
  // styleId is optional (older saved themes have none -> falls back to
  // DEFAULT_STYLE_ID at resolve time); only reject an *explicit* bad id.
  // Uses STYLES directly (not getStyle) because getStyle always falls back
  // to a truthy default and would never catch a typo'd id.
  if (parsed.theme.styleId && !STYLES[parsed.theme.styleId]) {
    throw new Error(`Style không hợp lệ: ${parsed.theme.styleId}`);
  }
  return parsed;
}

/**
 * Snapshot invitation into a reusable partner template.
 * Strips personal media keys and couple names from cover.
 */
export function stripPersonalContent(
  content: Record<string, unknown>
): Record<string, unknown> {
  const next = structuredClone(content) as Record<string, unknown>;
  stripMediaDeep(next);
  const cover = next.cover as Record<string, unknown> | undefined;
  if (cover) {
    cover.nameLeft = 'Cô dâu';
    cover.nameRight = 'Chú rể';
    cover.guestLabel = 'Kính gửi';
    delete cover.coverMediaKey;
  }
  const invite = next.invite as Record<string, unknown> | undefined;
  if (invite && typeof invite.body === 'string') {
    invite.body = 'Nội dung lời mời mẫu — chỉnh lại cho từng cặp đôi.';
  }
  return next;
}

function stripMediaDeep(node: unknown): void {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) stripMediaDeep(item);
    return;
  }
  const obj = node as Record<string, unknown>;
  for (const [k, v] of Object.entries(obj)) {
    if (MEDIA_FIELD_HINTS.test(k)) {
      obj[k] = null;
    } else {
      stripMediaDeep(v);
    }
  }
}

export type UnifiedTemplateMeta = {
  id: string;
  slug: string;
  name: string;
  eventType: string;
  source: 'code' | 'partner';
  partnerId?: string;
};

export function isPartnerTemplateId(id: string): boolean {
  return id.startsWith('ptpl_') || id.startsWith('pt_');
}

export function enabledBlockKeys(
  blocks: Array<{ key: string; enabled: boolean }>
): BlockKey[] {
  return blocks.filter((b) => b.enabled).map((b) => b.key as BlockKey);
}

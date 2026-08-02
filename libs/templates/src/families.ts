import type { ThemeConfig } from '@wishly/contracts';

import type { TemplateMeta } from './types.js';

type EventType = TemplateMeta['eventType'];

/**
 * The "design" half of family × event composition (see registry.ts
 * `composeTemplate`) — theme + which events it's offered for, independent of
 * block set/content. `theme` reuses existing palette/font/style presets
 * (Phase 00/01/02) — no new art required for this phase; motif/texture
 * bespoke art is P04/P05's job, tracked separately from this registry shape.
 */
export type DesignFamily = {
  id: string;
  name: string;
  description: string;
  theme: ThemeConfig;
  tier: 'FREE' | 'BASIC' | 'PREMIUM';
  /** Allowlist, not every EventType × every family — see plan.md §Allowlist. */
  eventTypes: EventType[];
  /** Cover archetype this family pairs with. Absent = block's own default (`photo-full`). */
  coverVariant?: string;
  sortOrder: number;
};

export const DESIGN_FAMILIES: DesignFamily[] = [
  {
    id: 'gach-bong',
    name: 'Gạch Bông',
    description: 'Hoa văn gạch bông Đông Dương, hình học lặp — trắng và xanh cổ vịt.',
    theme: { paletteId: 'gach-bong', fontId: 'bricolage-be', styleId: 'gach-bong' },
    // Wave-1 architecture table (2026-08-01, user-confirmed) escalates this
    // from FREE — it now carries its own dedicated palette + texture + motif.
    tier: 'BASIC',
    eventTypes: ['WEDDING', 'BIRTHDAY', 'BABY_MONTH', 'CORPORATE'],
    coverVariant: 'split',
    sortOrder: 10,
  },
  {
    id: 'dong-son',
    name: 'Đông Sơn',
    description: 'Trống đồng, chim Lạc — be và đồng cổ.',
    theme: { paletteId: 'dong-son', fontId: 'newsreader-be', styleId: 'dong-son' },
    // Wave-1 architecture table (2026-08-01, user-confirmed) escalates this
    // from BASIC — most art-dense of the 3 (drum motif + sun-star texture).
    tier: 'PREMIUM',
    eventTypes: ['WEDDING', 'BABY_MONTH', 'CORPORATE'],
    coverVariant: 'arch-frame',
    sortOrder: 20,
  },
  {
    id: 'giay-do',
    name: 'Giấy Dó',
    description: 'Giấy dó, mực nho — tối giản, để chữ dẫn dắt.',
    theme: { paletteId: 'giay-do', fontId: 'eb-garamond-only', styleId: 'giay-do' },
    tier: 'FREE',
    eventTypes: ['WEDDING', 'BIRTHDAY', 'BABY_MONTH', 'CORPORATE'],
    coverVariant: 'photo-full',
    sortOrder: 30,
  },
  {
    id: 'son-mai',
    name: 'Sơn Mài',
    description: 'Sơn mài, khảm trai — nền sẫm, tương phản cao.',
    // Theme ids unchanged this phase (pre-existing, from `lacquer.ts`
    // migration) — Phase 08 wave-2 upgrades what `paletteId: 'son-mai'` /
    // `styleId: 'dark-luxe'` resolve TO (motif + crackle texture added,
    // `verified` flipped), not this reference. `fontId: 'be-playfair'`
    // (Playfair Display, a didone) already matched the architecture table's
    // "didone (Bodoni Moda?)" suggestion, no change needed.
    theme: { paletteId: 'son-mai', fontId: 'be-playfair', styleId: 'dark-luxe' },
    tier: 'PREMIUM',
    eventTypes: ['WEDDING', 'CORPORATE'],
    coverVariant: 'arch-frame',
    sortOrder: 40,
  },
  {
    id: 'lua',
    name: 'Lụa',
    description: 'Lụa Hà Đông, đường lượn mảnh — cổ điển, ấm áp.',
    // Phase 08 wave-2 (2026-08-02): was a placeholder pointing at pre-family
    // presets (`co-ngu`/`be-cormorant`/`classic`) — now its own dedicated
    // palette (rose/gold/jade gradient) + font (`cormorant-only`, distinct
    // from every wave-1 fontId) + style (`lua`, gradient `surfaceTexture`).
    theme: { paletteId: 'lua', fontId: 'cormorant-only', styleId: 'lua' },
    tier: 'BASIC',
    eventTypes: ['WEDDING', 'BIRTHDAY', 'BABY_MONTH'],
    coverVariant: 'photo-full',
    sortOrder: 50,
  },
  {
    id: 'sen-truc',
    name: 'Sen & Trúc',
    description: 'Sen mùa hạ, trúc xanh — botanical Việt.',
    // Phase 08 wave-2 (2026-08-02): was a placeholder (`sen-ha`/`soft`) —
    // now its own palette (deep green accent) + style (`sen-truc`, lotus +
    // bamboo line-art motif). `fontId: 'be-lora'` unchanged — already
    // matched the architecture table's "Lora/Vollkorn" pick before this
    // phase, and no other wave-2/wave-1 family uses it.
    theme: { paletteId: 'sen-truc', fontId: 'be-lora', styleId: 'sen-truc' },
    tier: 'BASIC',
    eventTypes: ['WEDDING', 'BIRTHDAY', 'BABY_MONTH'],
    coverVariant: 'photo-full',
    sortOrder: 60,
  },
];

export function getFamily(id: string): DesignFamily | undefined {
  return DESIGN_FAMILIES.find((f) => f.id === id);
}

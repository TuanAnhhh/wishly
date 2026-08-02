export type PaletteTokens = {
  id: string;
  name: string;
  /** Page / section background */
  bg: string;
  surface: string;
  ink: string;
  inkMuted: string;
  inkSoft: string;
  accent: string;
  accentSoft: string;
  border: string;
  borderStrong: string;
  hairline: string;
  /** Cover / dark band text (usually cream on photo) */
  onPhoto: string;
  /** Footer / son-mai dark surface */
  darkBg: string;
  darkInk: string;
};

/**
 * Invitation theme palettes — values from Thiệp Việt Design System/tokens.
 * Template themes override tokens; they are not separate CSS files.
 */
export const PALETTES: Record<string, PaletteTokens> = {
  'co-ngu': {
    id: 'co-ngu',
    name: 'Cổ Ngự',
    bg: '#FDFBF7',
    surface: '#F6F1E7',
    ink: '#2E2620',
    inkMuted: '#5A4B3F',
    // Was #8B7B6C (~3.62:1 on `surface`, below WCAG AA 4.5:1 for <24px text
    // like Eyebrow/MediaSlot label) — darkened per design/style-spec.md §4.
    inkSoft: '#77685B',
    accent: '#B04A3A',
    accentSoft: '#F5E3DE',
    border: '#E2D8C8',
    borderStrong: '#D8CDBB',
    hairline: '#EDE4D5',
    onPhoto: '#FDFBF7',
    darkBg: '#2E2620',
    darkInk: '#D6CBBB',
  },
  'ao-dai': {
    id: 'ao-dai',
    name: 'Áo Dài',
    bg: '#FDFBF7',
    surface: '#F5E3DE',
    ink: '#2E2620',
    inkMuted: '#5A4B3F',
    // Was #8B7B6C (~3.95:1 on `bg` #FDFBF7, below WCAG AA 4.5:1) — reusing
    // the exact co-ngu fix value since `bg` is identical. Surfaced by
    // Phase 05's wider contrast check (see phase-05 Decisions Log); this
    // palette was explicitly out of Phase 02 D1's scope (no look used it),
    // so the fix wasn't applied there. Not a new design axis, same
    // mechanical WCAG fix already approved for co-ngu/sen-ha/giay-trang.
    inkSoft: '#77685B',
    accent: '#B04A3A',
    accentSoft: '#F5E3DE',
    border: '#E2D8C8',
    borderStrong: '#D8CDBB',
    hairline: '#EDE4D5',
    onPhoto: '#FDFBF7',
    darkBg: '#2E2620',
    darkInk: '#D6CBBB',
  },
  'sen-ha': {
    id: 'sen-ha',
    name: 'Sen Hạ',
    bg: '#FDFBF7',
    surface: '#F6F1E7',
    ink: '#2E2620',
    inkMuted: '#5A4B3F',
    // Was #8B7B6C — see co-ngu comment above (same fix, same contrast gap).
    inkSoft: '#77685B',
    accent: '#A33A2E',
    accentSoft: '#F5E3DE',
    border: '#E2D8C8',
    borderStrong: '#D8CDBB',
    hairline: '#EDE4D5',
    onPhoto: '#FDFBF7',
    darkBg: '#2E2620',
    darkInk: '#D6CBBB',
  },
  'giay-trang': {
    id: 'giay-trang',
    name: 'Giấy Trắng',
    bg: '#FDFBF7',
    surface: '#FDFBF7',
    ink: '#2E2620',
    inkMuted: '#5A4B3F',
    // Was #8B7B6C — see co-ngu comment above (same fix, same contrast gap).
    inkSoft: '#77685B',
    accent: '#2E2620',
    accentSoft: '#EDE4D5',
    border: '#E2D8C8',
    borderStrong: '#D8CDBB',
    hairline: '#EDE4D5',
    onPhoto: '#FDFBF7',
    darkBg: '#2E2620',
    darkInk: '#D6CBBB',
  },
  'sai-gon': {
    id: 'sai-gon',
    name: 'Sài Gòn',
    bg: '#F2ECE0',
    surface: '#FDFBF7',
    ink: '#2E2620',
    inkMuted: '#5A4B3F',
    // Same fix as ao-dai above — reuse #77685B, still ≥4.5:1 on this `bg`
    // (#F2ECE0). See phase-05 Decisions Log.
    inkSoft: '#77685B',
    accent: '#B04A3A',
    accentSoft: '#F5E3DE',
    border: '#E2D8C8',
    borderStrong: '#D8CDBB',
    hairline: '#EDE4D5',
    onPhoto: '#FDFBF7',
    darkBg: '#2E2620',
    darkInk: '#D6CBBB',
  },
  'tra-chieu': {
    id: 'tra-chieu',
    name: 'Trà Chiều',
    bg: '#E7EBE1',
    surface: '#FDFBF7',
    ink: '#2E2620',
    inkMuted: '#4F5D47',
    // Was #7A8B6F (~3.02:1 on `bg` #E7EBE1, below WCAG AA 4.5:1) — darkened
    // within the same green hue family (distinct from the brown `inkSoft`
    // used elsewhere, since this palette's whole muted scale is green).
    // Surfaced by Phase 05's wider contrast check; see Decisions Log.
    inkSoft: '#5F6C57',
    accent: '#87692B',
    accentSoft: '#F5EBD6',
    border: '#D8CDBB',
    borderStrong: '#C9A961',
    hairline: '#DCE3D4',
    onPhoto: '#FDFBF7',
    darkBg: '#2E2620',
    darkInk: '#D6CBBB',
  },
  /**
   * Phase 08 wave-2 (`plans/260801-0658-template-design-families`):
   * architecture table proposed darkening `bg` to `#1F1A16`, but this
   * palette already backs 1 real `Invitation` (P03 migration) — plan.md
   * invariant 5 says any hex change here is not "free". Contrast-checked
   * both: current `#2E2620` already clears every threshold with margin
   * (ink 14.4:1, inkMuted 9.3:1, inkSoft 6.5:1, accent 6.6:1, vs. 4.5/4.5/
   * 4.5/3.0 required) — the darker value isn't *needed* to pass the gate,
   * only a stylistic preference. Kept `#2E2620` unchanged; only
   * `styles.ts['dark-luxe'].verified` flips this phase. See phase-08 report.
   */
  'son-mai': {
    id: 'son-mai',
    name: 'Sơn Mài',
    bg: '#2E2620',
    surface: '#3A322B',
    ink: '#FDFBF7',
    inkMuted: '#D6CBBB',
    inkSoft: '#B8AA99',
    accent: '#C9A961',
    accentSoft: '#4A3F35',
    border: '#4A3F35',
    borderStrong: '#5A4B3F',
    hairline: '#3A322B',
    onPhoto: '#FDFBF7',
    darkBg: '#241E19',
    darkInk: '#D6CBBB',
  },
  'vang-cat': {
    id: 'vang-cat',
    name: 'Vàng Cát',
    bg: '#F5EBD6',
    surface: '#FDFBF7',
    ink: '#2E2620',
    // Was #87692B (~4.34:1 on `bg` #F5EBD6, just under WCAG AA 4.5:1) —
    // minimal darken, same mustard/gold hue. Surfaced by Phase 05's wider
    // contrast check (previous gate only read `ink`/`bg`, never `inkMuted`
    // — this failure existed unnoticed before Phase 05). See Decisions Log.
    inkMuted: '#826529',
    // Same fix as ao-dai/sai-gon above — reuse #77685B, still ≥4.5:1 on
    // this `bg` (#F5EBD6).
    inkSoft: '#77685B',
    accent: '#B04A3A',
    accentSoft: '#F5E3DE',
    border: '#E2D8C8',
    borderStrong: '#D8CDBB',
    hairline: '#EDE4D5',
    onPhoto: '#FDFBF7',
    darkBg: '#2E2620',
    darkInk: '#D6CBBB',
  },
  /**
   * Phase 05 wave-1 (`plans/260801-0658-template-design-families`) — cool
   * teal, deliberately breaks the red-son/gold monopoly of the other 8
   * palettes (D2/architecture table). Pairs with `styles.ts['gach-bong']`
   * (diamond-lattice `surfaceTexture`, rosette `motifSetId`) and
   * `fonts.ts['bricolage-be']`.
   */
  'gach-bong': {
    id: 'gach-bong',
    name: 'Gạch Bông',
    bg: '#FAFAF7',
    surface: '#EEF1EF',
    ink: '#2E2620',
    inkMuted: '#5A4B3F',
    inkSoft: '#77685B',
    accent: '#2E6B6B',
    accentSoft: '#DDE6E3',
    border: '#C1D2D0',
    borderStrong: '#ACC4C2',
    hairline: '#DBE5E2',
    onPhoto: '#FDFBF7',
    darkBg: '#2E2620',
    darkInk: '#D6CBBB',
  },
  /**
   * Phase 05 wave-1 — bronze/đồng cổ, pairs with `styles.ts['dong-son']`
   * (sparse sun-star `surfaceTexture`, drum-motif `motifSetId`) and
   * `fonts.ts['newsreader-be']`.
   */
  'dong-son': {
    id: 'dong-son',
    name: 'Đông Sơn',
    bg: '#EFE7D8',
    surface: '#FDFBF7',
    ink: '#2E2620',
    inkMuted: '#5A4B3F',
    // Was #77685B (~4.37:1 on this `bg` #EFE7D8, below WCAG AA 4.5:1 for
    // Eyebrow/MediaSlot label) — darkened within the same brown hue family,
    // caught by contrastRatio() before commit per phase-05 step 2.
    inkSoft: '#706256',
    accent: '#8C6A3F',
    accentSoft: '#DFD3C0',
    border: '#E2D8C8',
    borderStrong: '#D8CDBB',
    hairline: '#EDE4D5',
    onPhoto: '#FDFBF7',
    darkBg: '#2E2620',
    darkInk: '#D6CBBB',
  },
  /**
   * Phase 05 wave-1 — near-monochrome ink-on-paper (mực nho), pairs with
   * `styles.ts['giay-do']` (paper-fiber `surfaceTexture`, no `motifSetId`)
   * and `fonts.ts['eb-garamond-only']`. `accent` intentionally close in tone
   * to `ink` — "gần monochrome" is this family's explicit design intent
   * (architecture table), not an oversight.
   */
  'giay-do': {
    id: 'giay-do',
    name: 'Giấy Dó',
    bg: '#F4F0E6',
    surface: '#FDFBF7',
    ink: '#2E2620',
    inkMuted: '#5A4B3F',
    inkSoft: '#77685B',
    accent: '#1F1A16',
    accentSoft: '#DFDBD1',
    border: '#E2D8C8',
    borderStrong: '#D8CDBB',
    hairline: '#EDE4D5',
    onPhoto: '#FDFBF7',
    darkBg: '#2E2620',
    darkInk: '#D6CBBB',
  },
  /**
   * Phase 08 wave-2 (`plans/260801-0658-template-design-families`) — dusty
   * rose accent, deliberately far from `gach-bong`'s teal (a jade/turquoise
   * accent was the architecture table's other suggested option but sits too
   * close in hue to `gach-bong` #2E6B6B — rose keeps all 6 families' accents
   * visually distinct, not just distinct by hex). All ink/bg/inkMuted/
   * inkSoft/accent pairs contrast-checked ≥ threshold before commit (ink
   * 13.6:1, inkMuted 7.6:1, inkSoft 4.9:1, accent 4.0:1 — see phase-08
   * report). Pairs with `styles.ts['lua']` (`surfaceTexture: { gradient }`,
   * no motif) and `fonts.ts['cormorant-only']`.
   */
  lua: {
    id: 'lua',
    name: 'Lụa',
    // Deliberately more saturated than a "just pale pink" first pass
    // (`#FBF3F1`) — that value's max RGB-channel distance to `sen-truc`'s
    // cream `bg` was only 4 (near-indistinguishable to a pixel-diff check),
    // exactly the "6 family bắt đầu trùng nhau" risk this phase's own risk
    // table flagged — and this is the one texture invisible in OG (gradient,
    // no tile — OG has no gradient support, see `invitations.service.ts`),
    // so OG had nothing else to differentiate on. Caught by the actual OG
    // pixel-diff check (2.0%, need >40%) before shipping — see phase-08
    // report. `inkSoft` darkened from the reused `#77685B` to `#6B5C4F` to
    // re-clear 4.5:1 on this now-darker `bg` (was 4.02:1, FAIL).
    bg: '#F4D9D6',
    surface: '#FDF8F6',
    ink: '#2E2620',
    inkMuted: '#5A4B3F',
    inkSoft: '#6B5C4F',
    accent: '#B85C6B',
    accentSoft: '#F3DEE1',
    border: '#EBD9D3',
    borderStrong: '#DFC5BE',
    hairline: '#F5E7E3',
    onPhoto: '#FDFBF7',
    darkBg: '#2E2620',
    darkInk: '#D6CBBB',
  },
  /**
   * Phase 08 wave-2 — deep muted green accent ("xanh lá trầm"), cream bg
   * matches the architecture table's `#F7F4EC` exactly. `inkMuted`/`inkSoft`
   * reuse `tra-chieu`'s green-tinted mechanical fix (already contrast-vetted
   * for an even darker bg, #E7EBE1, so recomputed here for this lighter one:
   * inkMuted 6.4:1, inkSoft 5.1:1, accent 7.2:1 — see phase-08 report).
   * `ink` stays the universal near-black (not green-tinted) — at this
   * darkness any tint reads as black anyway, and reusing the already-proven
   * value avoids introducing an unverified new near-black. Pairs with
   * `styles.ts['sen-truc']` (line-art lotus/bamboo motif, no/very-light
   * texture) and `fonts.ts['be-lora']`.
   */
  'sen-truc': {
    id: 'sen-truc',
    name: 'Sen & Trúc',
    // `#F7F4EC` (architecture table's literal suggestion) had max
    // RGB-channel distance 4-6 vs both `giay-do` and `lua`'s original bg —
    // OG pixel-diff FAILed both pairs (7.7%, 2.0%; need >40%). Pushed toward
    // a more visibly minty/green-tinted cream instead — see `lua`'s `bg`
    // comment above and phase-08 report for the full pixel-diff table.
    bg: '#E3EDD8',
    surface: '#FDFBF7',
    ink: '#2E2620',
    inkMuted: '#4F5D47',
    inkSoft: '#5F6C57',
    accent: '#2F5A3D',
    accentSoft: '#DCE8DC',
    border: '#D3DECE',
    borderStrong: '#BFCFB8',
    hairline: '#E5EEE0',
    onPhoto: '#FDFBF7',
    darkBg: '#2E2620',
    darkInk: '#D6CBBB',
  },
};

export const DEFAULT_PALETTE_ID = 'co-ngu';

export function getPalette(id: string): PaletteTokens {
  return PALETTES[id] ?? PALETTES[DEFAULT_PALETTE_ID];
}

/** '#2E2620' -> '46, 38, 32' — for `rgba(var(--inv-ink-rgb), .42)` overlays. */
function hexToRgbTriplet(hex: string): string {
  const raw = hex.replace('#', '');
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw.slice(0, 6);
  const n = Number.parseInt(full, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

export function paletteToCssVars(
  palette: PaletteTokens
): Record<string, string> {
  return {
    '--inv-bg': palette.bg,
    '--inv-surface': palette.surface,
    '--inv-ink': palette.ink,
    '--inv-ink-muted': palette.inkMuted,
    '--inv-ink-soft': palette.inkSoft,
    '--inv-accent': palette.accent,
    '--inv-accent-soft': palette.accentSoft,
    '--inv-border': palette.border,
    '--inv-border-strong': palette.borderStrong,
    '--inv-hairline': palette.hairline,
    '--inv-on-photo': palette.onPhoto,
    '--inv-dark-bg': palette.darkBg,
    '--inv-dark-ink': palette.darkInk,
    /**
     * rgb triplets (no `rgb()` wrapper) for alpha-blended overlays — e.g.
     * `rgba(var(--inv-scrim-rgb), .42)` for the Cover photo gradient.
     *
     * Deliberately sourced from `darkBg`/`onPhoto`, NOT `ink`/`bg`: `ink` is
     * the *readable-text* color and flips light/dark per theme (light on
     * `son-mai`), so an ink-based scrim would turn the Cover overlay light on
     * dark-luxe and wash out the (always-cream) `onPhoto` text. `darkBg` is
     * defined to always be dark regardless of overall theme lightness, which
     * is the actual invariant a photo scrim needs; `onPhoto` is the fixed
     * light counterpart already used for on-photo text everywhere.
     */
    '--inv-scrim-rgb': hexToRgbTriplet(palette.darkBg),
    '--inv-on-photo-rgb': hexToRgbTriplet(palette.onPhoto),
  };
}

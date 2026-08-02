import { DEFAULT_MOTIF_ID, getMotif, motifDataUri } from './motifs.js';
import { getTexture } from './textures.js';

export type StyleTokens = {
  id: string;
  name: string;
  /** Cover h1 fontSize, px */
  displayXl: number;
  /** Section h2 (`BlockHeading`) fontSize, px */
  displayLg: number;
  /** Sub-heading (venue/host/title) fontSize, px */
  displayMd: number;
  /** `BlockSection` padding, CSS shorthand (already includes unit) */
  sectionPadding: string;
  /** Main stack gap within a block, px */
  stackGap: number;
  /** 1 = bottom hairline only (current default), 4 = full frame around block content */
  frameSides: 1 | 4;
  /** Inset from block edge to the 4-side frame, px. 0 when frameSides === 1 */
  frameInset: number;
  /** Divider (`InvitationRule`) look: diamond motif vs plain hairline */
  dividerMotif: 'diamond' | 'hairline';
  /** Diamond size, px. 0 when dividerMotif === 'hairline' */
  dividerSize: number;
  /** Divider max-width, CSS value (already includes unit, e.g. '220px' or '100%') */
  dividerMaxWidth: string;
  /** Gap between line and diamond, px. 0 when dividerMotif === 'hairline' */
  dividerGap: number;
  /** border-radius for block/card/input, px */
  cornerCard: number;
  /** `Eyebrow` letterSpacing, em (unitless number — baked to `Xem` in styleToCssVars) */
  trackEyebrow: number;
  /** `Eyebrow` fontWeight */
  weightEyebrow: number;
  /**
   * Background fill overlay — `null` (most presets) = flat `--inv-bg`/
   * `--inv-surface`, no image. **Not** the same axis as `frameSides`/
   * `frameInset` (those control an inset border LINE around block content;
   * this controls a background FILL pattern).
   *
   * Two shapes:
   * - `{ tileId, size, opacity }` — repeating tile from `themes/textures.ts`.
   * - `{ gradient, opacity }` (P08/wave-2, `lua`) — raw CSS `<image>` value
   *   (e.g. `linear-gradient(...)`) used as-is, no tile lookup. `size`/
   *   `backgroundRepeat` are irrelevant for a gradient (it already fills the
   *   full element at `background-size: auto`'s default gradient behavior),
   *   so this variant omits `size` entirely — see `styleToCssVars`.
   */
  surfaceTexture?:
    | { tileId: string; size: string; opacity: number }
    | { gradient: string; opacity: number }
    | null;
  /**
   * `MOTIFS` registry id for divider/corner/frame/section ornament art.
   * `'no-motif'` (all current presets) = no art defined → consumers
   * (`InvitationRule`) fall back to their pre-existing hardcoded look.
   */
  motifSetId?: string;
  /**
   * Cover/photo silhouette. Independent of `frameSides`/`frameInset` (§Todo
   * unresolved #4 — shape vs. inset are different axes, both kept). Only
   * `'rect'`/`'arch'` have real rendering logic today (`archFrame.tsx`,
   * `og.service.ts`); `'octagon'`/`'scallop'` are declared per the P00 spike
   * (both satori-safe) but unimplemented until a consumer needs them — YAGNI.
   */
  frameShape?: 'rect' | 'arch' | 'octagon' | 'scallop';
  /** Per-block rhythm/heading layout — declared here, consumed by P06 (`blocks/shared.tsx`). Not wired to any visual yet. */
  layoutMode?: 'centered' | 'editorial';
  /**
   * Must pass tools/verify-template.ts (Phase 05: iterate every styleId) before
   * being considered production-safe beyond the current classic baseline.
   */
  verified: boolean;
};

/**
 * Invitation style presets — vocabulary reverse-engineered from the running
 * `classic` look (see plans/260730-1502-template-style-vocabulary/design/style-spec.md).
 * Template themes reference these by id; they are not separate CSS files.
 */
export const STYLES: Record<string, StyleTokens> = {
  classic: {
    id: 'classic',
    name: 'Cổ Ngự (mặc định)',
    displayXl: 52,
    displayLg: 30,
    displayMd: 26,
    sectionPadding: '44px 24px',
    stackGap: 24,
    frameSides: 1,
    frameInset: 0,
    dividerMotif: 'diamond',
    dividerSize: 7,
    dividerMaxWidth: '220px',
    dividerGap: 12,
    cornerCard: 3,
    trackEyebrow: 0.16,
    weightEyebrow: 600,
    surfaceTexture: null,
    motifSetId: 'no-motif',
    frameShape: 'rect',
    layoutMode: 'centered',
    verified: true,
  },
  'dark-luxe': {
    id: 'dark-luxe',
    name: 'Sơn Mài — dark luxe',
    displayXl: 56,
    displayLg: 32,
    displayMd: 28,
    sectionPadding: '56px 28px',
    stackGap: 28,
    frameSides: 4,
    frameInset: 12,
    dividerMotif: 'diamond',
    dividerSize: 10,
    dividerMaxWidth: '280px',
    dividerGap: 16,
    cornerCard: 0,
    trackEyebrow: 0.2,
    weightEyebrow: 600,
    // Phase 08 wave-2: crackle-lacquer tile on the dark `son-mai` bg. Bigger
    // tile (`90px` vs wave-1's 48-140px range) and higher opacity than any
    // light-bg texture (0.16 vs 0.08-0.18) — a light-bg-tuned opacity read as
    // nearly invisible against dark brown in visual review, confirming the
    // phase's own risk flag ("giả định opacity tính cho nền sáng có sai
    // không" — yes, needed its own tuning, not a shared constant).
    surfaceTexture: { tileId: 'son-mai', size: '90px', opacity: 0.16 },
    motifSetId: 'son-mai',
    // `arch`, not `rect` — this is the one style whose `frameSides: 4` inset
    // border is actually meant to be seen, paired with the `arch-frame` cover
    // variant (see lacquer.ts). `archFrame.tsx` now reads `frameShape`
    // instead of `frameSides === 4` directly (P02 migration).
    frameShape: 'arch',
    layoutMode: 'centered',
    // Contrast-vetted in D1 (§4), and now through the automated Playwright
    // contrast gate too (Phase 08: ink 14.4:1, inkMuted 9.3:1, inkSoft 6.5:1,
    // accent 6.6:1 on `son-mai`'s unchanged `bg` — see phase-08 report).
    verified: true,
  },
  minimal: {
    id: 'minimal',
    name: 'Giấy Trắng — minimal',
    displayXl: 48,
    displayLg: 28,
    displayMd: 24,
    sectionPadding: '64px 24px',
    stackGap: 32,
    frameSides: 1,
    frameInset: 0,
    dividerMotif: 'hairline',
    dividerSize: 0,
    dividerMaxWidth: '100%',
    dividerGap: 0,
    cornerCard: 0,
    trackEyebrow: 0.12,
    weightEyebrow: 500,
    surfaceTexture: null,
    motifSetId: 'no-motif',
    frameShape: 'rect',
    layoutMode: 'centered',
    verified: false,
  },
  soft: {
    id: 'soft',
    name: 'Sen Hạ — soft',
    displayXl: 52,
    displayLg: 30,
    displayMd: 26,
    sectionPadding: '48px 24px',
    stackGap: 28,
    frameSides: 1,
    frameInset: 0,
    dividerMotif: 'diamond',
    dividerSize: 5,
    dividerMaxWidth: '180px',
    dividerGap: 10,
    cornerCard: 12,
    trackEyebrow: 0.16,
    weightEyebrow: 600,
    surfaceTexture: null,
    motifSetId: 'no-motif',
    frameShape: 'rect',
    layoutMode: 'centered',
    verified: false,
  },
  /**
   * Phase 05 wave-1 (`plans/260801-0658-template-design-families`) — 3
   * family-carrying presets. Numeric fields inherited byte-for-byte from
   * `classic` per the phase's own instruction ("kế thừa số từ classic trừ
   * khi có lý do — đừng chế số mới cho vui, khác biệt đến từ 4 trục định
   * tính"); only `surfaceTexture`/`motifSetId`/`frameShape`/`layoutMode`
   * differ. `layoutMode` left at `'centered'` for all 3 — P06 (layoutMode
   * wiring) is still pending per plan.md, so this field has zero visual
   * effect yet regardless of value (see field doc above); phase-05's own
   * contingency says fall back to `'centered'` and revisit once P06 ships.
   */
  'gach-bong': {
    id: 'gach-bong',
    name: 'Gạch Bông',
    displayXl: 52,
    displayLg: 30,
    displayMd: 26,
    sectionPadding: '44px 24px',
    stackGap: 24,
    frameSides: 1,
    frameInset: 0,
    dividerMotif: 'diamond',
    dividerSize: 7,
    dividerMaxWidth: '220px',
    dividerGap: 12,
    cornerCard: 3,
    trackEyebrow: 0.16,
    weightEyebrow: 600,
    surfaceTexture: { tileId: 'gach-bong', size: '56px', opacity: 0.14 },
    motifSetId: 'gach-bong',
    // Declared per the architecture table (P00 Q4 confirmed satori/`clip-path`
    // can render an octagon) but currently inert: `coverVariant: 'split'`
    // (see families.ts) doesn't read `frameShape` at all, and neither
    // `archFrame.tsx` nor `og.service.ts` implement the `'octagon'` case yet
    // (both fall through to plain `'rect'`, same YAGNI as `'scallop'`) — no
    // component was added this phase to keep that implementation (Related
    // code files §"Không tạo file mới"). Revisit once a real consumer needs it.
    frameShape: 'octagon',
    // P06 (2026-08-02, user-confirmed): "family hiện đại" per phase-06's own
    // risk-mitigation note — geometric/repeat-pattern identity reads fine
    // left-aligned. `dong-son`/`dark-luxe` (traditional/ornate) stay
    // `centered` on purpose, see those presets below.
    layoutMode: 'editorial',
    verified: true,
  },
  'dong-son': {
    id: 'dong-son',
    name: 'Đông Sơn',
    displayXl: 52,
    displayLg: 30,
    displayMd: 26,
    sectionPadding: '44px 24px',
    stackGap: 24,
    frameSides: 1,
    frameInset: 0,
    dividerMotif: 'diamond',
    dividerSize: 7,
    dividerMaxWidth: '220px',
    dividerGap: 12,
    cornerCard: 3,
    trackEyebrow: 0.16,
    weightEyebrow: 600,
    // "rất nhẹ" branch of the architecture table's "không (hoặc rất nhẹ)" —
    // P04 built this texture specifically for this family; leaving it unused
    // would waste a verified asset for no stated reason.
    surfaceTexture: { tileId: 'dong-son', size: '140px', opacity: 0.08 },
    motifSetId: 'dong-son',
    // `coverVariant: 'arch-frame'` (families.ts) but `frameShape: 'rect'`,
    // not `'arch'`, is intentional per the architecture table: this family
    // wants the photo-full-bleed-with-overlay archetype, not `dark-luxe`'s
    // inset decorative line (`archFrame.tsx`'s `showFrame` gate).
    frameShape: 'rect',
    // P06: stays `centered` on purpose — drum/sun-star motif family reads as
    // the most traditional/ornate of the 3 wave-1 families (phase-06 risk
    // table: "editorial trông 'không giống thiệp cưới' với khách VN lớn
    // tuổi" — this is the family where that risk is highest).
    layoutMode: 'centered',
    verified: true,
  },
  'giay-do': {
    id: 'giay-do',
    name: 'Giấy Dó',
    displayXl: 52,
    displayLg: 30,
    displayMd: 26,
    sectionPadding: '44px 24px',
    stackGap: 24,
    frameSides: 1,
    frameInset: 0,
    dividerMotif: 'diamond',
    dividerSize: 7,
    dividerMaxWidth: '220px',
    dividerGap: 12,
    cornerCard: 3,
    trackEyebrow: 0.16,
    weightEyebrow: 600,
    surfaceTexture: { tileId: 'giay-do', size: '48px', opacity: 0.18 },
    // Type-led by design (architecture table: "không motif") — divider falls
    // back to the pre-existing `DiamondRule`, not a motif glyph.
    motifSetId: 'no-motif',
    frameShape: 'rect',
    // P06 (2026-08-02, user-confirmed): "family hiện đại" — minimal/type-led
    // family, left-aligned prose fits its own "để chữ dẫn dắt" identity
    // (description above) at least as well as centered does.
    layoutMode: 'editorial',
    verified: true,
  },
  /**
   * Phase 08 wave-2 — Lụa is the "cheap" family per the phase's own cost
   * ranking: gradient instead of a traced motif, `motifSetId: 'no-motif'`
   * (architecture table's "null-motif", same id as every no-motif preset
   * uses). Numeric fields inherited from `classic` unchanged, per the same
   * "don't invent numbers for fun" rule wave-1 followed.
   */
  lua: {
    id: 'lua',
    name: 'Lụa',
    displayXl: 52,
    displayLg: 30,
    displayMd: 26,
    sectionPadding: '44px 24px',
    stackGap: 24,
    frameSides: 1,
    frameInset: 0,
    dividerMotif: 'diamond',
    dividerSize: 7,
    dividerMaxWidth: '220px',
    dividerGap: 12,
    cornerCard: 3,
    trackEyebrow: 0.16,
    weightEyebrow: 600,
    // Rose → warm gold → soft jade diagonal sheen — evokes lụa's signature
    // "sóng" (shot-silk shimmer: warp/weft dyed differently so the fabric
    // shifts tone with the light), not a generic web gradient. Alpha baked
    // per-stop (rose slightly stronger than the jade tail) rather than via
    // the outer `opacity` field, so `opacity: 1` here is intentional, not a
    // placeholder — see styles.ts `surfaceTexture` doc / phase-08 report
    // §Unresolved-2 resolution (type extended to a `{ gradient }` variant).
    surfaceTexture: {
      gradient:
        'linear-gradient(135deg, rgba(184,92,107,0.16) 0%, rgba(224,196,170,0.12) 45%, rgba(93,140,124,0.10) 100%)',
      opacity: 1,
    },
    motifSetId: 'no-motif',
    frameShape: 'arch',
    layoutMode: 'centered',
    verified: true,
  },
  /**
   * Phase 08 wave-2 — "không / rất nhẹ" texture per the architecture table;
   * chose "không" (`surfaceTexture: null`) over `dong-son`'s "rất nhẹ" path
   * — the lotus/bamboo line-art motif already carries this family's
   * botanical identity on its own (unlike `dong-son`, where the drum motif
   * alone read as too sparse in P04 review, hence its added star texture).
   * Adding a texture here for parity's sake with no stated visual need
   * would just be more unverified art for no reason — YAGNI.
   */
  'sen-truc': {
    id: 'sen-truc',
    name: 'Sen & Trúc',
    displayXl: 52,
    displayLg: 30,
    displayMd: 26,
    sectionPadding: '44px 24px',
    stackGap: 24,
    frameSides: 1,
    frameInset: 0,
    dividerMotif: 'diamond',
    dividerSize: 7,
    dividerMaxWidth: '220px',
    dividerGap: 12,
    cornerCard: 3,
    trackEyebrow: 0.16,
    weightEyebrow: 600,
    surfaceTexture: null,
    motifSetId: 'sen-truc',
    frameShape: 'arch',
    layoutMode: 'centered',
    verified: true,
  },
};

export const DEFAULT_STYLE_ID = 'classic';

export function getStyle(id: string): StyleTokens {
  return STYLES[id] ?? STYLES[DEFAULT_STYLE_ID]!;
}

/**
 * `accent` is needed only to recolor `motifSetId`'s divider glyph (textures
 * are NOT accent-tinted, see `themes/textures.ts`) — every call site already
 * has a resolved palette in scope (`resolveTheme`), so this doesn't widen
 * the boundary, just makes an existing dependency explicit.
 */
export function styleToCssVars(style: StyleTokens, accent: string): Record<string, string> {
  const vars: Record<string, string> = {
    '--inv-display-xl': `${style.displayXl}px`,
    '--inv-display-lg': `${style.displayLg}px`,
    '--inv-display-md': `${style.displayMd}px`,
    '--inv-rhythm-section-padding': style.sectionPadding,
    '--inv-rhythm-stack-gap': `${style.stackGap}px`,
    '--inv-frame-sides': String(style.frameSides),
    '--inv-frame-inset': `${style.frameInset}px`,
    '--inv-divider-motif': style.dividerMotif,
    '--inv-divider-size': `${style.dividerSize}px`,
    '--inv-divider-max-width': style.dividerMaxWidth,
    '--inv-divider-gap': `${style.dividerGap}px`,
    '--inv-corner-card': `${style.cornerCard}px`,
    '--inv-track-eyebrow': `${style.trackEyebrow}em`,
    '--inv-weight-eyebrow': String(style.weightEyebrow),
    '--inv-frame-shape': style.frameShape ?? 'rect',
    '--inv-layout-mode': style.layoutMode ?? 'centered',
  };

  // Omit the key entirely when there's no image — consumers reference
  // `var(--inv-texture-image, none)` so the fallback applies automatically.
  // Never emit the literal string 'none' here (satori's OG tree is a
  // separate, unrelated code path, but the FE idiom below is the analog of
  // the P00 rule "don't set backgroundImage: 'none', omit the property").
  const texture = style.surfaceTexture;
  if (texture && 'gradient' in texture) {
    vars['--inv-texture-image'] = texture.gradient;
    vars['--inv-texture-opacity'] = String(texture.opacity);
  } else if (texture) {
    const tile = getTexture(texture.tileId);
    if (tile.dataUri) {
      vars['--inv-texture-image'] = `url(${tile.dataUri})`;
      vars['--inv-texture-size'] = texture.size;
      vars['--inv-texture-opacity'] = String(texture.opacity);
    }
  }

  const motif = getMotif(style.motifSetId ?? DEFAULT_MOTIF_ID);
  if (motif.dividerGlyph) {
    vars['--inv-motif-divider'] = `url(${motifDataUri(motif.dividerGlyph, accent)})`;
  }

  return vars;
}

export function listPickerStyles(): StyleTokens[] {
  return Object.values(STYLES).filter((s) => s.verified);
}

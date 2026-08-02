import { isValidBrandHex } from './derive-palette.js';

/**
 * Decorative ornament set — vector marks reused across a family's divider,
 * cover corner, frame edge, and section heading. Each field is a single-path
 * SVG string with `fill="__ACCENT__"` as a literal placeholder token (not a
 * CSS var — satori/resvg render a static image, so recolor happens by string
 * substitution before base64 encoding, see `motifDataUri`). `undefined` means
 * "no art for this slot yet" — consumers fall back to their pre-existing
 * hardcoded look (e.g. `InvitationRule` falls back to `DiamondRule`).
 */
export type MotifSet = {
  id: string;
  name: string;
  cornerArt?: string;
  dividerGlyph?: string;
  frameArt?: string;
  sectionMark?: string;
  /** Must pass tools/verify-template.ts before picker exposure (P09 scope). */
  verified: boolean;
};

export const MOTIFS: Record<string, MotifSet> = {
  'no-motif': {
    id: 'no-motif',
    name: 'Không hoa văn (mặc định)',
    verified: true,
  },
  /**
   * Original vector line art built directly from well-documented traditional
   * design vocabulary (Đông Dương/Indochine cement-tile geometry, Đông Sơn
   * bronze-drum motifs) — NOT traced from any specific photographed artifact.
   * See plans/260801-0658-template-design-families/design/art-sources.md for
   * the sourcing rationale (user-approved 2026-08-01, avoids the "AI invents
   * generic chinoiserie" and "photographer copyright" risks both flagged in
   * the phase plan). Coordinates for `gach-bong`/`dong-son` computed via
   * parametric math (see apps/api/tools/spike/gen-motif-paths.mjs), not
   * hand-guessed — guarantees exact symmetry.
   */
  'gach-bong': {
    id: 'gach-bong',
    name: 'Gạch Bông — hoa văn hình học',
    // 4-petal rosette — classic Đông Dương cement-tile centerpiece motif.
    dividerGlyph:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="__ACCENT__" d="M50,50 Q38.2,32.75 50,12 Q61.8,32.75 50,50 Q67.25,38.2 88,50 Q67.25,61.8 50,50 Q61.8,67.25 50,88 Q38.2,67.25 50,50 Q32.75,61.8 12,50 Q32.75,38.2 50,50 Z"/></svg>',
    // Same rosette, reused — a motif system repeating one core mark across
    // slots is a common, coherent pattern (not a placeholder shortcut).
    cornerArt:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="__ACCENT__" d="M50,50 Q38.2,32.75 50,12 Q61.8,32.75 50,50 Q67.25,38.2 88,50 Q67.25,61.8 50,50 Q61.8,67.25 50,88 Q38.2,67.25 50,50 Q32.75,61.8 12,50 Q32.75,38.2 50,50 Z"/></svg>',
    verified: true,
  },
  'dong-son': {
    id: 'dong-son',
    name: 'Đông Sơn — trống đồng',
    // 12-point radiating star — the Ngọc Lũ drum's central sun motif.
    dividerGlyph:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="__ACCENT__" d="M50,4 L57.76,21.02 L73,10.16 L71.21,28.79 L89.84,27 L78.98,42.24 L96,50 L78.98,57.76 L89.84,73 L71.21,71.21 L73,89.84 L57.76,78.98 L50,96 L42.24,78.98 L27,89.84 L28.79,71.21 L10.16,73 L21.02,57.76 L4,50 L21.02,42.24 L10.16,27 L28.79,28.79 L27,10.16 L42.24,21.02 Z"/></svg>',
    // Stylized chim Lạc (Lạc bird) — the drum's decorative-band bird motif,
    // simplified to a single flowing silhouette (long beak, trailing legs).
    cornerArt:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80"><path fill="__ACCENT__" d="M6,58 C16,50 30,44 44,42 C56,40 66,32 76,14 C78,10 80,8 82,7 C80,12 77,18 74,24 C82,22 90,24 96,30 C88,30 80,32 74,36 C70,38 68,40 67,43 C74,44 82,47 88,54 C79,51 70,50 62,52 C57,53 54,55 52,58 C58,60 63,64 66,70 C60,66 54,63 50,60 C44,64 36,68 26,70 C32,64 38,60 42,56 C32,58 18,60 6,58 Z"/></svg>',
    verified: true,
  },
  /**
   * Phase 08 wave-2 (`plans/260801-0658-template-design-families`) — carved
   * medallion for `son-mai`, "giảm tham vọng" per the phase's own risk
   * mitigation: a literal khảm trai (mother-of-pearl inlay) *scene* traces to
   * hundreds of potrace paths, unrealistic for a single divider glyph. An
   * 8-petal geometric medallion (parametric, `gen-motif-paths-wave2.mjs`,
   * same quadratic-lens-petal technique as `gach-bong`'s 4-petal rosette
   * above, tighter spread angle for a sharper/more "carved" silhouette)
   * reads as gilt relief on dark lacquer without needing a traced source
   * image, and stays visually distinct from `dong-son`'s 12-point star.
   */
  'son-mai': {
    id: 'son-mai',
    name: 'Sơn Mài — hoa văn chạm khắc',
    dividerGlyph:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="__ACCENT__" d="M50,50 Q43.77,31.21 50,14 Q56.23,31.21 50,50 Q58.89,32.31 75.46,24.54 Q67.69,41.11 50,50 Q68.79,43.77 86,50 Q68.79,56.23 50,50 Q67.69,58.89 75.46,75.46 Q58.89,67.69 50,50 Q56.23,68.79 50,86 Q43.77,68.79 50,50 Q41.11,67.69 24.54,75.46 Q32.31,58.89 50,50 Q31.21,56.23 14,50 Q31.21,43.77 50,50 Q32.31,41.11 24.54,24.54 Q41.11,32.31 50,50 Z"/></svg>',
    cornerArt:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="__ACCENT__" d="M50,50 Q43.77,31.21 50,14 Q56.23,31.21 50,50 Q58.89,32.31 75.46,24.54 Q67.69,41.11 50,50 Q68.79,43.77 86,50 Q68.79,56.23 50,50 Q67.69,58.89 75.46,75.46 Q58.89,67.69 50,50 Q56.23,68.79 50,86 Q43.77,68.79 50,50 Q41.11,67.69 24.54,75.46 Q32.31,58.89 50,50 Q31.21,56.23 14,50 Q31.21,43.77 50,50 Q32.31,41.11 24.54,24.54 Q41.11,32.31 50,50 Z"/></svg>',
    verified: true,
  },
  /**
   * Phase 08 wave-2 — lotus bloom (dividerGlyph) + bamboo culm (cornerArt),
   * deliberately **line-art** (`stroke`, `fill="none"`) rather than the
   * filled-silhouette convention `gach-bong`/`dong-son`/`son-mai` use above —
   * this is the phase's stated differentiator ("Sen & Trúc: line-art
   * sen/trúc" — architecture table). `motifDataUri`'s `__ACCENT__` string
   * substitution works identically whether the token sits in a `fill` or
   * `stroke` attribute, no code change needed for this. A parametric filled
   * version was tried first (`gen-motif-paths-wave2.mjs`'s `lotus()`) but
   * read as an indistinct sprout at divider scale — hand-tuned stroke
   * curves (screenshot-reviewed, `/tmp/motif-preview.png` during
   * authoring) read clearly as a 3-petal lotus instead.
   */
  'sen-truc': {
    id: 'sen-truc',
    name: 'Sen & Trúc — sen và trúc line-art',
    dividerGlyph:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g fill="none" stroke="__ACCENT__" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M50,82 C38,68 34,48 50,18 C66,48 62,68 50,82 Z"/><path d="M50,82 C34,74 18,60 22,38 C40,44 48,60 50,82 Z"/><path d="M50,82 C66,74 82,60 78,38 C60,44 52,60 50,82 Z"/><path d="M28,86 Q50,92 72,86" stroke-width="3"/></g></svg>',
    cornerArt:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g fill="none" stroke="__ACCENT__" stroke-width="4" stroke-linecap="round"><path d="M20,95 L20,15"/><path d="M12,75 L28,75"/><path d="M12,50 L28,50"/><path d="M12,25 L28,25"/><path d="M20,60 C40,55 55,40 68,15"/><path d="M20,35 C36,32 48,22 58,8"/></g></svg>',
    verified: true,
  },
};

export const DEFAULT_MOTIF_ID = 'no-motif';

export function getMotif(id: string): MotifSet {
  return MOTIFS[id] ?? MOTIFS[DEFAULT_MOTIF_ID]!;
}

/**
 * Inject a resolved accent hex into a motif SVG's `__ACCENT__` placeholder
 * and base64-encode as a `data:image/svg+xml` URI. `color` must already be a
 * validated `#rrggbb` hex — the only caller path that touches user input is
 * CORPORATE `derivePalette(brandColor)`, which validates via `isValidBrandHex`
 * before this ever runs; re-validated here too since string substitution into
 * SVG markup is otherwise an injection vector.
 */
export function motifDataUri(svg: string, color: string): string {
  if (!isValidBrandHex(color)) {
    throw new Error(`motifDataUri: invalid hex color "${color}"`);
  }
  const filled = svg.replaceAll('__ACCENT__', color);
  return `data:image/svg+xml;base64,${btoa(filled)}`;
}

export function listPickerMotifs(): MotifSet[] {
  return Object.values(MOTIFS).filter((m) => m.verified);
}

/**
 * Repeating background tile — pre-baked data URI (PNG or SVG, satori renders
 * both identically per plans/260801-0658-template-design-families §P00
 * spike). Unlike `MotifSet`, textures are NOT runtime-recolored: a family's
 * texture is fixed multi-color art, chosen per-palette at authoring time,
 * not tinted from `palette.accent`. `dataUri: ''` on the default entry means
 * "no image" — paired with `StyleTokens.surfaceTexture: null` at the style
 * level, which is the actual "no texture" signal consumers check first.
 */
export type Texture = {
  id: string;
  name: string;
  dataUri: string;
  /** Must pass tools/verify-template.ts before picker exposure (P09 scope). */
  verified: boolean;
};

export const TEXTURES: Record<string, Texture> = {
  'no-texture': {
    id: 'no-texture',
    name: 'Không chất liệu (mặc định)',
    dataUri: '',
    verified: true,
  },
  /**
   * Original vector tiles, not traced photos — same sourcing rationale as
   * `themes/motifs.ts` (see design/art-sources.md). SVG data URI chosen over
   * pre-rasterized PNG: smaller (~200-500B raw vs ~1-2KB PNG) and scales
   * cleanly on retina, both confirmed satori-safe by P00.
   */
  'gach-bong': {
    id: 'gach-bong',
    name: 'Gạch Bông — lưới hình thoi',
    dataUri:
      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZD0iTTE2LDIgTDMwLDE2IEwxNiwzMCBMMiwxNiBaIiBmaWxsPSJub25lIiBzdHJva2U9IiM4QzZBM0YiIHN0cm9rZS13aWR0aD0iMS4yIi8+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMi4yIiBmaWxsPSIjOEM2QTNGIi8+PC9zdmc+',
    verified: true,
  },
  // Sparse small sun-star (same motif family as `MOTIFS['dong-son']`'s
  // dividerGlyph, smaller/spaced) — reads distinctly Đông Sơn even at low
  // opacity; an earlier dense Greek-key meander attempt read as generic
  // chinoiserie instead, see phase-04 report.
  'dong-son': {
    id: 'dong-son',
    name: 'Đông Sơn — sao rải rác',
    dataUri:
      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MCA4MCI+PHBhdGggZmlsbD0iIzhDNkEzRiIgZD0iTTQwLDI0IEw0Mi43OCwzMS40NCBMNDkuNCwyNy4wNiBMNDcuMjgsMzQuNzEgTDU1LjIyLDM1LjA2IEw0OSw0MCBMNTUuMjIsNDQuOTQgTDQ3LjI4LDQ1LjI5IEw0OS40LDUyLjk0IEw0Mi43OCw0OC41NiBMNDAsNTYgTDM3LjIyLDQ4LjU2IEwzMC42LDUyLjk0IEwzMi43Miw0NS4yOSBMMjQuNzgsNDQuOTQgTDMxLDQwIEwyNC43OCwzNS4wNiBMMzIuNzIsMzQuNzEgTDMwLjYsMjcuMDYgTDM3LjIyLDMxLjQ0IFoiLz48L3N2Zz4=',
    verified: true,
  },
  // Paper fiber grain — Giấy Dó is type-led by design (no motif, see
  // MOTIFS — this family's `motifSetId` stays 'no-motif').
  'giay-do': {
    id: 'giay-do',
    name: 'Giấy Dó — vân giấy',
    dataUri:
      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCI+PGcgc3Ryb2tlPSIjOEI3QjZDIiBzdHJva2Utd2lkdGg9IjAuNiIgZmlsbD0ibm9uZSIgb3BhY2l0eT0iMC41IiBzdHJva2UtbGluZWNhcD0icm91bmQiPjxwYXRoIGQ9Ik00LDYgUTcsNCAxMCw3Ii8+PHBhdGggZD0iTTIwLDMgUTI0LDYgMjIsMTAiLz48cGF0aCBkPSJNMzYsOCBRMzksNSA0Miw5Ii8+PHBhdGggZD0iTTgsMjAgUTEyLDE3IDE1LDIxIi8+PHBhdGggZD0iTTI4LDE4IFEzMSwyMiAzNSwxOSIvPjxwYXRoIGQ9Ik00LDMyIFE4LDI5IDExLDMzIi8+PHBhdGggZD0iTTI0LDM0IFEyNywzMSAzMSwzNSIvPjxwYXRoIGQ9Ik00MCwzMCBRNDMsMzMgNDQsMjgiLz48cGF0aCBkPSJNMTQsNDIgUTE4LDM5IDIxLDQzIi8+PHBhdGggZD0iTTM0LDQ0IFEzOCw0MSA0Miw0NSIvPjwvZz48L3N2Zz4=',
    verified: true,
  },
  /**
   * Phase 08 wave-2 — "sơn mài rạn" (lacquer crackle glaze). Baked gold
   * (`#C9A961`, this family's own `accent`) irregular branching hairlines —
   * unlike a repeating geometric lattice (`gach-bong`), a crackle pattern is
   * inherently irregular, so this tile is hand-authored rather than
   * parametric. Applied at low `opacity` (style-level, see `styles.ts`) over
   * the dark `son-mai` bg — this is the one texture designed for a dark
   * surface; all others assume light `bg` (see phase-08 report §opacity
   * check for why that assumption doesn't silently break here).
   */
  'son-mai': {
    id: 'son-mai',
    name: 'Sơn Mài — rạn sơn',
    dataUri:
      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2MCA2MCI+PGcgc3Ryb2tlPSIjQzlBOTYxIiBzdHJva2Utd2lkdGg9IjAuNiIgZmlsbD0ibm9uZSIgb3BhY2l0eT0iMC42Ij48cGF0aCBkPSJNMiw4IEwxNCwxNCBMMTAsMjYgTDIyLDIwIi8+PHBhdGggZD0iTTIyLDIwIEwzNCwxMCBMMzAsMiIvPjxwYXRoIGQ9Ik0xNCwxNCBMMTgsMzAgTDgsMzggTDIsNTAiLz48cGF0aCBkPSJNMzQsMTAgTDQ2LDE4IEw1OCw2Ii8+PHBhdGggZD0iTTE4LDMwIEwzMiwzNCBMMjgsNDggTDQwLDQ0Ii8+PHBhdGggZD0iTTQ2LDE4IEw1NCwzMiBMNDYsNDIiLz48cGF0aCBkPSJNMjgsNDggTDIwLDU4Ii8+PHBhdGggZD0iTTQwLDQ0IEw1MCw1NCBMNTgsNDYiLz48L2c+PC9zdmc+',
    verified: true,
  },
};

export const DEFAULT_TEXTURE_ID = 'no-texture';

export function getTexture(id: string): Texture {
  return TEXTURES[id] ?? TEXTURES[DEFAULT_TEXTURE_ID]!;
}

export function listPickerTextures(): Texture[] {
  return Object.values(TEXTURES).filter((t) => t.verified);
}

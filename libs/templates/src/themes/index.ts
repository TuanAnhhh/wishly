/**
 * Pure-TS subpath — zero React imports (unlike the "." entry, which re-exports
 * InvitationRenderer). Import via `@wishly/templates/themes` from non-React
 * consumers (e.g. apps/api) so their bundler never pulls React in.
 */
export {
  DEFAULT_PALETTE_ID,
  getPalette,
  PALETTES,
  paletteToCssVars,
} from './palettes.js';
export type { PaletteTokens } from './palettes.js';

export { DEFAULT_FONT_ID, FONTS, getFont, listPickerFonts } from './fonts.js';
export type { FontPreset } from './fonts.js';

export {
  DEFAULT_STYLE_ID,
  STYLES,
  getStyle,
  listPickerStyles,
  styleToCssVars,
} from './styles.js';
export type { StyleTokens } from './styles.js';

export {
  DEFAULT_MOTIF_ID,
  MOTIFS,
  getMotif,
  listPickerMotifs,
  motifDataUri,
} from './motifs.js';
export type { MotifSet } from './motifs.js';

export {
  DEFAULT_TEXTURE_ID,
  TEXTURES,
  getTexture,
  listPickerTextures,
} from './textures.js';
export type { Texture } from './textures.js';

export {
  derivePalette,
  isValidBrandHex,
  ensureAccentContrast,
  contrastRatio,
} from './derive-palette.js';

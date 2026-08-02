export {
  BLOCK_REGISTRY,
  getBlockDef,
  isCorporateBlock,
  CORPORATE_BLOCK_KEYS,
} from './blocks/index.js';
export {
  albumBlock,
  agendaBlock,
  coverBlock,
  entryPassBlock,
  giftBlock,
  guestbookBlock,
  inviteBlock,
  partyBlock,
  practicalBlock,
  rsvpBlock,
  storyBlock,
} from './blocks/index.js';

export { DEMO_CONTENT } from './demo-content.js';
export {
  VERIFY_CONTENT,
  VERIFY_ENTRY_PASS,
  VERIFY_STRINGS,
  VERIFY_VIEWPORTS,
} from './verify-content.js';
export { InvitationRenderer } from './InvitationRenderer.js';
export {
  getTemplate,
  listTemplates,
  TEMPLATE_REGISTRY,
} from './registry.js';
export { resolveTheme } from './resolve-theme.js';
export { TemplateThumb } from './TemplateThumb.js';
export type { TemplateThumbProps } from './TemplateThumb.js';

export { DESIGN_FAMILIES, getFamily } from './families.js';
export type { DesignFamily } from './families.js';

export { EVENT_PRESETS } from './event-presets.js';
export type { EventPreset } from './event-presets.js';

export {
  DEFAULT_FONT_ID,
  FONTS,
  getFont,
  listPickerFonts,
} from './themes/fonts.js';
export type { FontPreset } from './themes/fonts.js';

export {
  DEFAULT_STYLE_ID,
  STYLES,
  getStyle,
  listPickerStyles,
  styleToCssVars,
} from './themes/styles.js';
export type { StyleTokens } from './themes/styles.js';

export {
  DEFAULT_MOTIF_ID,
  MOTIFS,
  getMotif,
  listPickerMotifs,
  motifDataUri,
} from './themes/motifs.js';
export type { MotifSet } from './themes/motifs.js';

export {
  DEFAULT_TEXTURE_ID,
  TEXTURES,
  getTexture,
  listPickerTextures,
} from './themes/textures.js';
export type { Texture } from './themes/textures.js';

export {
  DEFAULT_PALETTE_ID,
  getPalette,
  PALETTES,
  paletteToCssVars,
} from './themes/palettes.js';
export type { PaletteTokens } from './themes/palettes.js';

export {
  derivePalette,
  isValidBrandHex,
  ensureAccentContrast,
  contrastRatio,
} from './themes/derive-palette.js';

export { t as resolveBilingual } from './i18n/bilingual.js';
export { CORPORATE_STRINGS, corpStr } from './i18n/corporate-strings.js';
export type { CorpLang } from './i18n/corporate-strings.js';

export {
  parseDataTemplate,
  stripPersonalContent,
  isPartnerTemplateId,
  enabledBlockKeys,
} from './data-template.js';
export type { UnifiedTemplateMeta } from './data-template.js';

export { coverVariantOf } from './types.js';
export type {
  BlockDef,
  BlockRenderProps,
  GuestbookWish,
  InvitationInteractions,
  InvitationRendererProps,
  MediaResolver,
  ResolvedTheme,
  TemplateDefinition,
  TemplateMeta,
} from './types.js';

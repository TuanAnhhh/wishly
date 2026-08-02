import type { ThemeConfig } from '@wishly/contracts';

import {
  DEFAULT_FONT_ID,
  getFont,
} from './themes/fonts.js';
import { derivePalette, isValidBrandHex } from './themes/derive-palette.js';
import {
  DEFAULT_PALETTE_ID,
  getPalette,
  paletteToCssVars,
} from './themes/palettes.js';
import { DEFAULT_STYLE_ID, getStyle, styleToCssVars } from './themes/styles.js';
import type { ResolvedTheme } from './types.js';

export function resolveTheme(
  config: ThemeConfig,
  brandColor?: string | null
): ResolvedTheme {
  const font = getFont(config.fontId || DEFAULT_FONT_ID);
  const style = getStyle(config.styleId || DEFAULT_STYLE_ID);
  let brandAdjusted = false;
  const palette =
    brandColor && isValidBrandHex(brandColor)
      ? (() => {
          const derived = derivePalette(brandColor);
          brandAdjusted = derived.adjusted;
          return derived;
        })()
      : getPalette(config.paletteId || DEFAULT_PALETTE_ID);

  // Merge order matters: palette -> font -> style -> overrides. `overrides`
  // (dev-authored escape hatch) must win last; style vars must not clobber it.
  const vars = {
    ...paletteToCssVars(palette),
    '--inv-font-display': font.display,
    '--inv-font-body': font.body,
    ...styleToCssVars(style, palette.accent),
    ...(config.overrides ?? {}),
  };

  return {
    config,
    palette,
    font,
    style,
    cssVars: vars as ResolvedTheme['cssVars'],
    brandAdjusted,
  };
}

import type { Page } from 'playwright';
import { VERIFY_STRINGS } from '../../../libs/templates/src/index.js';

/**
 * Vietnamese diacritic coverage: the required stress strings must appear in
 * rendered text, and every hard glyph must be paintable by either the
 * display or body font actually applied (`document.fonts.check`, not just
 * "the font file exists").
 */
export async function collectGlyphErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  const bodyText = await page.locator('[data-invitation-renderer]').innerText();

  const requiredText = [
    VERIFY_STRINGS.nameLeft,
    VERIFY_STRINGS.nameRight,
    VERIFY_STRINGS.ceremony,
    VERIFY_STRINGS.place,
    VERIFY_STRINGS.body,
  ];
  for (const value of requiredText) {
    if (!bodyText.includes(value)) {
      errors.push(`missing stress string: ${value}`);
    }
  }
  for (const ch of VERIFY_STRINGS.hardGlyphs.normalize('NFC')) {
    if (!bodyText.includes(ch)) {
      errors.push(`missing glyph "${ch}" in rendered text`);
    }
  }

  const glyphReport = await page.evaluate((glyphs) => {
    const root = document.querySelector(
      '[data-invitation-renderer]'
    ) as HTMLElement | null;
    if (!root) return { ok: false, detail: 'renderer missing' };
    const display = getComputedStyle(root).getPropertyValue('--inv-font-display');
    const body = getComputedStyle(root).getPropertyValue('--inv-font-body');
    const missing: string[] = [];
    for (const ch of glyphs) {
      const okDisplay = document.fonts.check(`48px ${display}`, ch);
      const okBody = document.fonts.check(`24px ${body}`, ch);
      if (!okDisplay && !okBody) missing.push(ch);
    }
    return { ok: missing.length === 0, detail: missing.join('') };
  }, VERIFY_STRINGS.hardGlyphs);

  if (!glyphReport.ok) {
    errors.push(`font cannot render glyphs: ${glyphReport.detail}`);
  }

  return errors;
}

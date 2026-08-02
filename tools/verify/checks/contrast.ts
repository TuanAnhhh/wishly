import type { Page } from 'playwright';
import { contrastRatio } from '../../../libs/templates/src/index.js';

/**
 * 4 color pairs actually used for text/UI against `--inv-bg`, each with the
 * WCAG threshold matching how it's used (not a blanket 4.5 for everything —
 * see phase-05 plan §Implementation Steps #6):
 *   - ink/bg:      4.5:1 — body text, any size
 *   - inkMuted/bg: 4.5:1 — `SoftText` (15px, still "normal" text under WCAG's
 *                  18.66px/24px-bold cutoff for the 3:1 large-text exception)
 *   - inkSoft/bg:  4.5:1 — `Eyebrow`/`MediaSlot` label (12px) — well under the
 *                  large-text cutoff, so no relaxation is legitimate here
 *   - accent/bg:   3:1 — CTA/divider/decorative use only, never body text
 */
const PAIRS: Array<{ token: string; threshold: number; label: string }> = [
  { token: '--inv-ink', threshold: 4.5, label: 'ink/bg' },
  { token: '--inv-ink-muted', threshold: 4.5, label: 'inkMuted/bg' },
  { token: '--inv-ink-soft', threshold: 4.5, label: 'inkSoft/bg' },
  { token: '--inv-accent', threshold: 3.0, label: 'accent/bg' },
];

export async function collectContrastErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];

  const colors = await page.evaluate((tokens) => {
    const root = document.querySelector(
      '[data-invitation-renderer]'
    ) as HTMLElement | null;
    if (!root) return null;
    const style = getComputedStyle(root);
    const bg = style.getPropertyValue('--inv-bg').trim();
    const values: Record<string, string> = { bg };
    for (const token of tokens) {
      values[token] = style.getPropertyValue(token).trim();
    }
    return values;
  }, PAIRS.map((p) => p.token));

  if (!colors) {
    return ['could not read [data-invitation-renderer] for contrast check'];
  }

  for (const { token, threshold, label } of PAIRS) {
    const fg = colors[token];
    const bg = colors.bg;
    if (!fg?.startsWith('#') || !bg?.startsWith('#')) {
      errors.push(`could not read ${token} / --inv-bg hex for ${label} contrast check`);
      continue;
    }
    const ratio = contrastRatio(fg, bg);
    if (ratio < threshold) {
      errors.push(`${label} contrast ${ratio.toFixed(2)}:1 < ${threshold}:1 (${fg} on ${bg})`);
    }
  }

  return errors;
}

import type { Page } from 'playwright';

/** Horizontal scroll on the root document = a token/preset overflowed its viewport. */
export async function collectOverflowErrors(page: Page): Promise<string[]> {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > window.innerWidth + 2;
  });
  return overflow ? ['horizontal overflow'] : [];
}

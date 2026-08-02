// Spike for phase-08 wave-2 visual verification — screenshots each new/
// upgraded family's full render, sliced per-section like screenshot-thumb-
// zoom.mjs/screenshot-layoutmode.mjs precedent. Not wired into CI.
import { chromium } from 'playwright';

const BASE = process.env.VERIFY_BASE_URL ?? 'http://127.0.0.1:4201';
const VIEWPORT_W = 390;

const cases = [
  { slug: 'lua-cuoi', eventType: 'WEDDING', label: 'lua' },
  { slug: 'sen-truc-cuoi', eventType: 'WEDDING', label: 'sen-truc' },
  { slug: 'son-mai-cuoi', eventType: 'WEDDING', label: 'son-mai' },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: VIEWPORT_W, height: 1200 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.clock.setFixedTime(new Date('2026-10-01T00:00:00+07:00'));
  for (const c of cases) {
    const url = new URL('/_dev/templates/verify', BASE);
    url.searchParams.set('slug', c.slug);
    url.searchParams.set('eventType', c.eventType);
    await page.goto(url.toString(), { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForSelector('[data-verify-status="ready"]', { timeout: 30_000 });
    await page.waitForSelector('[data-invitation-renderer]', { timeout: 15_000 });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    const totalHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.setViewportSize({ width: VIEWPORT_W, height: Math.ceil(totalHeight) + 20 });

    const sliceH = 700;
    const safeTotal = Math.floor(totalHeight) - 2;
    let y = 0;
    let i = 0;
    while (y < safeTotal) {
      const h = Math.max(1, Math.min(sliceH, safeTotal - y));
      const out = `/tmp/p08-shots/${c.label}-${i}.png`;
      await page.screenshot({ path: out, clip: { x: 0, y, width: VIEWPORT_W, height: h } });
      y += sliceH;
      i += 1;
    }
    console.log(`[${c.label}] totalHeight=${totalHeight} saved ${i} slices`);
  }
  await page.close();
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

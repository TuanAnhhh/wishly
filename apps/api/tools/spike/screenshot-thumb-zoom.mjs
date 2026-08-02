import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1280, height: 1400 },
  deviceScaleFactor: 3,
});
await page.goto('http://localhost:4201/_dev/templates/thumbs', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

const cards = await page.locator('[data-template-thumb][data-variant="portrait"]').all();
for (let i = 0; i < cards.length; i++) {
  await cards[i].screenshot({ path: `artifacts/templates/p07-thumb-zoom-${i}.png` });
}
await browser.close();
console.log(`wrote ${cards.length} zoomed thumb screenshots`);

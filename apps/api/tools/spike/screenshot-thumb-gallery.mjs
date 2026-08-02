import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
await page.goto('http://localhost:4201/_dev/templates/thumbs', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
await page.screenshot({ path: 'artifacts/templates/p07-thumb-gallery.png', fullPage: true });
await browser.close();
console.log('wrote artifacts/templates/p07-thumb-gallery.png');

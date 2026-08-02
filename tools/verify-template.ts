/**
 * Render every template/preset/variant case from tools/verify/matrix.ts,
 * screenshot 390 / 768 / 1440, fail on missing glyphs / overflow / contrast.
 *
 * Usage:
 *   pnpm verify:templates
 *   pnpm verify:templates -- --slug=co-ngu
 *   pnpm verify:templates -- --fontId=newsreader-be    # only `font` kind cases for this fontId
 *   pnpm verify:templates -- --quick              # 1 viewport, template loop only (dev iteration)
 *   pnpm verify:templates -- --baseline            # snapshot this run's PNGs as the new baseline
 *   pnpm verify:templates -- --baseline=<dir>      # snapshot into a custom dir
 *   pnpm verify:templates -- --compare              # exit!=0 on PNG diff vs default baseline dir
 *   pnpm verify:templates -- --compare=<dir>        # ...vs a custom baseline dir
 *
 * Requires `nx serve studio` (dev mode) already running at VERIFY_BASE_URL —
 * the `/_dev/templates/verify` route is gated on `import.meta.env.DEV` and is
 * not present in a production build (see apps/studio/src/app/app.tsx).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium, type Page } from 'playwright';
import { VERIFY_VIEWPORTS } from '../libs/templates/src/index.js';
import { buildMatrix, type VerifyCase } from './verify/matrix.js';
import { collectGlyphErrors } from './verify/checks/glyphs.js';
import { collectContrastErrors } from './verify/checks/contrast.js';
import { collectOverflowErrors } from './verify/checks/overflow.js';
import {
  compareBaselineDirs,
  filterAllowlisted,
  snapshotBaseline,
} from './verify/checks/baseline.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const ARTIFACTS = path.join(ROOT, 'artifacts', 'templates');
const DEFAULT_BASELINE_DIR = path.join(ROOT, 'artifacts', 'templates-baseline');
const BASE_URL = process.env.VERIFY_BASE_URL ?? 'http://127.0.0.1:4201';

/**
 * Fixed instant strictly before every template's demo `eventAt`
 * (2026-11-15T18:00) so `Countdown`'s `Date.now()` never makes screenshots
 * non-deterministic between runs. Phase 03 flagged this and left it
 * unresolved (byte-diff was skipped that session); `--compare` here would be
 * useless without it, so Phase 05 owns fixing it. Playwright's `page.clock`
 * intercepts `Date`/timers inside the page — no app code change needed.
 */
const FROZEN_NOW = new Date('2026-10-01T00:00:00+07:00');

type CheckResult = {
  id: string;
  kind: VerifyCase['kind'];
  slug: string;
  viewport: number;
  ok: boolean;
  errors: string[];
  styleId?: string;
  variant?: string;
  fontId?: string;
};

function hasArg(name: string): boolean {
  return process.argv.some((a) => a === `--${name}` || a.startsWith(`--${name}=`));
}
function argValue(name: string): string | undefined {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg?.slice(`--${name}=`.length);
}

function buildUrl(c: VerifyCase): string {
  const url = new URL('/_dev/templates/verify', BASE_URL);
  url.searchParams.set('slug', c.slug);
  if (c.styleId) url.searchParams.set('styleId', c.styleId);
  if (c.variant) url.searchParams.set('variant', c.variant);
  if (c.fontId) url.searchParams.set('fontId', c.fontId);
  url.searchParams.set('eventType', c.eventType);
  return url.toString();
}

async function waitReady(page: Page) {
  await page.waitForSelector('[data-verify-status="ready"]', { timeout: 30_000 });
  await page.waitForSelector('[data-invitation-renderer]', { timeout: 15_000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

async function main() {
  const start = Date.now();
  const slugFilter = argValue('slug');
  const fontIdFilter = argValue('fontId');
  const quick = hasArg('quick');
  const baselineRequested = hasArg('baseline');
  const compareRequested = hasArg('compare');
  const baselineDir = argValue('baseline') ?? DEFAULT_BASELINE_DIR;
  const compareDir = argValue('compare') ?? DEFAULT_BASELINE_DIR;

  const { cases: allCases, skipped } = buildMatrix();
  for (const s of skipped) {
    console.log(`[skip] presetId="${s.presetId}" — ${s.reason}`);
  }

  let cases = allCases;
  if (slugFilter) cases = cases.filter((c) => c.slug === slugFilter);
  if (fontIdFilter) cases = cases.filter((c) => c.fontId === fontIdFilter);
  if (quick) {
    cases = cases.filter((c) => c.kind === 'template' && c.viewport === VERIFY_VIEWPORTS[0]);
  }

  if (cases.length === 0) {
    console.error('No verify cases to run (check --slug/--fontId filter / matrix.ts)');
    process.exit(1);
  }

  await mkdir(ARTIFACTS, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results: CheckResult[] = [];

  try {
    for (const c of cases) {
      const page = await browser.newPage({
        viewport: { width: c.viewport, height: 900 },
      });
      const errors: string[] = [];
      try {
        await page.clock.setFixedTime(FROZEN_NOW);
        await page.goto(buildUrl(c), { waitUntil: 'networkidle', timeout: 60_000 });
        await waitReady(page);
        errors.push(...(await collectGlyphErrors(page)));
        errors.push(...(await collectOverflowErrors(page)));
        errors.push(...(await collectContrastErrors(page)));
        const shotPath = path.join(ARTIFACTS, `${c.id}.png`);
        await page.screenshot({ path: shotPath, fullPage: true });
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
      }
      results.push({
        id: c.id,
        kind: c.kind,
        slug: c.slug,
        viewport: c.viewport,
        styleId: c.styleId,
        variant: c.variant,
        fontId: c.fontId,
        ok: errors.length === 0,
        errors,
      });
      await page.close();
      const mark = errors.length === 0 ? 'ok' : 'FAIL';
      console.log(`[${mark}] ${c.id}${errors.length ? ` — ${errors.join('; ')}` : ''}`);
    }
  } finally {
    await browser.close();
  }

  const reportPath = path.join(ARTIFACTS, 'report.json');
  await writeFile(reportPath, JSON.stringify(results, null, 2));
  const failed = results.filter((r) => !r.ok);
  const elapsedMs = Date.now() - start;
  console.log(
    `\n${results.length - failed.length}/${results.length} checks passed → ${reportPath} (${(elapsedMs / 1000).toFixed(1)}s)`
  );
  if (elapsedMs > 5 * 60_000) {
    console.log(
      'Run took >5min — use `--quick` (1 viewport, template loop only) for local dev iteration; full matrix is for CI.'
    );
  }

  let compareFailed = false;
  if (baselineRequested) {
    const n = await snapshotBaseline(ARTIFACTS, baselineDir);
    console.log(`Snapshotted ${n} PNGs → ${baselineDir}`);
  }
  if (compareRequested) {
    const diff = filterAllowlisted(await compareBaselineDirs(ARTIFACTS, compareDir));
    const diffCount = diff.changed.length + diff.onlyInCurrent.length + diff.onlyInBaseline.length;
    if (diffCount === 0) {
      console.log(`--compare: byte-identical to ${compareDir} (outside allowlist)`);
    } else {
      compareFailed = true;
      console.log(`--compare: ${diffCount} diff(s) vs ${compareDir}:`);
      for (const n of diff.changed) console.log(`  changed:        ${n}`);
      for (const n of diff.onlyInCurrent) console.log(`  only in current: ${n}`);
      for (const n of diff.onlyInBaseline) console.log(`  only in baseline: ${n}`);
    }
  }

  if (failed.length || compareFailed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

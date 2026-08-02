/** Ad-hoc: reproduce the EXACT production OgService.renderCoverPng() path with
 * realistic Vietnamese input. Originally written to confirm the font-subset
 * bug from font-subset-check.ts actually manifested in real OG output (it
 * did — see plans/260801-0658-template-design-families/reports/
 * spike-00-satori-findings.md §3); now doubles as a quick manual regression
 * check for the fix in og.service.ts (`loadFontFamily` / `withVnFallback`).
 * Not part of the committed Phase 00 deliverable. */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { OgService } from '../../src/og/og.service.js';

async function main() {
  const svc = new OgService();
  const png = await svc.renderCoverPng({
    nameLeft: 'Nguyễn Văn An',
    nameRight: 'Trần Thị Hoa',
    dateLine: '2026-11-15',
    placeLine: 'Trung tâm Hội nghị White Palace, TP.HCM',
  });
  const out = join(process.cwd(), 'artifacts', 'spike-satori');
  await mkdir(out, { recursive: true });
  await writeFile(join(out, 'prod_og_repro.png'), png);
  console.log('wrote prod_og_repro.png, bytes=', png.length);
}
main().catch((e) => { console.error(e); process.exit(1); });

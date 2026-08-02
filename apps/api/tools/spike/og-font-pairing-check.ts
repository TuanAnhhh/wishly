/** Phase 01 step 8: render 1 OG per NEW font pairing, for visual inspection —
 * satori path isn't covered by tools/verify-template.ts (that's FE/Playwright
 * only). Not part of the committed deliverable; ad-hoc verification aid. */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { OgService } from '../../src/og/og.service.js';

const PAIRINGS = [
  { id: 'dong-son', display: "'Newsreader', 'Times New Roman', serif", body: "'Be Vietnam Pro', system-ui, sans-serif" },
  { id: 'gach-bong', display: "'Bricolage Grotesque', system-ui, sans-serif", body: "'Be Vietnam Pro', system-ui, sans-serif" },
  { id: 'giay-do', display: "'EB Garamond', 'Times New Roman', serif", body: "'EB Garamond', 'Times New Roman', serif" },
];

async function main() {
  const svc = new OgService();
  const out = join(process.cwd(), 'artifacts', 'spike-satori');
  await mkdir(out, { recursive: true });
  for (const p of PAIRINGS) {
    const png = await svc.renderCoverPng({
      nameLeft: 'Nguyễn Văn An',
      nameRight: 'Trần Thị Hoa',
      dateLine: '2026-11-15',
      placeLine: 'Trung tâm Hội nghị White Palace, TP.HCM',
      fontDisplay: p.display,
      fontBody: p.body,
    });
    await writeFile(join(out, `og_font_${p.id}.png`), png);
    console.log(`wrote og_font_${p.id}.png, bytes=${png.length}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });

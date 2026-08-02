/** P02 manual fixture check (success criteria: texture+motif+arch on all
 * surfaces). OG side — not part of the committed deliverable. */
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
    textureDataUri:
      'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjZmZmZmZmIi8+PHBhdGggZD0iTTAsMCBMMzIsMzIgTTMyLDAgTDAsMzIiIHN0cm9rZT0iI2ZmMDAwMCIgc3Ryb2tlLXdpZHRoPSI0Ii8+PC9zdmc+',
    textureOpacity: 0.5,
    motifDividerDataUri:
      'data:image/svg+xml;base64,' +
      Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="#B04A3A" d="M50,8 C68,8 92,32 92,50 C92,68 68,92 50,92 C32,92 8,68 8,50 C8,32 32,8 50,8 Z M50,26 C40,26 26,40 26,50 C26,60 40,74 50,74 C60,74 74,60 74,50 C74,40 60,26 50,26 Z"/></svg>'
      ).toString('base64'),
    frameShape: 'arch',
  });
  const out = join(process.cwd(), 'artifacts', 'spike-satori');
  await mkdir(out, { recursive: true });
  await writeFile(join(out, 'p02_og_fixture.png'), png);
  console.log('wrote p02_og_fixture.png, bytes=', png.length);
}
main().catch((e) => { console.error(e); process.exit(1); });

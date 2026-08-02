/** Ad-hoc follow-up to satori-capability.ts: baseline render showed only Vietnamese
 * diacritic glyphs, no plain ASCII — checking whether @fontsource's "vietnamese"
 * subset excludes basic Latin (non-overlapping subset files is standard Google
 * Fonts practice). Not part of the committed Phase 00 deliverable; ad-hoc probe. */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const nodeRequire = createRequire(import.meta.url);
const OUT = join(process.cwd(), 'artifacts', 'spike-satori');

async function render(name: string, text: string, file: 'vietnamese' | 'latin' | 'both') {
  const pkgRoot = dirname(nodeRequire.resolve('@fontsource/be-vietnam-pro/package.json'));
  const fonts: { name: string; data: Buffer; weight: 400; style: 'normal' }[] = [];
  if (file === 'vietnamese' || file === 'both') {
    fonts.push({
      name: 'Be Vietnam Pro',
      data: await readFile(join(pkgRoot, 'files/be-vietnam-pro-vietnamese-400-normal.woff')),
      weight: 400,
      style: 'normal',
    });
  }
  if (file === 'latin' || file === 'both') {
    fonts.push({
      name: 'Be Vietnam Pro',
      data: await readFile(join(pkgRoot, 'files/be-vietnam-pro-latin-400-normal.woff')),
      weight: 400,
      style: 'normal',
    });
  }
  const tree = {
    type: 'div',
    props: {
      style: { width: '100%', height: '100%', display: 'flex', backgroundColor: '#FDFBF7', color: '#2E2620', fontFamily: 'Be Vietnam Pro', fontSize: 48 },
      children: text,
    },
  };
  const svg = await satori(tree as never, { width: 900, height: 150, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 900 } }).render().asPng();
  await mkdir(OUT, { recursive: true });
  await writeFile(join(OUT, `${name}.png`), Buffer.from(png));
  console.log(`${name}: wrote using ${file} subset, text="${text}"`);
}

async function renderFallbackStack(name: string, text: string) {
  const pkgRoot = dirname(nodeRequire.resolve('@fontsource/be-vietnam-pro/package.json'));
  const fonts = [
    {
      name: 'Be Vietnam Pro',
      data: await readFile(join(pkgRoot, 'files/be-vietnam-pro-latin-400-normal.woff')),
      weight: 400 as const,
      style: 'normal' as const,
    },
    {
      name: 'Be Vietnam Pro VN',
      data: await readFile(join(pkgRoot, 'files/be-vietnam-pro-vietnamese-400-normal.woff')),
      weight: 400 as const,
      style: 'normal' as const,
    },
  ];
  const tree = {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: '#FDFBF7',
        color: '#2E2620',
        fontFamily: 'Be Vietnam Pro, Be Vietnam Pro VN',
        fontSize: 48,
      },
      children: text,
    },
  };
  const svg = await satori(tree as never, { width: 900, height: 150, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 900 } }).render().asPng();
  await mkdir(OUT, { recursive: true });
  await writeFile(join(OUT, `${name}.png`), Buffer.from(png));
  console.log(`${name}: wrote using comma-separated fontFamily fallback stack, text="${text}"`);
}

async function main() {
  await render('subset_vi_ascii', 'ABC abc 0123 & Nguyen Tran', 'vietnamese');
  await render('subset_vi_diacritics', 'ễ à ầ ộ ữ', 'vietnamese');
  await render('subset_latin_ascii', 'ABC abc 0123 & Nguyen Tran', 'latin');
  await render('subset_both_mixed', 'Nguyễn Văn Ất & Trần Thị Đào — 15.11.2026', 'both');
  await renderFallbackStack('subset_fallback_stack', 'Nguyễn Văn Ất & Trần Thị Đào — 15.11.2026');
}
main().catch((e) => { console.error(e); process.exit(1); });

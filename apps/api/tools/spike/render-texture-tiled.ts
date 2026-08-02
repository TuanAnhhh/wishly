import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const nodeRequire = createRequire(import.meta.url);
const OUT = join(process.cwd(), 'artifacts', 'spike-satori');

const GACH_BONG_TILE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <path d="M16,2 L30,16 L16,30 L2,16 Z" fill="none" stroke="#8C6A3F" stroke-width="1.2"/>
  <circle cx="16" cy="16" r="2.2" fill="#8C6A3F"/>
</svg>`;
const DONG_SON_TILE_MEANDER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 16">
  <path d="M0,8 L6,8 L6,2 L12,2 L12,8 L18,8 L18,14 L24,14 L24,8 L32,8"
        fill="none" stroke="#8C6A3F" stroke-width="1.4"/>
</svg>`;
// Sparse small sun-star, spaced well apart — the star is the most
// recognizably Đông Sơn signal (vs. the meander reading as generic Greek-key).
const DONG_SON_TILE_STAR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <path fill="#8C6A3F" d="M40,24 L42.78,31.44 L49.4,27.06 L47.28,34.71 L55.22,35.06 L49,40 L55.22,44.94 L47.28,45.29 L49.4,52.94 L42.78,48.56 L40,56 L37.22,48.56 L30.6,52.94 L32.72,45.29 L24.78,44.94 L31,40 L24.78,35.06 L32.72,34.71 L30.6,27.06 L37.22,31.44 Z"/>
</svg>`;
const GIAY_DO_TILE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <g stroke="#8B7B6C" stroke-width="0.6" fill="none" opacity="0.5" stroke-linecap="round">
    <path d="M4,6 Q7,4 10,7"/><path d="M20,3 Q24,6 22,10"/><path d="M36,8 Q39,5 42,9"/>
    <path d="M8,20 Q12,17 15,21"/><path d="M28,18 Q31,22 35,19"/>
    <path d="M4,32 Q8,29 11,33"/><path d="M24,34 Q27,31 31,35"/><path d="M40,30 Q43,33 44,28"/>
    <path d="M14,42 Q18,39 21,43"/><path d="M34,44 Q38,41 42,45"/>
  </g>
</svg>`;

function toDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

async function loadFont() {
  const pkgRoot = dirname(nodeRequire.resolve('@fontsource/be-vietnam-pro/package.json'));
  const data = await readFile(join(pkgRoot, 'files/be-vietnam-pro-latin-400-normal.woff'));
  return [{ name: 'Be Vietnam Pro', data, weight: 400 as const, style: 'normal' as const }];
}

async function renderTiledPanels() {
  const fonts = await loadFont();
  const panels = [
    { label: 'Gach Bong (lattice)', svg: GACH_BONG_TILE, size: '32px 32px', bg: '#F2ECE0', opacity: 0.9 },
    { label: 'Dong Son (meander)', svg: DONG_SON_TILE_MEANDER, size: '48px 24px', bg: '#F5EBD6', opacity: 0.9 },
    { label: 'Dong Son (sparse star)', svg: DONG_SON_TILE_STAR, size: '90px 90px', bg: '#F5EBD6', opacity: 0.35 },
    { label: 'Giay Do (paper)', svg: GIAY_DO_TILE, size: '80px 80px', bg: '#FDFBF7', opacity: 1 },
  ];
  const tree = {
    type: 'div',
    props: {
      style: { width: '100%', height: '100%', display: 'flex', backgroundColor: '#fff' },
      children: panels.map((p) => ({
        type: 'div',
        props: {
          style: {
            width: '25%', height: '100%', display: 'flex', flexDirection: 'column',
            backgroundColor: p.bg, backgroundImage: `url(${toDataUri(p.svg)})`,
            backgroundRepeat: 'repeat', backgroundSize: p.size, opacity: p.opacity,
            alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 20,
            fontFamily: 'Be Vietnam Pro', fontSize: 16, color: '#2E2620',
          },
          children: p.label,
        },
      })),
    },
  };
  const svg = await satori(tree as never, { width: 1200, height: 500, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  await mkdir(OUT, { recursive: true });
  await writeFile(join(OUT, 'p04_textures_tiled.png'), Buffer.from(png));
  console.log('wrote p04_textures_tiled.png');
}
renderTiledPanels().catch((e) => { console.error(e); process.exit(1); });

// Constructs the 3 texture tile SVG sources, rasterizes each to PNG via
// resvg (matching the P00/P02 established pipeline), reports file size vs
// the 6KB/64x64 budget from P00's M2 metric.
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const OUT = join(process.cwd(), 'artifacts', 'spike-satori');

// Gạch Bông: diamond lattice with a small center dot — classic Đông Dương
// cement-tile geometry, subtle at background scale.
const GACH_BONG_TILE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <path d="M16,2 L30,16 L16,30 L2,16 Z" fill="none" stroke="#8C6A3F" stroke-width="1.2"/>
  <circle cx="16" cy="16" r="2.2" fill="#8C6A3F"/>
</svg>`;

// Đông Sơn: interlocking right-angle key/meander band — authentic Đông Sơn
// drum decorative-band vocabulary, reads as a thin repeating line at scale.
const DONG_SON_TILE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 16">
  <path d="M0,8 L6,8 L6,2 L12,2 L12,8 L18,8 L18,14 L24,14 L24,8 L32,8"
        fill="none" stroke="#8C6A3F" stroke-width="1.4"/>
</svg>`;

// Giấy Dó: paper fiber grain — a few short irregular strokes at low opacity,
// no motif (family is type-led by design, see P02/P04 plan).
const GIAY_DO_TILE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <g stroke="#8B7B6C" stroke-width="0.6" fill="none" opacity="0.5" stroke-linecap="round">
    <path d="M4,6 Q7,4 10,7"/>
    <path d="M20,3 Q24,6 22,10"/>
    <path d="M36,8 Q39,5 42,9"/>
    <path d="M8,20 Q12,17 15,21"/>
    <path d="M28,18 Q31,22 35,19"/>
    <path d="M4,32 Q8,29 11,33"/>
    <path d="M24,34 Q27,31 31,35"/>
    <path d="M40,30 Q43,33 44,28"/>
    <path d="M14,42 Q18,39 21,43"/>
    <path d="M34,44 Q38,41 42,45"/>
  </g>
</svg>`;

async function rasterize(name, svg, widthPx) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: widthPx } }).render().asPng();
  await mkdir(OUT, { recursive: true });
  await writeFile(join(OUT, `${name}.png`), Buffer.from(png));
  console.log(`${name}: ${png.length} bytes (PNG @ ${widthPx}px)`);
  return Buffer.from(png);
}

await rasterize('tex_gach_bong', GACH_BONG_TILE, 64);
await rasterize('tex_dong_son', DONG_SON_TILE, 64);
await rasterize('tex_giay_do', GIAY_DO_TILE, 96);

console.log('\nSVG source sizes (bytes):');
console.log('gach-bong:', Buffer.byteLength(GACH_BONG_TILE, 'utf8'));
console.log('dong-son:', Buffer.byteLength(DONG_SON_TILE, 'utf8'));
console.log('giay-do:', Buffer.byteLength(GIAY_DO_TILE, 'utf8'));

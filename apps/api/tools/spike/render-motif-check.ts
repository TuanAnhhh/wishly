import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const nodeRequire = createRequire(import.meta.url);
const OUT = join(process.cwd(), 'artifacts', 'spike-satori');

async function loadFont() {
  const pkgRoot = dirname(nodeRequire.resolve('@fontsource/be-vietnam-pro/package.json'));
  const data = await readFile(join(pkgRoot, 'files/be-vietnam-pro-latin-400-normal.woff'));
  return [{ name: 'Be Vietnam Pro', data, weight: 400 as const, style: 'normal' as const }];
}

function toDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

async function renderGrid(name: string, items: { label: string; svg: string; color: string }[]) {
  const fonts = await loadFont();
  const tree = {
    type: 'div',
    props: {
      style: { width: '100%', height: '100%', display: 'flex', flexWrap: 'wrap', backgroundColor: '#FDFBF7', padding: 20, fontFamily: 'Be Vietnam Pro' },
      children: items.map((item) => ({
        type: 'div',
        props: {
          style: { width: 200, height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', margin: 10 },
          children: [
            { type: 'img', props: { src: toDataUri(item.svg.replaceAll('__ACCENT__', item.color)), width: 150, height: 150 } },
            { type: 'div', props: { style: { fontSize: 14, marginTop: 8, color: '#2E2620' }, children: item.label } },
          ],
        },
      })),
    },
  };
  const svg = await satori(tree as never, { width: 900, height: 500, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 900 } }).render().asPng();
  await mkdir(OUT, { recursive: true });
  await writeFile(join(OUT, `${name}.png`), Buffer.from(png));
  console.log(`wrote ${name}.png`);
}

const svgWrap = (d: string, viewBox = '0 0 100 100') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"><path fill="__ACCENT__" d="${d}"/></svg>`;

const SUN_STAR_12PT =
  'M50,4 L57.76,21.02 L73,10.16 L71.21,28.79 L89.84,27 L78.98,42.24 L96,50 L78.98,57.76 L89.84,73 L71.21,71.21 L73,89.84 L57.76,78.98 L50,96 L42.24,78.98 L27,89.84 L28.79,71.21 L10.16,73 L21.02,57.76 L4,50 L21.02,42.24 L10.16,27 L28.79,28.79 L27,10.16 L42.24,21.02 Z';

const QUATREFOIL =
  'M50,50 Q38.2,32.75 50,12 Q61.8,32.75 50,50 Q67.25,38.2 88,50 Q67.25,61.8 50,50 Q61.8,67.25 50,88 Q38.2,67.25 50,50 Q32.75,61.8 12,50 Q32.75,38.2 50,50 Z';

const LAC_BIRD =
  'M8,52 C14,40 24,30 40,28 C48,27 52,24 58,16 C60,13 63,11 66,10 C63,14 61,18 61,22 C68,20 75,20 80,24 C74,26 68,29 64,34 C72,36 80,40 86,48 C78,46 70,45 63,47 C58,49 54,53 52,58 C58,58 64,60 68,64 C60,64 52,63 46,60 C40,66 32,70 22,72 C30,66 36,60 40,54 C30,54 18,54 8,52 Z';

const LAC_BIRD_V2 =
  'M6,58 C16,50 30,44 44,42 C56,40 66,32 76,14 C78,10 80,8 82,7 C80,12 77,18 74,24 C82,22 90,24 96,30 C88,30 80,32 74,36 C70,38 68,40 67,43 C74,44 82,47 88,54 C79,51 70,50 62,52 C57,53 54,55 52,58 C58,60 63,64 66,70 C60,66 54,63 50,60 C44,64 36,68 26,70 C32,64 38,60 42,56 C32,58 18,60 6,58 Z';

const CORNER_FRET =
  'M0,0 L0,6 L11,6 L11,17 L22,17 L22,6 L33,6 L33,17 L44,17 L44,6 L55,6 L55,17 L66,17 L66,6 L77,6 L77,17 L88,17 L88,6 L100,6 L100,0 Z';

renderGrid('p04_shapes_check', [
  { label: 'Dong Son star (accent)', svg: svgWrap(SUN_STAR_12PT), color: '#8C6A3F' },
  { label: 'Gach Bong quatrefoil', svg: svgWrap(QUATREFOIL), color: '#2E6B6B' },
  { label: 'Lac bird v2 (final)', svg: svgWrap(LAC_BIRD_V2, '0 0 100 80'), color: '#8C6A3F' },
  { label: 'Gach Bong corner fret', svg: svgWrap(CORNER_FRET, '0 0 100 20'), color: '#2E6B6B' },
]).catch((e) => { console.error(e); process.exit(1); });

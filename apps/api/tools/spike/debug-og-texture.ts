import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const nodeRequire = createRequire(import.meta.url);
const OUT = join(process.cwd(), 'artifacts', 'spike-satori');

const TEXTURE =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjZmZmZmZmIi8+PHBhdGggZD0iTTAsMCBMMzIsMzIgTTMyLDAgTDAsMzIiIHN0cm9rZT0iI2ZmMDAwMCIgc3Ryb2tlLXdpZHRoPSI0Ii8+PC9zdmc+';

async function loadFont() {
  const pkgRoot = dirname(nodeRequire.resolve('@fontsource/be-vietnam-pro/package.json'));
  const data = await readFile(join(pkgRoot, 'files/be-vietnam-pro-latin-400-normal.woff'));
  return [{ name: 'Be Vietnam Pro', data, weight: 400 as const, style: 'normal' as const }];
}

async function render(name: string, tree: unknown) {
  const fonts = await loadFont();
  const svg = await satori(tree as never, { width: 600, height: 300, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 600 } }).render().asPng();
  await mkdir(OUT, { recursive: true });
  await writeFile(join(OUT, `${name}.png`), Buffer.from(png));
  console.log(`wrote ${name}.png`);
}

async function main() {
  // A: absolute texture div as ONLY child of a simple (non-flex) div
  await render('dbg_a_simple_parent', {
    type: 'div',
    props: {
      style: { width: '100%', height: '100%', display: 'flex', position: 'relative', backgroundColor: '#fff' },
      children: [
        { type: 'div', props: { style: { position: 'absolute', inset: 0, backgroundImage: `url(${TEXTURE})`, backgroundRepeat: 'repeat' } } },
      ],
    },
  });

  // D: NOT absolutely positioned at all — plain in-flow full-size div (P00's Q2/Q3 shape)
  await render('dbg_d_no_position', {
    type: 'div',
    props: {
      style: { width: '100%', height: '100%', display: 'flex', backgroundColor: '#fff' },
      children: [
        { type: 'div', props: { style: { width: '100%', height: '100%', display: 'flex', backgroundImage: `url(${TEXTURE})`, backgroundRepeat: 'repeat' } } },
      ],
    },
  });

  // E: absolute with explicit top/left/right/bottom instead of `inset` shorthand
  await render('dbg_e_explicit_trbl', {
    type: 'div',
    props: {
      style: { width: '100%', height: '100%', display: 'flex', position: 'relative', backgroundColor: '#fff' },
      children: [
        { type: 'div', props: { style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `url(${TEXTURE})`, backgroundRepeat: 'repeat' } } },
      ],
    },
  });

  // F: absolute with explicit width/height (no inset/trbl at all)
  await render('dbg_f_explicit_size', {
    type: 'div',
    props: {
      style: { width: '100%', height: '100%', display: 'flex', position: 'relative', backgroundColor: '#fff' },
      children: [
        { type: 'div', props: { style: { position: 'absolute', width: 600, height: 300, backgroundImage: `url(${TEXTURE})`, backgroundRepeat: 'repeat' } } },
      ],
    },
  });

  // B: absolute texture div as FIRST child of a flex-row parent, alongside a normal flex sibling
  await render('dbg_b_flex_row_first_child', {
    type: 'div',
    props: {
      style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'row', position: 'relative', backgroundColor: '#fff' },
      children: [
        { type: 'div', props: { style: { position: 'absolute', inset: 0, backgroundImage: `url(${TEXTURE})`, backgroundRepeat: 'repeat' } } },
        { type: 'div', props: { style: { width: '50%', height: '100%', backgroundColor: 'rgba(0,150,0,0.5)', display: 'flex' }, children: 'sibling' } },
      ],
    },
  });

  // C: same as B but texture is LAST child instead of first
  await render('dbg_c_flex_row_last_child', {
    type: 'div',
    props: {
      style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'row', position: 'relative', backgroundColor: '#fff' },
      children: [
        { type: 'div', props: { style: { width: '50%', height: '100%', backgroundColor: 'rgba(0,150,0,0.5)', display: 'flex' }, children: 'sibling' } },
        { type: 'div', props: { style: { position: 'absolute', inset: 0, backgroundImage: `url(${TEXTURE})`, backgroundRepeat: 'repeat' } } },
      ],
    },
  });
}
main().catch((e) => { console.error(e); process.exit(1); });

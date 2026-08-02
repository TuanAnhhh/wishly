/**
 * Phase 00 spike (plans/260801-0658-template-design-families) — answers 5
 * capability questions about the satori→resvg OG pipeline before P02/P04
 * commit to a `StyleTokens` shape for texture/motif/frameShape.
 *
 * Placed under apps/api/ (not repo-root tools/) because satori + @resvg/resvg-js
 * are apps/api-only deps (pnpm workspace, no hoist to root node_modules) —
 * Node's resolution needs this file inside apps/api's directory tree to find
 * them. Not part of the Nest webpack bundle (entry is only ./src/main.ts).
 *
 * Usage: pnpm spike:satori
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, 'fixtures');
// apps/api/tools/spike -> repo root
const REPO_ROOT = join(HERE, '..', '..', '..', '..');
const OUT = join(REPO_ROOT, 'artifacts', 'spike-satori');

const nodeRequire = createRequire(import.meta.url);

const WIDTH = 1200;
const HEIGHT = 630;

type SatoriTree = Record<string, unknown>;

async function loadFont(): Promise<
  { name: string; data: Buffer; weight: 400; style: 'normal' }[]
> {
  const pkgRoot = dirname(
    nodeRequire.resolve('@fontsource/be-vietnam-pro/package.json')
  );
  const data = await readFile(
    join(pkgRoot, 'files/be-vietnam-pro-vietnamese-400-normal.woff')
  );
  return [{ name: 'Be Vietnam Pro', data, weight: 400, style: 'normal' }];
}

function toDataUri(svg: string, mime = 'image/svg+xml'): string {
  return `data:${mime};base64,${Buffer.from(svg).toString('base64')}`;
}

/** Contract with P04's `motifDataUri()`: exactly one placeholder token, no regex. */
function injectAccent(svg: string, hex: string): string {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) throw new Error(`Bad hex: ${hex}`);
  return svg.replaceAll('__ACCENT__', hex);
}

async function ensureTilePng(): Promise<Buffer> {
  const outFile = join(FIXTURES, 'tile-test.png');
  try {
    return await readFile(outFile);
  } catch {
    // fall through to generate
  }
  const svg = await readFile(join(FIXTURES, 'tile-source.svg'), 'utf8');
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 64 } });
  const png = Buffer.from(resvg.render().asPng());
  await writeFile(outFile, png);
  return png;
}

async function renderPng(
  name: string,
  tree: SatoriTree,
  fonts: Awaited<ReturnType<typeof loadFont>>
): Promise<{ ms: number; bytes: number }> {
  const t0 = performance.now();
  const svg = await satori(tree as never, { width: WIDTH, height: HEIGHT, fonts });
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } });
  const png = Buffer.from(resvg.render().asPng());
  const ms = performance.now() - t0;
  await writeFile(join(OUT, `${name}.png`), png);
  return { ms, bytes: png.length };
}

function frame(children: unknown[], bg = '#FDFBF7'): SatoriTree {
  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: bg,
        fontFamily: 'Be Vietnam Pro',
      },
      children,
    },
  };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const fonts = await loadFont();
  const results: Record<string, unknown> = {};

  // ---- Q1: SVG data-URI <img>, recolor via placeholder injection ----
  const motifRaw = await readFile(join(FIXTURES, 'motif-test.svg'), 'utf8');
  const motifRed = toDataUri(injectAccent(motifRaw, '#B04A3A'));
  const motifTeal = toDataUri(injectAccent(motifRaw, '#2E6B6B'));
  const q1 = frame([
    {
      type: 'div',
      props: {
        style: { width: '50%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
        children: [{ type: 'img', props: { src: motifRed, width: 140, height: 140 } }],
      },
    },
    {
      type: 'div',
      props: {
        style: { width: '50%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
        children: [{ type: 'img', props: { src: motifTeal, width: 140, height: 140 } }],
      },
    },
  ]);
  results['q1_svg_datauri_img'] = await renderPng('q1', q1, fonts);

  // ---- Q2: PNG tile, backgroundImage + repeat ----
  const tilePng = await ensureTilePng();
  const tileDataUriPng = `data:image/png;base64,${tilePng.toString('base64')}`;
  const q2 = frame([
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundImage: `url(${tileDataUriPng})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '64px 64px',
        },
      },
    },
  ]);
  results['q2_png_tile_repeat'] = await renderPng('q2', q2, fonts);

  // ---- Q3: SVG tile, backgroundImage + repeat ----
  const tileSvgRaw = await readFile(join(FIXTURES, 'tile-source.svg'), 'utf8');
  const tileDataUriSvg = toDataUri(tileSvgRaw);
  const q3 = frame([
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundImage: `url(${tileDataUriSvg})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '64px 64px',
        },
      },
    },
  ]);
  results['q3_svg_tile_repeat'] = await renderPng('q3', q3, fonts);

  // ---- Q4: frameShape — arch via borderRadius+overflow, octagon via clip-path (bonus) ----
  const photoFill = { backgroundColor: '#E8DFD2', width: '100%', height: '100%' };
  const q4 = frame(
    [
      // rect (baseline)
      {
        type: 'div',
        props: {
          style: { width: '30%', height: '80%', margin: 20, display: 'flex', overflow: 'hidden' },
          children: [{ type: 'div', props: { style: photoFill } }],
        },
      },
      // arch: flat bottom, rounded top — border-radius + overflow:hidden clip
      {
        type: 'div',
        props: {
          style: {
            width: '30%',
            height: '80%',
            margin: 20,
            display: 'flex',
            overflow: 'hidden',
            borderRadius: '9999px 9999px 0 0',
          },
          children: [{ type: 'div', props: { style: photoFill } }],
        },
      },
      // octagon (bonus, not in original scope): clip-path polygon — report honestly if unsupported
      {
        type: 'div',
        props: {
          style: {
            width: '30%',
            height: '80%',
            margin: 20,
            display: 'flex',
            overflow: 'hidden',
            clipPath:
              'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
          },
          children: [{ type: 'div', props: { style: photoFill } }],
        },
      },
    ],
    '#FAFAF7'
  );
  results['q4_frame_shape'] = await renderPng('q4', q4, fonts);

  // ---- Q5: scallop overlay via absolutely-positioned <img>, no mask ----
  const scallopRaw = await readFile(join(FIXTURES, 'scallop-overlay.svg'), 'utf8');
  const scallopUri = toDataUri(injectAccent(scallopRaw, '#FDFBF7'));
  const q5 = frame([
    {
      type: 'div',
      props: {
        style: { position: 'relative', width: '100%', height: '100%', display: 'flex', backgroundColor: '#E8DFD2' },
        children: [
          {
            type: 'img',
            props: {
              src: scallopUri,
              style: { position: 'absolute', top: 0, left: 0, width: '100%', height: 24 },
            },
          },
        ],
      },
    },
  ]);
  results['q5_scallop_overlay'] = await renderPng('q5', q5, fonts);

  // ---- M1-M3: render cost with increasing texture/motif load ----
  const ITER = 10;
  const baselineTree = frame([
    { type: 'div', props: { style: { fontSize: 52, color: '#2E2620' }, children: 'Nguyễn & Trần' } },
  ]);
  const textureTree = frame([
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundImage: `url(${tileDataUriPng})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '64px 64px',
        },
        children: [{ type: 'div', props: { style: { fontSize: 52, color: '#2E2620' }, children: 'Nguyễn & Trần' } }],
      },
    },
  ]);
  const textureMotifTree = frame([
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundImage: `url(${tileDataUriPng})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '64px 64px',
        },
        children: [
          { type: 'img', props: { src: motifRed, width: 60, height: 60 } },
          { type: 'img', props: { src: motifTeal, width: 60, height: 60 } },
          { type: 'img', props: { src: toDataUri(injectAccent(motifRaw, '#8C6A3F')), width: 60, height: 60 } },
          { type: 'div', props: { style: { fontSize: 52, color: '#2E2620' }, children: 'Nguyễn & Trần' } },
        ],
      },
    },
  ]);

  async function measure(label: string, tree: SatoriTree) {
    const times: number[] = [];
    for (let i = 0; i < ITER; i++) {
      const { ms } = await renderPng(`m_${label}_${i}`, tree, fonts);
      times.push(ms);
    }
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const rss = process.memoryUsage().rss;
    return { avgMs: Math.round(avg * 10) / 10, minMs: Math.round(Math.min(...times)), maxMs: Math.round(Math.max(...times)), rssMB: Math.round(rss / 1024 / 1024) };
  }

  results['m1_baseline'] = await measure('baseline', baselineTree);
  results['m1_texture'] = await measure('texture', textureTree);
  results['m1_texture_3motif'] = await measure('texture_3motif', textureMotifTree);

  results['m2_payload_bytes'] = {
    motifSvgRaw: Buffer.byteLength(motifRaw, 'utf8'),
    motifSvgDataUri: motifRed.length,
    tilePngRaw: tilePng.length,
    tilePngDataUri: tileDataUriPng.length,
    tileSvgRaw: Buffer.byteLength(tileSvgRaw, 'utf8'),
    tileSvgDataUri: tileDataUriSvg.length,
  };

  await writeFile(join(OUT, 'metrics.json'), JSON.stringify(results, null, 2));
  console.log(`Done. PNGs + metrics.json in ${OUT}`);
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { PNG } from '../../../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/png.js';
import { readFileSync } from 'node:fs';

function load(path) {
  return PNG.sync.read(readFileSync(path));
}

function pixelDiffPercent(a, b, threshold = 8) {
  const n = Math.min(a.data.length, b.data.length);
  let diff = 0;
  let total = 0;
  for (let i = 0; i < n; i += 4) {
    total++;
    const dr = Math.abs(a.data[i] - b.data[i]);
    const dg = Math.abs(a.data[i + 1] - b.data[i + 1]);
    const db = Math.abs(a.data[i + 2] - b.data[i + 2]);
    if (dr > threshold || dg > threshold || db > threshold) diff++;
  }
  return (diff / total) * 100;
}

const base = 'artifacts/templates';
const files = {
  'gach-bong': `${base}/p05-check/gach-bong-cuoi-og.png`,
  'dong-son': `${base}/p05-check/dong-son-cuoi-og.png`,
  'giay-do': `${base}/p05-check/giay-do-cuoi-og.png`,
  lua: `${base}/p08-check/lua-cuoi-og.png`,
  'sen-truc': `${base}/p08-check/sen-truc-cuoi-og.png`,
  'son-mai': `${base}/p08-check/son-mai-cuoi-og.png`,
};

const imgs = Object.fromEntries(Object.entries(files).map(([k, v]) => [k, load(v)]));
const names = Object.keys(imgs);
let worst = Infinity;
let worstPair = null;
for (let i = 0; i < names.length; i++) {
  for (let j = i + 1; j < names.length; j++) {
    const a = names[i];
    const b = names[j];
    const pct = pixelDiffPercent(imgs[a], imgs[b]);
    const pass = pct > 40;
    console.log(`${pass ? 'OK ' : 'FAIL'} ${a} vs ${b}: ${pct.toFixed(1)}%`);
    if (pct < worst) {
      worst = pct;
      worstPair = `${a} vs ${b}`;
    }
  }
}
console.log(`\nworst pair: ${worstPair} = ${worst.toFixed(1)}%`);

// One-off generator for P08 wave-2 motif art — same parametric approach as
// gen-motif-paths.mjs (P04), not committed as a build tool. Output pasted
// into motifs.ts once verified via screenshot.

function fmt(n) {
  return Math.round(n * 100) / 100;
}

// N-petal flower, quadratic-bezier lens petals meeting at center, closed
// path — generalizes gen-motif-paths.mjs's `quatrefoil` (which hardcoded 4
// petals) to any petal count/radius/spread, for son-mai's 8-petal medallion.
function nPetalFlower(cx, cy, petals, r, spreadRad = 0.6) {
  const petal = (angleRad) => {
    const tipX = cx + r * Math.cos(angleRad);
    const tipY = cy + r * Math.sin(angleRad);
    const cAx = cx + r * 0.55 * Math.cos(angleRad - spreadRad);
    const cAy = cy + r * 0.55 * Math.sin(angleRad - spreadRad);
    const cBx = cx + r * 0.55 * Math.cos(angleRad + spreadRad);
    const cBy = cy + r * 0.55 * Math.sin(angleRad + spreadRad);
    return { tipX, tipY, cAx, cAy, cBx, cBy };
  };
  let d = `M${fmt(cx)},${fmt(cy)} `;
  for (let i = 0; i < petals; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / petals;
    const p = petal(a);
    d += `Q${fmt(p.cAx)},${fmt(p.cAy)} ${fmt(p.tipX)},${fmt(p.tipY)} Q${fmt(p.cBx)},${fmt(p.cBy)} ${fmt(cx)},${fmt(cy)} `;
  }
  return d.trim() + ' Z';
}

console.log('=== Sơn Mài carved medallion (8-petal, tighter spread = more angular/"chạm khắc" than gạch-bông\'s round 4-petal), viewBox 0 0 100 100 ===');
console.log(nPetalFlower(50, 50, 8, 36, 0.32));

// Lotus bloom, 3 asymmetric petals fanning upward (not full 360°) — center
// petal tall/narrow, 2 side petals shorter/wider, angled outward. Same
// quadratic-lens petal technique, per-petal radius/spread instead of a
// uniform N-gon.
function lotusPetal(cx, cy, angleRad, r, spreadRad) {
  const tipX = cx + r * Math.cos(angleRad);
  const tipY = cy + r * Math.sin(angleRad);
  const cAx = cx + r * 0.6 * Math.cos(angleRad - spreadRad);
  const cAy = cy + r * 0.6 * Math.sin(angleRad - spreadRad);
  const cBx = cx + r * 0.6 * Math.cos(angleRad + spreadRad);
  const cBy = cy + r * 0.6 * Math.sin(angleRad + spreadRad);
  return `Q${fmt(cAx)},${fmt(cAy)} ${fmt(tipX)},${fmt(tipY)} Q${fmt(cBx)},${fmt(cBy)} ${fmt(cx)},${fmt(cy)} `;
}
function lotus(cx, cy) {
  const deg = (d) => (d * Math.PI) / 180;
  let d = `M${fmt(cx)},${fmt(cy)} `;
  d += lotusPetal(cx, cy, deg(-90), 32, 0.22); // center, tall/narrow
  d += lotusPetal(cx, cy, deg(-140), 24, 0.3); // left side
  d += lotusPetal(cx, cy, deg(-40), 24, 0.3); // right side
  return d.trim() + ' Z';
}
console.log('\n=== Sen & Trúc lotus bloom (3-petal fan, filled silhouette variant), viewBox 0 0 100 100 ===');
console.log(lotus(50, 62));

// One-off generator: computes precise SVG path `d` strings for P04 motif art
// via parametric math (stars, diamond lattices, meander bands) rather than
// hand-guessed coordinates. Not committed as a build tool — output gets
// pasted into motifs.ts/textures.ts once verified.

function fmt(n) {
  return Math.round(n * 100) / 100;
}

// n-pointed star, single closed path, alternating outer/inner radius.
function star(cx, cy, points, outerR, innerR, rotationDeg = -90) {
  const step = Math.PI / points;
  const rot = (rotationDeg * Math.PI) / 180;
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = rot + i * step;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    d += (i === 0 ? 'M' : 'L') + fmt(x) + ',' + fmt(y) + ' ';
  }
  return d.trim() + ' Z';
}

// Quatrefoil: 4 overlapping circles (as arcs) forming a 4-lobed flower, via
// a single path using arc commands, centered at cx,cy, lobe radius r,
// offset from center o (o < r for overlap).
function quatrefoil(cx, cy, r, o) {
  const pts = [
    [cx, cy - o - r], // top lobe center approximated via arcs below
  ];
  // Simpler robust construction: 4 circles unioned isn't a single path
  // without boolean ops. Use a classic 4-petal "flower" outline instead:
  // 4 quadratic-bezier petals meeting at center, closed path.
  const petal = (angleDeg) => {
    const a = (angleDeg * Math.PI) / 180;
    const tipX = cx + r * Math.cos(a);
    const tipY = cy + r * Math.sin(a);
    const cAx = cx + r * 0.55 * Math.cos(a - 0.6);
    const cAy = cy + r * 0.55 * Math.sin(a - 0.6);
    const cBx = cx + r * 0.55 * Math.cos(a + 0.6);
    const cBy = cy + r * 0.55 * Math.sin(a + 0.6);
    return { tipX, tipY, cAx, cAy, cBx, cBy };
  };
  const angles = [-90, 0, 90, 180];
  let d = `M${fmt(cx)},${fmt(cy)} `;
  for (const ang of angles) {
    const p = petal(ang);
    d += `Q${fmt(p.cAx)},${fmt(p.cAy)} ${fmt(p.tipX)},${fmt(p.tipY)} Q${fmt(p.cBx)},${fmt(p.cBy)} ${fmt(cx)},${fmt(cy)} `;
  }
  return d.trim() + ' Z';
}

console.log('=== Đông Sơn sun-star (dividerGlyph), viewBox 0 0 100 100 ===');
console.log(star(50, 50, 12, 46, 30));

console.log('\n=== Đông Sơn sun-star, smaller inner (more spiky), for texture unit ===');
console.log(star(16, 16, 8, 14, 6));

console.log('\n=== Gạch Bông quatrefoil (dividerGlyph), viewBox 0 0 100 100 ===');
console.log(quatrefoil(50, 50, 38, 0));

// Chim Lạc silhouette — flowing S-curve: long forward beak/neck, rounded
// body, sweeping trailing legs/tail (classic Đông Sơn drum bird band pose).
// Hand-tuned bezier, iterate by render+inspect, not computed from formula.
function lacBird() {
  return [
    'M8,52',
    'C14,40 24,30 40,28',
    'C48,27 52,24 58,16',
    'C60,13 63,11 66,10',
    'C63,14 61,18 61,22',
    'C68,20 75,20 80,24',
    'C74,26 68,29 64,34',
    'C72,36 80,40 86,48',
    'C78,46 70,45 63,47',
    'C58,49 54,53 52,58',
    'C58,58 64,60 68,64',
    'C60,64 52,63 46,60',
    'C40,66 32,70 22,72',
    'C30,66 36,60 40,54',
    'C30,54 18,54 8,52',
    'Z',
  ].join(' ');
}
console.log('\n=== Lạc bird silhouette, viewBox 0 0 100 80 ===');
console.log(lacBird());

// v2: thinner ribbon-stroke style, more elongated (long beak forward-down,
// arched neck, separated trailing leg strokes) matching the actual engraved
// Đông Sơn linear style rather than a solid blob.
function lacBirdV2() {
  return [
    // Body/neck/beak as one thin ribbon (outward path then back, ~6-8 wide)
    'M6,58',
    'C16,50 30,44 44,42',
    'C56,40 66,32 76,14',
    'C78,10 80,8 82,7',
    'C80,12 77,18 74,24',
    'C82,22 90,24 96,30',
    'C88,30 80,32 74,36',
    'C70,38 68,40 67,43',
    'C74,44 82,47 88,54',
    'C79,51 70,50 62,52',
    'C57,53 54,55 52,58',
    // trailing tail feathers, separated strokes
    'C58,60 63,64 66,70',
    'C60,66 54,63 50,60',
    'C44,64 36,68 26,70',
    'C32,64 38,60 42,56',
    'C32,58 18,60 6,58',
    'Z',
  ].join(' ');
}
console.log('\n=== Lạc bird v2, viewBox 0 0 100 80 ===');
console.log(lacBirdV2());

// Gạch Bông corner fret — classic stepped-key corner border (rectilinear,
// computable), single path via a zig-zag step outline.
function cornerFret(size, stepCount, stepSize, thickness) {
  let d = `M0,0 `;
  let x = 0, y = thickness;
  d += `L0,${thickness} `;
  for (let i = 0; i < stepCount; i++) {
    x = i * stepSize * 2 + stepSize;
    d += `L${x},${thickness} L${x},${stepSize + thickness} L${x + stepSize},${stepSize + thickness} L${x + stepSize},${thickness} `;
  }
  d += `L${size},${thickness} L${size},0 Z`;
  return d;
}
console.log('\n=== Gach Bong corner fret, viewBox 0 0 100 20 ===');
console.log(cornerFret(100, 4, 11, 6));

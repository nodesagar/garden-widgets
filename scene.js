// Painted storybook countryside scene, one look per season.
const PALETTES = {
  spring: { sky: ['#bfe0ef', '#eef6e6'], hills: ['#b3d58f', '#95c265', '#bcd96f'], tree: '#6f9f4c', bloom: '#f3b3c1', flower: '#f6d34a', path: '#f4ecd2' },
  summer: { sky: ['#86c8ea', '#dff2f6'], hills: ['#86bd5f', '#63a043', '#a2cf55'], tree: '#4f8a3a', bloom: null, flower: '#fbe36a', path: '#f6eed4' },
  autumn: { sky: ['#a8d2e4', '#f7e4ba'], hills: ['#dcae4f', '#c98b30', '#e6be5a'], tree: '#d9692c', bloom: '#e89b2f', flower: '#c4452a', path: '#f3e3c0' },
  winter: { sky: ['#c3d4e8', '#f1f4f8'], hills: ['#e3eaf2', '#d6e0ec', '#f7f9fc'], tree: '#3f6b57', bloom: null, flower: null, path: '#e9eef5' },
};

const SEASON_OF_MONTH = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'];

function rng(seed) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

function sheep(x, y, s) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="6" rx="9" ry="2.2" fill="#000" opacity=".12"/>
    <ellipse cx="0" cy="0" rx="8" ry="5.5" fill="#fbfaf4"/>
    <circle cx="-4" cy="-3" r="3.2" fill="#fbfaf4"/><circle cx="3" cy="-3.5" r="3.4" fill="#fbfaf4"/>
    <ellipse cx="8.5" cy="0.5" rx="2.8" ry="2.2" fill="#3a3530"/>
    <rect x="-5" y="4" width="1.4" height="3" fill="#3a3530"/><rect x="3" y="4" width="1.4" height="3" fill="#3a3530"/>
  </g>`;
}

function roundTree(x, y, s, p, r) {
  let dots = '';
  if (p.bloom) for (let i = 0; i < 9; i++) dots += `<circle cx="${x + (r() - 0.5) * 22 * s}" cy="${y - 22 * s + (r() - 0.5) * 22 * s}" r="${1.8 * s}" fill="${p.bloom}"/>`;
  return `<rect x="${x - 1.5 * s}" y="${y - 10 * s}" width="${3 * s}" height="${12 * s}" fill="#7a5436"/>
    <ellipse cx="${x}" cy="${y - 22 * s}" rx="${12 * s}" ry="${16 * s}" fill="${p.tree}"/>
    <ellipse cx="${x - 3 * s}" cy="${y - 26 * s}" rx="${5 * s}" ry="${7 * s}" fill="#fff" opacity=".12"/>${dots}`;
}

function pine(x, y, s) {
  return `<rect x="${x - 1.5 * s}" y="${y - 6 * s}" width="${3 * s}" height="${8 * s}" fill="#6b4a33"/>
    <path d="M${x} ${y - 40 * s} L${x + 12 * s} ${y - 6 * s} L${x - 12 * s} ${y - 6 * s}Z" fill="#3f6b57"/>
    <path d="M${x} ${y - 40 * s} L${x + 6 * s} ${y - 26 * s} Q${x} ${y - 23 * s} ${x - 6 * s} ${y - 26 * s}Z" fill="#fff"/>
    <path d="M${x - 11 * s} ${y - 8 * s} Q${x} ${y - 13 * s} ${x + 11 * s} ${y - 8 * s}" stroke="#fff" stroke-width="${2.5 * s}" fill="none"/>`;
}

function cottage(x, y, s, winter) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M26 -58 q6 -10 0 -18 q-6 -8 2 -16 M31 -58 q6 -10 0 -18 q-6 -8 2 -16" stroke="#fff" stroke-width="1.6" fill="none" opacity=".85"/>
    <rect x="-30" y="-30" width="60" height="30" fill="#f1e2b5"/>
    <rect x="-30" y="-30" width="22" height="30" fill="#e6cf8e"/>
    <path d="M-36 -28 L-12 -54 L36 -54 L40 -28Z" fill="${winter ? '#f7f9fc' : '#9a5a3c'}"/>
    <path d="M-36 -28 L-12 -54 L12 -28Z" fill="${winter ? '#e3eaf2' : '#7d4630'}"/>
    <rect x="22" y="-62" width="7" height="12" fill="#8a5a42"/>
    <rect x="-24" y="-20" width="6" height="8" fill="#6b4a33"/><rect x="-2" y="-22" width="7" height="8" fill="#fbe6a2"/><rect x="14" y="-22" width="7" height="8" fill="#fbe6a2"/>
    <path d="M3 0 v-12 a4 4 0 0 1 8 0 v12Z" fill="#5a3b28"/>
  </g>`;
}

// Short semi-transparent dabs that read as gouache brush strokes.
function dabs(n, r, x0, x1, y0, y1, colors, len, width) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), a = (r() - 0.5) * 0.6, l = len * (0.6 + r() * 0.8);
    out += `<path d="M${x} ${y} l${Math.cos(a) * l} ${Math.sin(a) * l}" stroke="${colors[i % colors.length]}" stroke-width="${width * (0.7 + r() * 0.6)}" stroke-linecap="round" opacity="${0.25 + r() * 0.3}"/>`;
  }
  return out;
}

function scene(season, { w = 400, h = 230, seed = 7, id = 's', gouache = false } = {}) {
  const p = PALETTES[season], r = rng(seed), k = w / 400;
  const Y = (v) => v * (h / 230);
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky[0]}"/><stop offset="1" stop-color="${p.sky[1]}"/></linearGradient>
    <filter id="${id}paint"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="${seed}"/><feDisplacementMap in="SourceGraphic" scale="${5 * k}"/></filter>
    <filter id="${id}grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .28  0 0 0 0 .2  0 0 0 .22 0"/></filter>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#${id}sky)"/>`;
  if (gouache) out = out.replace('</defs>', `<filter id="${id}wob"><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="${seed}"/><feDisplacementMap in="SourceGraphic" scale="${3 * k}"/></filter></defs>`) + `<g filter="url(#${id}wob)">` + dabs(90, r, 0, w, 0, Y(120), ['#ffffff', p.sky[0], p.sky[1]], 16 * k, 5 * k);
  if (season === 'summer') out += `<circle cx="${w * 0.82}" cy="${Y(42)}" r="${18 * k}" fill="#ffe07a" opacity=".95"/><circle cx="${w * 0.82}" cy="${Y(42)}" r="${28 * k}" fill="#ffe07a" opacity=".25"/>`;
  // wavy painted clouds, like brush strokes
  for (let i = 0; i < 4; i++) {
    const cy = Y(18 + i * 9), x0 = w * (0.3 + r() * 0.2);
    out += `<path d="M${x0} ${cy} q${20 * k} -8 ${40 * k} 0 t${40 * k} 0 t${40 * k} 0 t${40 * k} 0" stroke="#fff" stroke-width="${1.6 * k}" fill="none" opacity="${0.5 + r() * 0.3}"/>`;
  }
  out += `<g filter="url(#${id}paint)">
    <path d="M-30 ${Y(120)} Q${w * 0.25} ${Y(80)} ${w * 0.5} ${Y(105)} T${w + 30} ${Y(90)} V${h + 30} H-30Z" fill="${p.hills[0]}"/>
    <path d="M-30 ${Y(140)} Q${w * 0.35} ${Y(105)} ${w * 0.7} ${Y(130)} T${w + 30} ${Y(118)} V${h + 30} H-30Z" fill="${p.hills[1]}"/>`;
  // fence along the middle hill
  for (let x = w * 0.28; x < w; x += 9 * k) {
    const fy = Y(130) - Math.sin((x / w) * Math.PI) * Y(12);
    out += `<rect x="${x}" y="${fy - 7 * k}" width="${1.3 * k}" height="${8 * k}" fill="#5a4332" opacity=".75"/>`;
  }
  out += `<path d="M${w * 0.28} ${Y(124)} C${w * 0.5} ${Y(112)} ${w * 0.75} ${Y(114)} ${w} ${Y(122)}" stroke="#5a4332" stroke-width="${1 * k}" fill="none" opacity=".6"/>
    <path d="M-30 ${Y(170)} Q${w * 0.3} ${Y(135)} ${w * 0.6} ${Y(155)} T${w + 30} ${Y(145)} V${h + 30} H-30Z" fill="${p.hills[2]}"/>
  </g>`;
  if (gouache) out += dabs(160, r, 0, w, Y(95), h, [p.hills[0], p.hills[1], p.hills[2], '#ffffff'], 12 * k, 3.5 * k);
  // brush texture on front hill
  for (let i = 0; i < 40; i++) {
    const x = r() * w, y = Y(165 + r() * 60);
    out += `<path d="M${x} ${y} q${3 * k} -${5 * k} ${6 * k} 0" stroke="#000" stroke-width="${0.8 * k}" fill="none" opacity=".08"/>`;
  }
  out += cottage(w * 0.2, Y(118), 0.62 * k, season === 'winter');
  if (season === 'winter') {
    [[0.08, 128, 0.9], [0.36, 122, 0.7], [0.88, 150, 1.1], [0.94, 146, 0.8]].forEach(([x, y, s]) => (out += pine(w * x, Y(y), s * k)));
  } else {
    [[0.06, 122, 0.8], [0.34, 116, 0.7], [0.39, 118, 0.55], [0.92, 150, 1]].forEach(([x, y, s]) => (out += roundTree(w * x, Y(y), s * k, p, r)));
  }
  // winding path
  out += `<path d="M${w * 0.26} ${Y(120)} C${w * 0.5} ${Y(140)} ${w * 0.2} ${Y(170)} ${w * 0.45} ${Y(190)} S${w * 0.4} ${Y(220)} ${w * 0.55} ${h + 5}" stroke="${p.path}" stroke-width="${6 * k}" fill="none" stroke-linecap="round" filter="url(#${id}paint)"/>`;
  if (season !== 'winter') {
    for (let i = 0; i < 7; i++) out += sheep(w * (0.55 + r() * 0.4), Y(150 + r() * 60), (0.6 + r() * 0.4) * k);
    for (let i = 0; i < 26; i++) out += `<circle cx="${r() * w}" cy="${Y(175 + r() * 55)}" r="${1.5 * k}" fill="${p.flower}"/>`;
  } else {
    out += `<g transform="translate(${w * 0.68} ${Y(188)}) scale(${k})"><circle r="11" fill="#fff"/><circle cy="-15" r="8" fill="#fff"/><path d="M-6 -22 h12 l-6 -10Z" fill="#c9443a"/><path d="M0 -15 l7 2 l-7 1Z" fill="#e8893a"/></g>`;
    out += `<g class="snow">`;
    for (let i = 0; i < 40; i++) out += `<circle cx="${r() * w}" cy="${r() * h}" r="${(0.8 + r() * 1.4) * k}" fill="#fff" opacity=".9"><animate attributeName="cy" from="${-10}" to="${h + 10}" dur="${6 + r() * 6}s" begin="-${r() * 10}s" repeatCount="indefinite"/></circle>`;
    out += `</g>`;
  }
  if (season === 'autumn') for (let i = 0; i < 10; i++) out += `<ellipse cx="${r() * w}" cy="${Y(150 + r() * 70)}" rx="${2.2 * k}" ry="${1.2 * k}" fill="${i % 2 ? '#d9692c' : '#e8a93a'}"/>`;
  if (gouache) out += '</g>';
  out += `<rect width="${w}" height="${h}" filter="url(#${id}grain)"/></svg>`;
  return out;
}

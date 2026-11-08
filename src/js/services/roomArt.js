/**
 * Procedural room illustrations.
 *
 * Produces original, stylised SVG interiors from a design record and its style
 * palette. Used at build time (scripts/generate-art.mjs) so the catalogue ships
 * with real image files and no third-party photography or licensing questions.
 * These are illustrations, never presented as photographs of real projects.
 */

const W = 1200;
const H = 900;

/* ---------- small helpers ---------- */
export function rng(seedStr) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function shade(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  const f = (c) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  return `#${[f(r), f(g), f(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}
const f1 = (n) => Math.round(n * 10) / 10;
const pts = (arr) => arr.map(([x, y]) => `${f1(x)},${f1(y)}`).join(' ');
const R = (x, y, w, h, fill, extra = '') =>
  `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" fill="${fill}" ${extra}/>`;
const P = (arr, fill, extra = '') => `<polygon points="${pts(arr)}" fill="${fill}" ${extra}/>`;
const E = (cx, cy, rx, ry, fill, extra = '') =>
  `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${fill}" ${extra}/>`;
const L = (x1, y1, x2, y2, stroke, w = 2, extra = '') =>
  `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${stroke}" stroke-width="${w}" ${extra}/>`;
const shadow = (cx, cy, w) => E(cx, cy, w / 2, w / 14, 'rgba(40,28,18,0.28)', 'filter="url(#soft)"');

/* ---------- palettes ---------- */
const DEFAULT_PALETTE = {
  wall: '#efe6d8', wall2: '#c98f6b', floor: '#d9c8ad', wood: '#9a6b45', fabric: '#e7dccb',
  accent: '#b4643f', metal: '#b8925a', light: '#fff4df',
};

/* ---------- room geometry ---------- */
function geometry(view) {
  if (view === 'corner') return { x0: 120, y0: 150, x1: 800, y1: 600, vpx: 460 };
  return { x0: 230, y0: 150, x1: 970, y1: 595, vpx: 600 };
}

function shell(p, g, opts) {
  const { x0, y0, x1, y1 } = g;
  let s = '';
  // ceiling
  s += P([[0, 0], [W, 0], [x1, y0], [x0, y0]], 'url(#ceil)');
  // side walls
  s += P([[0, 0], [x0, y0], [x0, y1], [0, H]], 'url(#wallL)');
  s += P([[W, 0], [W, H], [x1, y1], [x1, y0]], 'url(#wallR)');
  // back wall
  s += R(x0, y0, x1 - x0, y1 - y0, 'url(#wallB)');
  // floor
  s += P([[x0, y1], [x1, y1], [W, H], [0, H]], 'url(#floor)');
  s += `<clipPath id="floorClip"><polygon points="${pts([[x0, y1], [x1, y1], [W, H], [0, H]])}"/></clipPath>`;
  s += `<g clip-path="url(#floorClip)">${floorPattern(p, g, opts)}</g>`;
  // skirting
  s += R(x0, y1 - 8, x1 - x0, 8, shade(p.wall, -0.12));
  // ceiling details
  if (p.ceiling === 'slats') {
    for (let i = 1; i < 14; i++) {
      const t = i / 14;
      const xa = x0 + (x1 - x0) * t;
      const xb = W * t;
      s += L(xa, y0, xb, 0, shade(p.wood, -0.1), 5, 'opacity="0.55"');
    }
  } else if (opts.cove) {
    s += P([[x0 + 30, y0 + 14], [x1 - 30, y0 + 14], [x1 - 60, y0 + 30], [x0 + 60, y0 + 30]], p.light, 'opacity="0.8" filter="url(#glow)"');
  }
  return s;
}

function floorPattern(p, g, opts) {
  const { x0, y1, x1, vpx } = g;
  const kind = p.floorPattern || opts.floorKind;
  let s = '';
  const lineCol = shade(p.floor, -0.14);
  if (kind === 'planks' || kind === 'wood') {
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      s += L(x0 + (x1 - x0) * t, y1, W * t, H, lineCol, 1.5, 'opacity="0.55"');
    }
  } else if (kind === 'tiles' || kind === 'athangudi' || p.pattern === 'athangudi') {
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      s += L(x0 + (x1 - x0) * t, y1, W * t, H, lineCol, 1.2, 'opacity="0.5"');
    }
    const rows = [0.05, 0.13, 0.24, 0.39, 0.6, 0.88];
    rows.forEach((t) => {
      const y = y1 + (H - y1) * t;
      s += L(0, y, W, y, lineCol, 1.2, 'opacity="0.45"');
    });
    if (kind === 'athangudi' || p.pattern === 'athangudi') {
      // Hand-made tile motifs as foreshortened medallions
      rows.slice(0, -1).forEach((t, ri) => {
        const ty = y1 + (H - y1) * t;
        const ny = y1 + (H - y1) * rows[ri + 1];
        const cy = (ty + ny) / 2;
        const lx = x0 + (0 - x0) * ((cy - y1) / (H - y1));
        const rx = x1 + (W - x1) * ((cy - y1) / (H - y1));
        for (let i = 0; i < 10; i++) {
          const cx = lx + ((rx - lx) * (i + 0.5)) / 10;
          const rw = (rx - lx) / 26;
          const rh = (ny - ty) / 3.2;
          s += E(cx, cy, rw, rh, p.accent, 'opacity="0.75"');
          s += E(cx, cy, rw / 2.2, rh / 2.2, p.fabric, 'opacity="0.85"');
          s += P([[cx - rw * 1.5, cy], [cx, cy - rh * 1.4], [cx + rw * 1.5, cy], [cx, cy + rh * 1.4]], 'none', `stroke="${shade(p.wall2, -0.2)}" stroke-width="1.2" opacity="0.6"`);
        }
      });
    }
  } else if (kind === 'marble') {
    const r = opts.rand;
    for (let i = 0; i < 9; i++) {
      const sx = r() * W;
      const sy = y1 + r() * (H - y1);
      s += `<path d="M${f1(sx)} ${f1(sy)} q ${f1(60 + r() * 80)} ${f1(10 + r() * 20)} ${f1(150 + r() * 120)} ${f1(-5 + r() * 25)}" stroke="${shade(p.floor, -0.2)}" stroke-width="1.4" fill="none" opacity="0.45"/>`;
    }
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      s += L(x0 + (x1 - x0) * t, y1, W * t, H, shade(p.floor, -0.08), 1, 'opacity="0.5"');
    }
  } else if (kind === 'terrazzo') {
    const r = opts.rand;
    const cols = [p.accent, p.wall2, shade(p.floor, -0.25), p.metal, '#ffffff'];
    for (let i = 0; i < 260; i++) {
      const t = Math.pow(r(), 0.7);
      const y = y1 + (H - y1) * t;
      const lx = x0 + (0 - x0) * t;
      const rx = x1 + (W - x1) * t;
      const x = lx + (rx - lx) * r();
      const sz = 1.5 + 5 * t * r();
      s += E(x, y, sz, sz * 0.55, cols[i % cols.length], 'opacity="0.65"');
    }
  }
  s += `<line x1="${vpx}" y1="${y1}" x2="${vpx}" y2="${y1}" />`;
  return s;
}

/* ---------- windows and walls ---------- */
function windowOnBack(p, x, y, w, h, kind) {
  let s = '';
  const frame = kind === 'louvre' ? p.accent : shade(p.wood, -0.1);
  if (kind === 'arch') {
    const r = w / 2;
    s += `<path d="M${x} ${y + h} V${y + r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h} Z" fill="url(#sky)" stroke="${frame}" stroke-width="10"/>`;
    s += L(x + w / 2, y, x + w / 2, y + h, frame, 5);
    s += `<path d="M${x + 14} ${y + h - 4} V${y + r + 4} A${r - 14} ${r - 14} 0 0 1 ${x + w - 14} ${y + r + 4}" fill="none" stroke="${shade(frame, 0.3)}" stroke-width="2" opacity="0.6"/>`;
  } else if (kind === 'louvre') {
    s += R(x, y, w, h, 'url(#sky)', `stroke="${frame}" stroke-width="10"`);
    const half = w / 2;
    [x - half * 0.55, x + w + 4].forEach((sx) => {
      s += R(sx, y - 4, half * 0.5, h + 8, frame);
      for (let i = 0; i < 14; i++) s += L(sx + 4, y + 8 + i * (h / 14), sx + half * 0.5 - 4, y + 8 + i * (h / 14), shade(frame, -0.25), 2.5);
    });
  } else {
    s += R(x, y, w, h, 'url(#sky)', `stroke="${frame}" stroke-width="10"`);
    s += L(x + w / 2, y, x + w / 2, y + h, frame, 5);
    s += L(x, y + h * 0.38, x + w, y + h * 0.38, frame, 4);
  }
  // sheer curtains
  s += P([[x - 22, y - 16], [x + 14, y - 16], [x + 2, y + h + 30], [x - 30, y + h + 30]], p.fabric, 'opacity="0.85"');
  s += P([[x + w - 14, y - 16], [x + w + 22, y - 16], [x + w + 30, y + h + 30], [x + w - 2, y + h + 30]], p.fabric, 'opacity="0.85"');
  s += R(x - 40, y - 22, w + 80, 6, p.metal);
  return s;
}

function lightBeam(p, x, y, w, h, y1) {
  return P([[x, y], [x + w, y], [x + w + 120, y1 + 240], [x - 60, y1 + 240]], p.light, 'opacity="0.18" filter="url(#glow)"');
}

function backWallDecor(p, g, opts) {
  const { x0, y0, x1, y1 } = g;
  let s = '';
  const r = opts.rand;
  if (p.wallPattern === 'brick') {
    const bh = 18;
    for (let row = 0; row * bh < y1 - y0 - 8; row++) {
      const y = y0 + row * bh;
      const off = row % 2 ? 0 : 24;
      for (let x = x0 - off; x < x1; x += 48) {
        const xx = Math.max(x, x0);
        const ww = Math.min(x + 46, x1) - xx;
        if (ww > 4) s += R(xx, y + 1, ww, bh - 2, shade(p.wall2, (r() - 0.5) * 0.18), 'opacity="0.9"');
      }
    }
  }
  if (p.panel === 'slats' || opts.slats) {
    const sx = x0 + (x1 - x0) * 0.08;
    const ex = x0 + (x1 - x0) * 0.4;
    for (let x = sx; x < ex; x += 14) s += R(x, y0 + 20, 8, y1 - y0 - 28, shade(p.wood, 0.1));
  }
  return s;
}

function art(p, x, y, w, h, rand) {
  let s = R(x - 6, y - 6, w + 12, h + 12, shade(p.wood, -0.25));
  s += R(x, y, w, h, shade(p.wall, 0.4));
  // abstract landscape / motif
  s += E(x + w * (0.3 + rand() * 0.4), y + h * 0.4, w * 0.18, w * 0.18, p.accent, 'opacity="0.85"');
  s += P([[x, y + h], [x + w * 0.35, y + h * 0.55], [x + w * 0.6, y + h * 0.8], [x + w, y + h * 0.5], [x + w, y + h]], p.wall2, 'opacity="0.8"');
  return s;
}

function pendant(p, x, y, len, kind = 'dome') {
  let s = L(x, 0, x, y + len, shade(p.metal, -0.3), 2);
  if (kind === 'paper') s += E(x, y + len + 24, 34, 30, '#fbf6ec', `stroke="${shade(p.wood, 0.2)}" stroke-width="1"`);
  else if (kind === 'bell') s += `<path d="M${x - 26} ${y + len + 34} Q${x} ${y + len - 14} ${x + 26} ${y + len + 34} Z" fill="${p.metal}"/>`;
  else s += `<path d="M${x - 40} ${y + len + 30} Q${x} ${y + len - 22} ${x + 40} ${y + len + 30} Z" fill="${p.accent}"/>`;
  s += E(x, y + len + 34, 70, 26, p.light, 'opacity="0.35" filter="url(#glow)"');
  return s;
}

function plant(p, x, y, sc = 1) {
  let s = shadow(x, y, 90 * sc);
  s += P([[x - 26 * sc, y - 60 * sc], [x + 26 * sc, y - 60 * sc], [x + 20 * sc, y], [x - 20 * sc, y]], p.accent);
  const g1 = '#5f7a50';
  const g2 = '#7c9967';
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i - 4) * 0.32;
    const lx = x + Math.cos(a) * 70 * sc;
    const ly = y - 60 * sc + Math.sin(a) * 110 * sc;
    s += `<path d="M${f1(x)} ${f1(y - 60 * sc)} Q${f1((x + lx) / 2 + 16 * sc)} ${f1((y - 60 * sc + ly) / 2)} ${f1(lx)} ${f1(ly)} Q${f1((x + lx) / 2 - 10 * sc)} ${f1((y - 60 * sc + ly) / 2 + 10)} ${f1(x)} ${f1(y - 60 * sc)}" fill="${i % 2 ? g1 : g2}"/>`;
  }
  return s;
}

function rug(p, g, cx, depth = 0.45, wide = 0.7) {
  const { x0, x1, y1 } = g;
  const yb = y1 + (H - y1) * depth;
  const w = (x1 - x0) * wide;
  const fy = y1 + 18;
  let s = P([[cx - w * 0.42, fy], [cx + w * 0.42, fy], [cx + w * 0.62, yb], [cx - w * 0.62, yb]], p.rug === 'kilim' ? p.accent : shade(p.fabric, -0.08), 'opacity="0.92"');
  s += P([[cx - w * 0.36, fy + 10], [cx + w * 0.36, fy + 10], [cx + w * 0.53, yb - 14], [cx - w * 0.53, yb - 14]], 'none', `stroke="${p.rug === 'kilim' ? p.fabric : p.wall2}" stroke-width="3" opacity="0.7"`);
  if (p.rug === 'kilim') {
    for (let i = 0; i < 6; i++) {
      const t = (i + 0.5) / 6;
      const cxx = cx - w * 0.5 + w * t;
      s += P([[cxx, fy + 18], [cxx + 18, (fy + yb) / 2], [cxx, yb - 22], [cxx - 18, (fy + yb) / 2]], p.wall2, 'opacity="0.8"');
    }
  }
  return s;
}

/* ---------- furniture pieces (front elevations, sitting on the back-wall line) ---------- */
function sofa(p, cx, base, w = 380) {
  const h = 120;
  let s = shadow(cx, base + 4, w * 1.05);
  s += R(cx - w / 2, base - h, w, h * 0.55, shade(p.fabric, -0.12), 'rx="18"');
  s += R(cx - w / 2 - 18, base - h * 0.62, 36, h * 0.62, shade(p.fabric, -0.2), 'rx="14"');
  s += R(cx + w / 2 - 18, base - h * 0.62, 36, h * 0.62, shade(p.fabric, -0.2), 'rx="14"');
  s += R(cx - w / 2 + 12, base - h * 0.5, w - 24, h * 0.32, p.fabric, 'rx="12"');
  s += R(cx - w / 2 + 6, base - 14, w - 12, 14, shade(p.wood, -0.2));
  s += R(cx - w * 0.36, base - h * 0.86, 70, 56, p.accent, 'rx="12" opacity="0.9"');
  s += R(cx + w * 0.2, base - h * 0.84, 64, 52, p.wall2, 'rx="12" opacity="0.9"');
  return s;
}
function chairCane(p, cx, base, sc = 1) {
  let s = shadow(cx, base, 110 * sc);
  s += R(cx - 46 * sc, base - 140 * sc, 92 * sc, 90 * sc, shade(p.wood, 0.25), `rx="${20 * sc}"`);
  for (let i = 1; i < 8; i++) s += L(cx - 46 * sc + i * 11.5 * sc, base - 136 * sc, cx - 46 * sc + i * 11.5 * sc, base - 54 * sc, shade(p.wood, -0.05), 1.2);
  s += R(cx - 52 * sc, base - 60 * sc, 104 * sc, 22 * sc, p.fabric, `rx="${8 * sc}"`);
  s += L(cx - 42 * sc, base - 40 * sc, cx - 50 * sc, base, shade(p.wood, -0.25), 6 * sc);
  s += L(cx + 42 * sc, base - 40 * sc, cx + 50 * sc, base, shade(p.wood, -0.25), 6 * sc);
  return s;
}
function table(p, cx, base, w = 200, h = 70, top = p.wood) {
  let s = shadow(cx, base, w);
  s += R(cx - w / 2, base - h, w, 14, top, 'rx="4"');
  s += R(cx - w / 2 + 14, base - h + 14, 10, h - 14, shade(p.wood, -0.25));
  s += R(cx + w / 2 - 24, base - h + 14, 10, h - 14, shade(p.wood, -0.25));
  return s;
}
function tvUnit(p, cx, base, w = 460) {
  let s = shadow(cx, base, w);
  s += R(cx - w / 2, base - 70, w, 70, shade(p.wood, 0.05), 'rx="4"');
  for (let i = 1; i < 4; i++) s += L(cx - w / 2 + (w / 4) * i, base - 66, cx - w / 2 + (w / 4) * i, base - 4, shade(p.wood, -0.25), 1.5);
  s += R(cx - 150, base - 270, 300, 170, '#1f1d1b', 'rx="6"');
  s += R(cx - 144, base - 264, 288, 158, '#2a3a40', 'rx="3" opacity="0.9"');
  return s;
}
function lamp(p, cx, base) {
  let s = L(cx, base, cx, base - 220, shade(p.metal, -0.2), 4);
  s += `<path d="M${cx - 42} ${base - 210} L${cx - 28} ${base - 270} L${cx + 28} ${base - 270} L${cx + 42} ${base - 210} Z" fill="${shade(p.fabric, 0.3)}"/>`;
  s += E(cx, base - 220, 80, 50, p.light, 'opacity="0.35" filter="url(#glow)"');
  s += E(cx, base, 30, 5, shade(p.metal, -0.3));
  return s;
}
function bed(p, cx, base, w = 440, posts = false) {
  let s = shadow(cx, base, w * 1.05);
  if (posts) {
    [cx - w / 2 - 6, cx + w / 2 - 6].forEach((x) => (s += R(x, base - 360, 12, 360, shade(p.wood, -0.25))));
    s += R(cx - w / 2 - 6, base - 364, w + 12, 12, shade(p.wood, -0.25));
  }
  s += R(cx - w / 2 + 10, base - 230, w - 20, 150, p.wall2, 'rx="26"');
  s += R(cx - w / 2, base - 100, w, 70, '#fbf6ee', 'rx="10"');
  s += R(cx - w / 2, base - 70, w, 46, p.fabric, 'rx="8"');
  s += R(cx - w / 2 + 30, base - 128, 120, 44, '#fffaf2', 'rx="14"');
  s += R(cx + w / 2 - 150, base - 128, 120, 44, '#fffaf2', 'rx="14"');
  s += R(cx - w / 2, base - 26, w, 26, shade(p.wood, -0.15));
  // throw
  s += P([[cx + w * 0.05, base - 96], [cx + w / 2, base - 96], [cx + w / 2, base - 26], [cx + w * 0.12, base - 26]], p.accent, 'opacity="0.85"');
  return s;
}
function sideTable(p, cx, base) {
  let s = shadow(cx, base, 90);
  s += R(cx - 40, base - 70, 80, 70, shade(p.wood, 0.05), 'rx="6"');
  s += L(cx - 34, base - 36, cx + 34, base - 36, shade(p.wood, -0.25), 1.5);
  s += E(cx, base - 92, 14, 22, p.light, 'filter="url(#glow)" opacity="0.6"');
  s += P([[cx - 22, base - 70], [cx + 22, base - 70], [cx + 14, base - 104], [cx - 14, base - 104]], shade(p.fabric, 0.25));
  return s;
}
function wardrobe(p, x, base, w, h, finish) {
  let s = R(x, base - h, w, h, finish, 'rx="4"');
  const n = Math.max(2, Math.round(w / 90));
  for (let i = 1; i < n; i++) s += L(x + (w / n) * i, base - h + 4, x + (w / n) * i, base - 4, shade(finish, -0.18), 2);
  for (let i = 0; i < n; i++) s += R(x + (w / n) * i + (w / n) / 2 - 2 + (i % 2 ? -14 : 14), base - h * 0.55, 4, 60, p.metal, 'rx="2"');
  return s;
}
function kitchen(p, g, base, opts) {
  const { x0, x1, y0 } = g;
  const w = x1 - x0 - 40;
  const x = x0 + 20;
  const shutter = opts.cabinet || shade(p.wall2, 0.15);
  let s = '';
  // backsplash tiles
  s += R(x, base - 250, w, 120, shade(p.wall, 0.1));
  for (let i = 0; i < w / 30; i++) s += L(x + i * 30, base - 250, x + i * 30, base - 130, shade(p.wall, -0.1), 1);
  for (let j = 0; j < 4; j++) s += L(x, base - 250 + j * 30, x + w, base - 250 + j * 30, shade(p.wall, -0.1), 1);
  // upper cabinets
  s += wardrobe(p, x, base - 260, w * 0.62, Math.min(170, base - 260 - y0 - 20), shutter);
  // chimney hood
  s += P([[x + w * 0.68, base - 250], [x + w * 0.9, base - 250], [x + w * 0.86, base - 300], [x + w * 0.72, base - 300]], shade(p.metal, -0.1));
  s += R(x + w * 0.765, y0, w * 0.07, base - 300 - y0, shade(p.metal, -0.15));
  // counter
  s += R(x - 6, base - 130, w + 12, 16, opts.counter || '#2b2a28');
  s += wardrobe(p, x, base, w, 114, shutter);
  // hob and kettle
  s += R(x + w * 0.7, base - 136, w * 0.18, 6, '#1d1c1a');
  s += E(x + w * 0.74, base - 146, 24, 10, p.metal);
  s += E(x + w * 0.2, base - 150, 26, 22, p.metal);
  s += R(x + w * 0.35, base - 162, 60, 34, '#ffffff', 'rx="4" opacity="0.8"');
  return s;
}
function bathroom(p, g, base) {
  const { x0, x1, y0 } = g;
  const w = x1 - x0;
  let s = '';
  // tiled wall
  for (let i = 0; i < w / 60; i++) s += L(x0 + i * 60, y0 + 40, x0 + i * 60, base, shade(p.wall2, -0.08), 1, 'opacity="0.5"');
  for (let j = 0; j < (base - y0) / 60; j++) s += L(x0, y0 + 40 + j * 60, x1, y0 + 40 + j * 60, shade(p.wall2, -0.08), 1, 'opacity="0.5"');
  // shower glass
  s += R(x0 + w * 0.62, y0 + 30, 6, base - y0 - 30, '#cfe3ea', 'opacity="0.8"');
  s += R(x0 + w * 0.63, y0 + 30, w * 0.34, base - y0 - 30, '#dbeef3', 'opacity="0.18"');
  s += L(x0 + w * 0.82, y0 + 60, x0 + w * 0.82, y0 + 150, p.metal, 4);
  s += E(x0 + w * 0.82, y0 + 60, 30, 8, p.metal);
  // vanity
  s += shadow(x0 + w * 0.3, base, 300);
  s += R(x0 + w * 0.12, base - 210, w * 0.36, 26, '#f6f2ec', 'rx="4"');
  s += R(x0 + w * 0.12, base - 184, w * 0.36, 100, shade(p.wood, 0.05), 'rx="4"');
  s += E(x0 + w * 0.3, base - 214, 60, 10, '#ffffff');
  // mirror
  const mx = x0 + w * 0.3;
  if (p.window === 'arch') s += `<path d="M${mx - 80} ${base - 250} V${base - 380} A80 80 0 0 1 ${mx + 80} ${base - 380} V${base - 250} Z" fill="#dfe9ec" stroke="${p.metal}" stroke-width="6"/>`;
  else s += E(mx, base - 340, 82, 92, '#dfe9ec', `stroke="${p.metal}" stroke-width="6"`);
  return s;
}
function mandir(p, g, base) {
  const { x0, x1, y0 } = g;
  const cx = (x0 + x1) / 2;
  let s = '';
  s += R(cx - 220, base - 120, 440, 120, shade(p.wood, -0.05));
  s += R(cx - 230, base - 128, 460, 12, p.floorPattern === 'marble' ? '#f4efe6' : '#efe8dc');
  s += `<path d="M${cx - 180} ${base - 128} V${base - 380} Q${cx - 180} ${y0 + 60} ${cx} ${y0 + 40} Q${cx + 180} ${y0 + 60} ${cx + 180} ${base - 380} V${base - 128} Z" fill="${shade(p.wood, -0.15)}"/>`;
  s += `<path d="M${cx - 150} ${base - 128} V${base - 370} Q${cx - 150} ${y0 + 90} ${cx} ${y0 + 72} Q${cx + 150} ${y0 + 90} ${cx + 150} ${base - 370} V${base - 128} Z" fill="${shade(p.wall2, 0.25)}"/>`;
  // jaali dots
  for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) s += E(cx - 105 + c * 30, base - 330 + r * 30, 6, 6, p.light, 'opacity="0.6"');
  // diyas and bells
  [-90, 0, 90].forEach((dx) => {
    s += E(cx + dx, base - 136, 22, 8, p.metal);
    s += E(cx + dx, base - 150, 6, 12, '#ffc35a', 'filter="url(#glow)"');
  });
  [-130, 130].forEach((dx) => {
    s += L(cx + dx, y0 + 120, cx + dx, base - 330, p.metal, 2);
    s += `<path d="M${cx + dx - 18} ${base - 300} Q${cx + dx} ${base - 350} ${cx + dx + 18} ${base - 300} Z" fill="${p.metal}"/>`;
  });
  // marigold toran
  for (let i = 0; i < 22; i++) {
    const t = i / 21;
    s += E(cx - 170 + 340 * t, y0 + 110 + Math.sin(t * Math.PI) * 30, 8, 8, i % 2 ? '#f0a020' : '#e8742a');
  }
  return s;
}
function desk(p, cx, base, w = 360) {
  let s = table(p, cx, base, w, 90, shade(p.wood, 0.1));
  s += R(cx - 70, base - 200, 140, 90, '#1f1d1b', 'rx="6"');
  s += R(cx - 64, base - 194, 128, 78, '#3a4b52', 'rx="3"');
  s += R(cx - 8, base - 110, 16, 20, '#1f1d1b');
  s += chairOffice(p, cx + w * 0.22, base + 40);
  s += E(cx - w * 0.38, base - 96, 26, 10, p.metal);
  return s;
}
function chairOffice(p, cx, base) {
  let s = shadow(cx, base, 120);
  s += R(cx - 44, base - 170, 88, 90, '#2c2a28', 'rx="18"');
  s += R(cx - 50, base - 86, 100, 22, '#2c2a28', 'rx="8"');
  s += L(cx, base - 64, cx, base - 18, '#2c2a28', 8);
  s += L(cx - 40, base, cx + 40, base, '#2c2a28', 6);
  return s;
}
function shelves(p, x, base, w, h, rand) {
  let s = R(x, base - h, w, h, shade(p.wood, -0.05));
  const rows = Math.floor(h / 70);
  for (let r = 0; r < rows; r++) {
    const y = base - h + 10 + r * (h / rows);
    s += R(x + 8, y + h / rows - 16, w - 16, 6, shade(p.wood, -0.25));
    let bx = x + 14;
    while (bx < x + w - 30) {
      const bw = 10 + rand() * 16;
      const bh = 34 + rand() * 20;
      const cols = [p.accent, p.wall2, p.fabric, shade(p.wood, 0.3), '#40525a'];
      s += R(bx, y + h / rows - 16 - bh, bw, bh, cols[Math.floor(rand() * cols.length)]);
      bx += bw + 2;
      if (rand() < 0.1) bx += 20;
    }
  }
  return s;
}
function swing(p, cx, y0, base) {
  let s = L(cx - 120, y0 + 20, cx - 120, base - 120, p.metal, 3);
  s += L(cx + 120, y0 + 20, cx + 120, base - 120, p.metal, 3);
  s += R(cx - 140, base - 130, 280, 26, shade(p.wood, 0.2), 'rx="6"');
  s += R(cx - 130, base - 200, 260, 70, shade(p.wood, 0.25), 'rx="14"');
  for (let i = 1; i < 12; i++) s += L(cx - 130 + i * 21.6, base - 196, cx - 130 + i * 21.6, base - 134, shade(p.wood, -0.05), 1.2);
  s += R(cx - 100, base - 150, 80, 30, p.accent, 'rx="10"');
  return s;
}
function railing(p, g) {
  const { x0, x1, y1 } = g;
  let s = R(x0, y1 - 160, x1 - x0, 8, p.metal);
  for (let x = x0 + 10; x < x1; x += 26) s += R(x, y1 - 154, 4, 150, p.metal, 'opacity="0.85"');
  return s;
}
function screen(p, g, base) {
  const { x0, x1, y0 } = g;
  let s = R(x0 + 60, y0 + 40, x1 - x0 - 120, base - y0 - 220, '#f8f6f2', 'rx="4"');
  s += R(x0 + 70, y0 + 50, x1 - x0 - 140, base - y0 - 240, '#2d3f4a', 'opacity="0.9"');
  return s;
}
function recliners(p, cx, base, n = 3) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = cx + (i - (n - 1) / 2) * 190;
    s += shadow(x, base, 180);
    s += R(x - 80, base - 130, 160, 90, shade(p.fabric, -0.25), 'rx="24"');
    s += R(x - 90, base - 60, 180, 50, shade(p.fabric, -0.15), 'rx="16"');
  }
  return s;
}
function gym(p, g, base) {
  const { x0, x1 } = g;
  let s = R(x0 + 40, base - 320, (x1 - x0) * 0.45, 300, '#dfe9ec', `stroke="${p.metal}" stroke-width="4"`);
  s += R(x1 - 260, base - 150, 200, 140, '#2b2a28', 'rx="6"');
  for (let i = 0; i < 4; i++) s += E(x1 - 230 + i * 50, base - 120, 18, 18, shade(p.accent, -0.2));
  s += P([[x0 + 120, base + 40], [x0 + 420, base + 40], [x0 + 460, base + 120], [x0 + 80, base + 120]], p.accent, 'opacity="0.85"');
  return s;
}
function machine(p, cx, base) {
  let s = shadow(cx, base, 160);
  s += R(cx - 70, base - 170, 140, 170, '#f3f1ec', 'rx="8"');
  s += E(cx, base - 85, 44, 44, '#cfd7da', 'stroke="#9aa3a6" stroke-width="6"');
  s += R(cx - 60, base - 162, 120, 16, '#dedbd4', 'rx="4"');
  return s;
}
function counter(p, cx, base, w = 420, front = p.wood) {
  let s = shadow(cx, base, w);
  s += R(cx - w / 2, base - 140, w, 14, '#2b2a28');
  s += R(cx - w / 2 + 6, base - 126, w - 12, 126, front, 'rx="4"');
  for (let i = 1; i < 6; i++) s += L(cx - w / 2 + (w / 6) * i, base - 120, cx - w / 2 + (w / 6) * i, base - 6, shade(front, -0.2), 2);
  return s;
}
function bench(p, cx, base, w = 300) {
  let s = shadow(cx, base, w);
  s += R(cx - w / 2, base - 60, w, 24, shade(p.wood, 0.1), 'rx="6"');
  s += R(cx - w / 2 + 10, base - 36, 14, 36, shade(p.wood, -0.2));
  s += R(cx + w / 2 - 24, base - 36, 14, 36, shade(p.wood, -0.2));
  return s;
}
function stairs(p, g, base) {
  const { x0, x1, y0 } = g;
  let s = '';
  const steps = 9;
  for (let i = 0; i < steps; i++) {
    const x = x0 + 60 + i * 52;
    const y = base - 40 - i * 46;
    s += R(x, y, 120, 14, shade(p.wood, 0.05));
    s += R(x, y + 14, 120, 4, 'rgba(0,0,0,0.12)');
  }
  s += L(x0 + 60, base - 120, x0 + 60 + steps * 52, base - 120 - steps * 46, p.metal, 4);
  s += R(x1 - 260, base - 110, 200, 110, shade(p.wood, -0.05), 'rx="4"');
  s += L(x1 - 160, base - 106, x1 - 160, base - 4, shade(p.wood, -0.25), 2);
  void y0;
  return s;
}
function desksRow(p, g, base, n = 3) {
  const { x0, x1 } = g;
  let s = '';
  const span = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const cx = x0 + span * (i + 0.5);
    s += table(p, cx, base, span * 0.8, 80, '#f2eee8');
    s += R(cx - 40, base - 150, 80, 56, '#2b2a28', 'rx="4"');
    s += chairOffice(p, cx, base + 50);
  }
  return s;
}
function diningSet(p, cx, base) {
  let s = '';
  s += chairCane(p, cx - 170, base - 6, 0.95);
  s += chairCane(p, cx + 170, base - 6, 0.95);
  s += table(p, cx, base + 10, 380, 86);
  s += E(cx, base - 92, 36, 10, p.metal);
  s += E(cx - 90, base - 84, 22, 6, '#f7f2ea');
  s += E(cx + 90, base - 84, 22, 6, '#f7f2ea');
  return s;
}
function mirrorChairs(p, g, base, n = 3) {
  const { x0, x1 } = g;
  let s = '';
  const span = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const cx = x0 + span * (i + 0.5);
    s += R(cx - 70, base - 380, 140, 200, '#dfe9ec', `stroke="${p.metal}" stroke-width="5" rx="70"`);
    s += E(cx, base - 380, 90, 30, p.light, 'opacity="0.35" filter="url(#glow)"');
    s += chairOffice(p, cx, base + 30);
  }
  return s;
}

/* ---------- scene composition by category ---------- */
function compose(cat, p, g, opts) {
  const { x0, x1, y0, y1 } = g;
  const cx = (x0 + x1) / 2;
  const base = y1;
  const r = opts.rand;
  const winKind = p.window || 'plain';
  let back = '';
  let front = '';
  let decor = '';
  const winW = 170;
  const addWindow = (wx) => {
    back += windowOnBack(p, wx, y0 + 70, winW, 230, winKind);
    decor += lightBeam(p, wx, y0 + 70, winW, 230, y1);
  };
  switch (cat) {
    case 'living-room':
    case 'reception':
    case 'hospitality':
      addWindow(x1 - winW - 60);
      front += rug(p, g, cx - 40);
      if (opts.tv) {
        front += tvUnit(p, cx - 60, base - 2, 440);
        front += table(p, cx - 60, base + 150, 220, 52);
        front += chairCane(p, cx - 330, base + 170, 1.1);
        front += chairCane(p, cx + 210, base + 170, 1.1);
      } else {
        back += art(p, cx - 230, y0 + 90, 200, 140, r);
        front += sofa(p, cx - 80, base + 26);
        front += table(p, cx - 60, base + 150, 220, 52);
        front += chairCane(p, x1 - 120, base + 120);
      }
      front += plant(p, x0 + 30, base + 70);
      front += lamp(p, x0 + 110, base + 30);
      decor += pendant(p, cx - 60, y0 - 20, 40, p.ceiling === 'slats' ? 'bell' : 'dome');
      break;
    case 'master-bedroom':
    case 'guest-bedroom':
    case 'boutique-hotel':
    case 'senior-bedroom':
      addWindow(x1 - winW - 50);
      front += rug(p, g, cx - 60, 0.6, 0.8);
      front += bed(p, cx - 60, base + 60, 440, p.pattern === 'athangudi' || opts.style === 'bengali-heritage');
      front += sideTable(p, cx - 340, base + 40);
      front += sideTable(p, cx + 220, base + 40);
      decor += pendant(p, cx - 340, y0 - 20, 60, 'paper');
      if (cat === 'senior-bedroom') back += R(x0 + 40, base - 140, 140, 8, p.metal, 'rx="4"');
      break;
    case 'kids-bedroom':
    case 'nursery':
      addWindow(x0 + 60);
      back += R(x1 - 330, y0 + 70, 260, 160, shade(p.wall2, 0.35), 'rx="8"');
      for (let i = 0; i < 6; i++) back += E(x1 - 300 + i * 44, y0 + 150 + (i % 2) * 20, 16, 16, [p.accent, p.wall2, '#e9c46a'][i % 3]);
      front += rug(p, g, cx, 0.5, 0.6);
      front += bed(p, cx + 80, base + 50, cat === 'nursery' ? 260 : 340);
      front += shelves(p, x0 + 20, base + 20, 170, 240, r);
      break;
    case 'modular-kitchen':
    case 'open-kitchen':
      front += kitchen(p, g, base, { cabinet: opts.cabinet, counter: opts.counter });
      if (cat === 'open-kitchen') front += counter(p, cx, base + 170, 480, shade(p.wood, 0.1));
      decor += pendant(p, cx - 120, y0 - 20, 70, 'bell') + pendant(p, cx + 120, y0 - 20, 70, 'bell');
      break;
    case 'dining-room':
      addWindow(x0 + 70);
      back += art(p, cx + 40, y0 + 90, 220, 150, r);
      front += diningSet(p, cx, base + 70);
      front += counter(p, x1 - 160, base + 6, 220, shade(p.wood, 0.1));
      decor += pendant(p, cx, y0 - 20, 90, p.metal ? 'bell' : 'dome');
      break;
    case 'bathroom':
    case 'powder-room':
      front += bathroom(p, g, base);
      break;
    case 'pooja-room':
      front += mandir(p, g, base);
      break;
    case 'home-office':
    case 'study-room':
      addWindow(x1 - winW - 50);
      front += shelves(p, x0 + 30, base, 240, 360, r);
      front += desk(p, cx + 20, base + 40);
      front += plant(p, x1 - 60, base + 80, 0.8);
      break;
    case 'library':
      front += shelves(p, x0 + 20, base, (x1 - x0) / 2 - 30, base - y0 - 30, r);
      front += shelves(p, cx + 10, base, (x1 - x0) / 2 - 30, base - y0 - 30, r);
      front += chairCane(p, cx, base + 140, 1.2);
      front += lamp(p, cx + 140, base + 130);
      break;
    case 'walk-in-wardrobe':
    case 'dressing-room':
    case 'storage-room':
      front += wardrobe(p, x0 + 20, base, (x1 - x0) * 0.6, base - y0 - 40, opts.cabinet || shade(p.wood, 0.1));
      back += E(x1 - 150, y0 + 200, 80, 110, '#dfe9ec', `stroke="${p.metal}" stroke-width="6"`);
      front += bench(p, cx + 40, base + 120, 220);
      decor += pendant(p, cx + 120, y0 - 20, 50, 'bell');
      break;
    case 'foyer':
    case 'corridor':
      back += R(cx - 90, y0 + 50, 180, base - y0 - 50, shade(p.wood, -0.1), 'rx="4"');
      back += R(cx - 76, y0 + 64, 152, base - y0 - 70, shade(p.wood, 0.05));
      for (let i = 0; i < 5; i++) back += R(cx - 60, y0 + 90 + i * 70, 120, 50, shade(p.wood, -0.05), 'rx="6"');
      back += E(cx + 50, base - 230, 8, 8, p.metal);
      front += bench(p, x0 + 140, base + 40, 220);
      front += plant(p, x1 - 80, base + 60, 0.9);
      back += art(p, x1 - 230, y0 + 100, 140, 180, r);
      break;
    case 'staircase':
      front += stairs(p, g, base);
      decor += pendant(p, cx, y0 - 20, 140, 'dome');
      break;
    case 'utility':
      front += machine(p, x0 + 140, base + 20);
      front += counter(p, cx + 120, base + 10, 360, opts.cabinet || shade(p.wall2, 0.2));
      back += L(x0 + 60, y0 + 70, x1 - 60, y0 + 70, p.metal, 3);
      for (let i = 0; i < 6; i++) back += R(x0 + 120 + i * 90, y0 + 74, 60, 70 + (i % 2) * 20, [p.fabric, p.accent, '#f6f3ee'][i % 3]);
      break;
    case 'balcony':
    case 'terrace':
    case 'verandah':
      back += R(x0, y0, x1 - x0, y1 - y0, 'url(#sky)');
      back += P([[x0, y1 - 160], [x0 + 200, y1 - 260], [x0 + 420, y1 - 190], [x0 + 620, y1 - 280], [x1, y1 - 200], [x1, y1 - 160]], '#9fb39a', 'opacity="0.55"');
      if (cat !== 'verandah') back += railing(p, g);
      else {
        [x0 + 40, cx - 10, x1 - 60].forEach((px) => (back += R(px, y0, 22, y1 - y0, shade(p.wood, -0.15))));
      }
      front += swing(p, cx - 40, y0, base + 40);
      front += plant(p, x0 + 60, base + 80);
      front += plant(p, x1 - 60, base + 90, 1.1);
      break;
    case 'home-theatre':
      front += screen(p, g, base);
      front += recliners(p, cx, base + 140);
      for (let i = 0; i < 40; i++) decor += E(r() * W, r() * (y0 - 10), 1.6, 1.6, '#fff6d5', 'opacity="0.9"');
      break;
    case 'home-gym':
      addWindow(x1 - winW - 40);
      front += gym(p, g, base);
      break;
    case 'multipurpose-room':
      addWindow(x1 - winW - 60);
      front += wardrobe(p, x0 + 30, base, 280, 330, opts.cabinet || shade(p.wood, 0.1));
      front += desk(p, cx + 80, base + 40, 300);
      break;
    case 'office':
    case 'coworking':
    case 'education':
      addWindow(x1 - winW - 40);
      back += R(x0 + 40, y0 + 70, 300, 170, cat === 'education' ? '#2f4a3f' : '#f5f3ef', `stroke="${p.metal}" stroke-width="5"`);
      front += desksRow(p, g, base + 50, cat === 'coworking' ? 4 : 3);
      decor += pendant(p, cx - 160, y0 - 20, 40) + pendant(p, cx + 160, y0 - 20, 40);
      break;
    case 'retail':
      front += shelves(p, x0 + 20, base, 220, 340, r);
      front += shelves(p, x1 - 240, base, 220, 340, r);
      back += `<path d="M${cx - 110} ${base - 40} V${y0 + 150} A110 110 0 0 1 ${cx + 110} ${y0 + 150} V${base - 40} Z" fill="${shade(p.wall2, 0.2)}"/>`;
      front += counter(p, cx, base + 120, 360, shade(p.wood, 0.05));
      decor += pendant(p, cx, y0 - 20, 80, 'bell');
      break;
    case 'restaurant':
    case 'cafe':
      addWindow(x0 + 50);
      front += counter(p, x1 - 220, base + 6, 300, shade(p.wood, 0.05));
      front += table(p, cx - 60, base + 120, 180, 76);
      front += chairCane(p, cx - 180, base + 120, 0.85);
      front += chairCane(p, cx + 60, base + 120, 0.85);
      front += plant(p, x0 + 40, base + 90, 0.9);
      decor += pendant(p, cx - 60, y0 - 20, 90, 'paper') + pendant(p, x1 - 220, y0 - 20, 60, 'bell');
      break;
    case 'salon':
      front += mirrorChairs(p, g, base + 40, 3);
      break;
    case 'clinic':
      addWindow(x1 - winW - 40);
      front += counter(p, cx - 120, base + 30, 380, '#f1ede6');
      front += bench(p, x1 - 220, base + 140, 240);
      front += plant(p, x0 + 50, base + 60, 0.9);
      break;
    default:
      front += sofa(p, cx, base + 30);
  }
  return { back, front, decor };
}

const FLOOR_BY_MATERIAL = {
  'engineered-wood': 'planks', 'laminate-flooring': 'planks', 'solid-wood': 'planks',
  'vitrified-tiles': 'tiles', 'ceramic-tiles': 'tiles', 'kota-stone': 'tiles', 'terracotta-tiles': 'tiles',
  'athangudi-tiles': 'athangudi', marble: 'marble', terrazzo: 'terrazzo', granite: 'tiles', sandstone: 'tiles',
};

function defs(p) {
  return `<defs>
  <linearGradient id="wallB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(p.wall, 0.12)}"/><stop offset="1" stop-color="${shade(p.wall, -0.04)}"/></linearGradient>
  <linearGradient id="wallL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(p.wall, -0.16)}"/><stop offset="1" stop-color="${shade(p.wall, -0.06)}"/></linearGradient>
  <linearGradient id="wallR" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="${shade(p.wall, -0.1)}"/><stop offset="1" stop-color="${shade(p.wall, -0.02)}"/></linearGradient>
  <linearGradient id="ceil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(p.wall, 0.02)}"/><stop offset="1" stop-color="${shade(p.wall, 0.2)}"/></linearGradient>
  <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(p.floor, 0.08)}"/><stop offset="1" stop-color="${shade(p.floor, -0.12)}"/></linearGradient>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe2ea"/><stop offset="1" stop-color="#f6ecd8"/></linearGradient>
  <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.75"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1a120c" stop-opacity="0.22"/></radialGradient>
  <filter id="soft" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
</defs>`;
}

/**
 * Room views: 'room' (from the doorway) and 'corner' (angled). 'detail' renders a
 * material and object vignette instead of a room.
 */
export function roomSVG(design, style, view = 'room') {
  const p = { ...DEFAULT_PALETTE, ...(style?.palette || {}) };
  if (view === 'detail') return detailSVG(design, p);
  const rand = rng(`${design.id}:${view}`);
  const g = geometry(view);
  const mats = design.materials || [];
  const floorMat = mats.find((m) => FLOOR_BY_MATERIAL[m]);
  const opts = {
    rand,
    style: design.style,
    floorKind: floorMat ? FLOOR_BY_MATERIAL[floorMat] : 'tiles',
    tv: design.elements?.includes('tv-units'),
    cove: mats.includes('gypsum-board') || design.elements?.includes('false-ceiling'),
    slats: design.elements?.includes('partitions') || design.elements?.includes('acoustics'),
    cabinet: mats.includes('acrylic-finish') ? shade(p.wall2, 0.35) : mats.includes('veneer') ? shade(p.wood, 0.15) : undefined,
    counter: mats.includes('quartz') ? '#e9e5de' : mats.includes('granite') ? '#262423' : mats.includes('terrazzo') ? '#e6dccd' : undefined,
  };
  if (design.category === 'home-theatre') {
    p.wall = shade(p.wall2 || '#3a3a3a', -0.45);
    p.floor = shade(p.wall2 || '#3a3a3a', -0.25);
    p.floorPattern = 'planks';
    p.light = '#ffd9a0';
  }
  const parts = compose(design.category, p, g, opts);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">
${defs(p)}
${shell(p, g, opts)}
${backWallDecor(p, g, opts)}
${parts.back}
${parts.decor}
${parts.front}
<rect width="${W}" height="${H}" fill="url(#vignette)"/>
</svg>`;
}

function detailSVG(design, p) {
  const rand = rng(`${design.id}:detail`);
  let s = '';
  // Backdrop: accent wall with a soft shadow line, and a ledge
  s += R(0, 0, W, H, shade(p.wall, 0.05));
  s += R(0, 0, W * 0.58, H, shade(p.wall2, 0.25));
  s += R(0, 600, W, 300, shade(p.floor, -0.02));
  s += R(0, 592, W, 14, shade(p.wood, -0.1));
  // Material swatches leaning on the wall
  const sw = [
    { c: p.wood, kind: 'grain' },
    { c: p.floorPattern === 'marble' || (design.materials || []).includes('marble') ? '#efe9df' : p.floor, kind: 'stone' },
    { c: p.fabric, kind: 'weave' },
    { c: p.accent, kind: 'plain' },
  ];
  sw.forEach((m, i) => {
    const x = 90 + i * 150;
    const y = 250 + (i % 2) * 40;
    const w = 180;
    const h = 350 - (i % 2) * 40;
    s += E(x + w / 2 + 20, 600, w / 2, 10, 'rgba(40,28,18,0.25)', 'filter="url(#soft)"');
    s += `<g transform="rotate(${-4 + i * 2.5} ${x + w / 2} ${y + h})">`;
    s += R(x, y, w, h, m.c, 'rx="6"');
    if (m.kind === 'grain') for (let k = 0; k < 14; k++) s += `<path d="M${x + 8 + k * 12} ${y} q ${f1(-8 + rand() * 16)} ${h / 2} ${f1(-4 + rand() * 8)} ${h}" stroke="${shade(m.c, -0.18)}" stroke-width="1.6" fill="none" opacity="0.6"/>`;
    if (m.kind === 'stone') for (let k = 0; k < 5; k++) s += `<path d="M${x} ${f1(y + rand() * h)} q ${w / 2} ${f1(-30 + rand() * 60)} ${w} ${f1(-20 + rand() * 40)}" stroke="${shade(m.c, -0.25)}" stroke-width="1.4" fill="none" opacity="0.5"/>`;
    if (m.kind === 'weave') for (let k = 0; k < h / 10; k++) s += L(x, y + k * 10, x + w, y + k * 10, shade(m.c, -0.08), 1, 'opacity="0.6"');
    s += '</g>';
  });
  // Brass lamp / vase vignette on the right
  const cx = 900;
  s += E(cx, 600, 120, 14, 'rgba(40,28,18,0.25)', 'filter="url(#soft)"');
  s += `<path d="M${cx - 60} 600 Q${cx - 90} 470 ${cx - 30} 430 L${cx + 30} 430 Q${cx + 90} 470 ${cx + 60} 600 Z" fill="${p.metal}"/>`;
  s += `<path d="M${cx - 30} 430 Q${cx} 410 ${cx + 30} 430" fill="${shade(p.metal, -0.2)}"/>`;
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.28;
    s += `<path d="M${cx} 430 Q${f1(cx + Math.cos(a) * 60)} ${f1(330 + Math.sin(a) * 30)} ${f1(cx + Math.cos(a) * 140)} ${f1(250 + Math.sin(a) * 120)}" stroke="#5f7a50" stroke-width="5" fill="none"/>`;
    s += E(cx + Math.cos(a) * 140, 250 + Math.sin(a) * 120, 20, 9, '#7c9967', `transform="rotate(${f1((a * 180) / Math.PI)} ${f1(cx + Math.cos(a) * 140)} ${f1(250 + Math.sin(a) * 120)})"`);
  }
  // Swatch card
  s += R(760, 640, 300, 160, '#fbf8f3', 'rx="10"');
  ['wall', 'wall2', 'wood', 'accent', 'fabric'].forEach((k, i) => (s += E(800 + i * 52, 700, 20, 20, p[k], `stroke="${shade(p[k], -0.15)}" stroke-width="1"`)));
  s += R(790, 742, 200, 8, shade(p.wall, -0.2), 'rx="4"');
  s += R(790, 760, 140, 8, shade(p.wall, -0.12), 'rx="4"');
  // Light
  s += E(980, 120, 260, 160, p.light, 'opacity="0.45" filter="url(#glow)"');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">
${defs(p)}
${s}
<rect width="${W}" height="${H}" fill="url(#vignette)"/>
</svg>`;
}

/** Placeholder colours for blur-up (painted before the image arrives). */
export function placeholderFor(style) {
  const p = { ...DEFAULT_PALETTE, ...(style?.palette || {}) };
  return {
    color: shade(p.wall, -0.05),
    gradient: `linear-gradient(180deg, ${shade(p.wall, 0.05)} 0%, ${shade(p.wall, -0.06)} 58%, ${shade(p.floor, -0.05)} 62%, ${shade(p.floor, -0.12)} 100%)`,
  };
}

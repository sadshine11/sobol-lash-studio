import fs from 'node:fs/promises';
import sharp from 'sharp';
import { mulberry, fiber, lashPath } from './lash.mjs';

const OUT = '../assets/img';
await fs.mkdir(OUT, { recursive: true });

const C = {
  paper: '#F3ECE3', linen: '#E9DECF', sand: '#DCCBB6', taupe: '#A9937C',
  ink: '#1C1714', steel: '#7E8C8E', blush: '#E3CFC4',
};

const field = (w, h, r, tones) => {
  let defs = '', rects = '';
  tones.forEach((t, i) => {
    const cx = r() * 100, cy = r() * 100, rr = 45 + r() * 45;
    defs += `<radialGradient id="g${i}" cx="${cx.toFixed(1)}%" cy="${cy.toFixed(1)}%" r="${rr.toFixed(1)}%">
      <stop offset="0%" stop-color="${t}" stop-opacity="${(0.55 + r() * 0.4).toFixed(2)}"/>
      <stop offset="100%" stop-color="${t}" stop-opacity="0"/></radialGradient>`;
    rects += `<rect width="${w}" height="${h}" fill="url(#g${i})"/>`;
  });
  return { defs, rects };
};

const scenes = {
  // Macro crop of a lash line: fibres fanning off a sweeping lid curve.
  lashline(w, h, r) {
    const baseY = h * (0.58 + r() * 0.14);
    const amp = h * (0.06 + r() * 0.05);
    const n = 34 + Math.floor(r() * 14);
    const at = (t) => [w * (-0.05 + 1.1 * t), baseY + Math.sin(t * Math.PI) * -amp];
    let s = `<path d="M${at(0)} Q ${w * 0.5} ${baseY - amp * 2.1} ${at(1)}" fill="none" stroke="${C.ink}" stroke-opacity=".28" stroke-width="2.5"/>`;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const [x, y] = at(t);
      const lean = (t - 0.5) * 34;
      const len = h * (0.2 + 0.16 * Math.sin(t * Math.PI)) * (0.78 + r() * 0.44);
      s += `<path d="${fiber({ x, y, angle: -92 + lean + (r() - 0.5) * 9, len, curl: 0.4 + r() * 0.3, w: 5.5 + r() * 3 })}" fill="${C.ink}" fill-opacity="${(0.5 + r() * 0.34).toFixed(2)}"/>`;
    }
    return s;
  },
  // A hand-made fan, the way it sits in the tweezers before it is placed.
  fan(w, h, r, o = {}) {
    const cx = w * (0.4 + r() * 0.2), cy = h * (0.82);
    const n = o.fibers ?? 5 + Math.floor(r() * 4);
    const spread = o.fibers ? 16 + o.fibers * 9 : 46 + r() * 26;
    let s = '';
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      s += `<path d="${fiber({ x: cx, y: cy, angle: -90 - spread / 2 + spread * t, len: h * (0.52 + r() * 0.16), curl: 0.3, w: 9 })}" fill="${C.ink}" fill-opacity="${(0.62 + r() * 0.26).toFixed(2)}"/>`;
    }
    return s;
  },
  // The eye's upper curve, cropped tight.
  arc(w, h, r) {
    const cy = h * (0.66 + r() * 0.1);
    let s = `<path d="M${w * -0.02} ${cy} Q ${w * 0.5} ${cy - h * 0.34} ${w * 1.02} ${cy - h * 0.04}" fill="none" stroke="${C.ink}" stroke-opacity=".22" stroke-width="3"/>`;
    s += `<path d="M${w * -0.02} ${cy} Q ${w * 0.52} ${cy + h * 0.16} ${w * 1.02} ${cy - h * 0.04}" fill="none" stroke="${C.ink}" stroke-opacity=".14" stroke-width="2"/>`;
    const n = 26;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const u = 1 - t;
      const x = u * u * (w * -0.02) + 2 * u * t * (w * 0.5) + t * t * (w * 1.02);
      const y = u * u * cy + 2 * u * t * (cy - h * 0.34) + t * t * (cy - h * 0.04);
      s += `<path d="${fiber({ x, y, angle: -120 + t * 62, len: h * 0.2 * (0.8 + r() * 0.5), curl: 0.45, w: 6 })}" fill="${C.ink}" fill-opacity="${(0.45 + r() * 0.35).toFixed(2)}"/>`;
    }
    return s;
  },
  // A fan held in the tweezers — the working shot every lash artist knows.
  tools(w, h, r) {
    const tipX = w * 0.64, tipY = h * 0.44;
    const arm = (sign) => {
      const root = [w * -0.06, tipY + sign * h * 0.3];
      const ctrl = [w * 0.28, tipY + sign * h * 0.2];
      return lashPath(root, ctrl, [tipX, tipY], w * 0.028, 24);
    };
    let s = `<path d="${arm(-1)}" fill="${C.steel}" fill-opacity=".8"/><path d="${arm(1)}" fill="${C.steel}" fill-opacity=".62"/>`;
    for (let i = 0; i < 3; i++) {
      s += `<path d="${fiber({ x: tipX, y: tipY, angle: -54 + i * 22, len: w * 0.3, curl: 0.34, w: w * 0.007 })}" fill="${C.ink}" fill-opacity="${(0.7 + i * 0.08).toFixed(2)}"/>`;
    }
    return s;
  },
  soft() { return ''; },
};

async function make(name, w, h, kind, seed, opts = {}) {
  const r = mulberry(seed);
  const tones = opts.tones || [C.linen, C.sand, C.blush, C.taupe, C.paper];
  const { defs, rects } = field(w, h, r, tones);
  const art = scenes[kind](w, h, r, opts);
  const blur = opts.blur ?? 0;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>${defs}
      <radialGradient id="vig" cx="50%" cy="46%" r="72%">
        <stop offset="55%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#3A2E24" stop-opacity=".2"/></radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="${C.paper}"/>${rects}
    <g${blur ? ` filter="blur(${blur}px)"` : ''} opacity="${opts.artOpacity ?? 1}">${art}</g>
    <rect width="${w}" height="${h}" fill="url(#vig)"/></svg>`;

  let img = sharp(Buffer.from(svg), { density: 96 });
  if (opts.softBlur) img = img.blur(opts.softBlur);

  // Film grain, so the flat fills do not read as vector output.
  const px = w * h;
  const noise = Buffer.alloc(px * 4);
  for (let i = 0; i < px; i++) {
    const v = 90 + Math.floor(mulberry(seed * 7919 + i)() * 165);
    noise[i * 4] = v; noise[i * 4 + 1] = v; noise[i * 4 + 2] = v;
    noise[i * 4 + 3] = opts.grain ?? 13;
  }
  const buf = await img
    .composite([{ input: noise, raw: { width: w, height: h, channels: 4 } }])
    .webp({ quality: 80, effort: 5 })
    .toBuffer();
  await fs.writeFile(`${OUT}/${name}.webp`, buf);
  return buf.length;
}

const plan = [
  ['hero', 1400, 1750, 'lashline', 101, { softBlur: 1.2 }],
  ['effect-classic', 1200, 1500, 'lashline', 211, {}],
  ['effect-wet', 1200, 1500, 'arc', 212, {}],
  ['effect-15d', 1200, 1500, 'fan', 213, { fibers: 2 }],
  ['effect-2d', 1200, 1500, 'fan', 214, { fibers: 2 }],
  ['effect-3d', 1200, 1500, 'fan', 215, { fibers: 3 }],
  ['about', 1200, 1500, 'arc', 301, { softBlur: 0.8 }],
  ['studio-01', 1600, 1067, 'tools', 401, { softBlur: 1.6, tones: [C.linen, C.paper, C.sand, C.blush] }],
  ['studio-02', 1200, 900, 'soft', 402, { softBlur: 2.4, tones: [C.sand, C.linen, C.blush, C.paper] }],
  ['slots-bg', 1600, 900, 'lashline', 501, {}],
  ['diff-01', 900, 700, 'fan', 601, {}],
  ['diff-02', 900, 700, 'tools', 602, {}],
  ['diff-03', 900, 700, 'arc', 603, {}],
  ['og', 1200, 630, 'lashline', 901, { softBlur: 1 }],
];
const kinds = ['lashline', 'arc', 'fan', 'lashline', 'arc'];
for (let i = 1; i <= 13; i++) {
  const tall = i % 3 !== 0;
  plan.push([`work-${String(i).padStart(2, '0')}`, tall ? 1000 : 1400, tall ? 1250 : 933, kinds[i % kinds.length], 700 + i * 13, {}]);
}
for (let i = 1; i <= 3; i++) plan.push([`video-${String(i).padStart(2, '0')}-poster`, 720, 1280, kinds[i], 800 + i * 29, {}]);

let total = 0;
for (const [name, w, h, kind, seed, opts] of plan) {
  const n = await make(name, w, h, kind, seed, opts);
  total += n;
  process.stdout.write(`${name} ${(n / 1024).toFixed(0)}KB  `);
}
console.log(`\nfiles: ${plan.length}  total: ${(total / 1024 / 1024).toFixed(2)}MB`);

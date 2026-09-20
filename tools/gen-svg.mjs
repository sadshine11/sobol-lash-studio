import fs from 'node:fs';
import { fiber, lashPath } from './lash.mjs';

// 1. The fringe rule: a repeating tile used as the section divider.
const TW = 120, TH = 16;
let tile = '';
for (let i = 0; i < 8; i++) {
  const x = 4 + i * 15;
  tile += `<path d="${fiber({ x, y: TH, angle: -104 + i * 2.2, len: 9 + (i % 3) * 2.2, curl: 0.5, w: 1.7 })}"/>`;
}
const fringe = `<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${TH}" viewBox="0 0 ${TW} ${TH}"><g fill="%23231d18" fill-opacity=".5">${tile}</g><rect y="${TH - 1}" width="${TW}" height=".7" fill="%23231d18" fill-opacity=".22"/></svg>`;
fs.writeFileSync('fringe.txt', `url("data:image/svg+xml,${fringe.replace(/"/g, "'").replace(/</g, '%3C').replace(/>/g, '%3E').replace(/#/g, '%23')}")`);

// 2. The fan diagrams: one natural lash (steel) plus the fibres we attach to it.
const W = 260, H = 300;
const base = (x) => `<path d="M${x - 46} 262 Q ${x} 250 ${x + 46} 262" fill="none" stroke="currentColor" stroke-opacity=".2" stroke-width="1.6" stroke-linecap="round"/>`;
// Своя ресница короче и стоит под своим углом — иначе на схеме она
// сливается с наращённым волоском.
const natural = (x) => `<path class="dg-nat" d="${fiber({ x, y: 258, angle: -98, len: 96, curl: 0.55, w: 5.2 })}"/>`;

function bbox(svgBody) {
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  // Координаты идут парами x y внутри d="…" — числа берём по порядку.
  for (const d of svgBody.match(/ d="[^"]*"/g) || []) {
    const nums = d.split(/[^0-9.-]+/).filter((t) => t !== '' && t !== '-' && t !== '.').map(Number);
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const x = nums[i], y = nums[i + 1];
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  return { minX, maxX, minY, maxY };
}

function diagram(spec) {
  let g = '', idx = 0;
  for (const root of spec.roots) {
    g += base(root.x) + natural(root.x);
    const n = root.n;
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : i / (n - 1) - 0.5;
      const angle = -90 + t * root.spread;
      const d = fiber({ x: root.x, y: 258, angle, len: root.len ?? 132, curl: 0.42, w: 5.8 });
      g += `<path class="dg-ext" style="--i:${idx};--rot:${(-t * root.spread).toFixed(1)}deg;transform-origin:${root.x}px 258px" d="${d}"/>`;
      idx++;
    }
  }
  // Кадрируем по фактическим габаритам, иначе схема тонет в пустоте.
  const b = bbox(g), pad = 8;
  const vb = [(b.minX - pad).toFixed(0), (b.minY - pad).toFixed(0),
              (b.maxX - b.minX + pad * 2).toFixed(0), (b.maxY - b.minY + pad * 2).toFixed(0)].join(' ');
  return `<svg class="diagram" viewBox="${vb}" role="img" aria-label="${spec.alt}" focusable="false">${g}</svg>`;
}

const specs = {
  classic: { alt: 'Схема: один искусственный волосок на одну натуральную ресницу', roots: [{ x: 130, n: 1, spread: 0 }] },
  wet: { alt: 'Схема: два волоска, сомкнутых в тонкий пучок', roots: [{ x: 130, n: 2, spread: 9 }] },
  d15: { alt: 'Схема: чередование одного и двух волосков на соседних ресницах', roots: [{ x: 80, n: 1, spread: 0, len: 124 }, { x: 180, n: 2, spread: 30, len: 124 }] },
  d2: { alt: 'Схема: два волоска в веере на одной ресtnице', roots: [{ x: 130, n: 2, spread: 34 }] },
  d3: { alt: 'Схема: три волоска в веере на одной ресtnице', roots: [{ x: 130, n: 3, spread: 46 }] },
};
specs.d2.alt = 'Схема: два волоска в веере на одной натуральной реснице';
specs.d3.alt = 'Схема: три волоска в веере на одной натуральной реснице';

let out = '';
for (const [k, v] of Object.entries(specs)) out += `<!-- ${k} -->\n${diagram(v)}\n`;
fs.writeFileSync('diagrams.txt', out);
console.log('fringe bytes:', fs.statSync('fringe.txt').size, '| diagrams bytes:', out.length);

// Tapered lash geometry — shared by the raster placeholders and the inline fan
// diagrams in the effects catalogue, so both speak the same visual language.

export function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const qp = (p0, p1, p2, t) => {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
          u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
};
const qd = (p0, p1, p2, t) => {
  const u = 1 - t;
  return [2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]),
          2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1])];
};

// A lash is a quadratic spine whose width falls from `w` at the root to a point
// at the tip, so it reads as a real fibre instead of a uniform stroke.
export function lashPath(p0, p1, p2, w, steps = 18) {
  const L = [], R = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const [x, y] = qp(p0, p1, p2, t);
    const [dx, dy] = qd(p0, p1, p2, t);
    const len = Math.hypot(dx, dy) || 1;
    const half = (w * Math.pow(1 - t, 0.72)) / 2;
    const nx = (-dy / len) * half, ny = (dx / len) * half;
    L.push([x + nx, y + ny]);
    R.push([x - nx, y - ny]);
  }
  const f = (n) => n.toFixed(2);
  const pts = L.concat(R.reverse());
  return 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L') + 'Z';
}

// One fibre growing from (x, y) at `angle`, curling by `curl`.
export function fiber({ x, y, angle, len, curl = 0.42, w = 5 }) {
  const a = (angle * Math.PI) / 180;
  const tip = [x + Math.cos(a) * len, y + Math.sin(a) * len];
  const mid = [x + Math.cos(a) * len * 0.55, y + Math.sin(a) * len * 0.55];
  const na = a - Math.PI / 2;
  const ctrl = [mid[0] + Math.cos(na) * len * curl * 0.5, mid[1] + Math.sin(na) * len * curl * 0.5];
  return lashPath([x, y], ctrl, tip, w);
}

import fs from 'node:fs';
import sharp from 'sharp';
import { fiber } from './lash.mjs';

// Знак: веер из трёх волосков — тот же приём, что в схемах эффектов.
const S = 64;
let fans = '';
for (let i = 0; i < 3; i++) {
  fans += `<path d="${fiber({ x: 32, y: 54, angle: -112 + i * 22, len: 38, curl: 0.34, w: 4.4 })}" fill="#1C1714"/>`;
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
<rect width="${S}" height="${S}" rx="14" fill="#F3ECE3"/>
${fans}
<path d="M14 55 Q32 50 50 55" fill="none" stroke="#1C1714" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>
</svg>`;
fs.writeFileSync('../assets/favicon.svg', svg);

// Apple берёт PNG и сам скругляет — фон делаем сплошным, без прозрачности.
const solid = svg.replace(` rx="14"`, '');
await sharp(Buffer.from(solid)).resize(180, 180).png({ compressionLevel: 9 }).toFile('../assets/apple-touch-icon.png');
console.log('favicon.svg', fs.statSync('../assets/favicon.svg').size, 'B |',
            'apple-touch-icon.png', fs.statSync('../assets/apple-touch-icon.png').size, 'B');

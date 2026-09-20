import fs from 'node:fs/promises';
import subsetFont from 'subset-font';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const OUT = '../assets/fonts';
await fs.rm(OUT, { recursive: true, force: true });
await fs.mkdir(OUT, { recursive: true });
let chars = '';
for (let c = 0x20; c <= 0x7e; c++) chars += String.fromCodePoint(c);
for (let c = 0x401; c <= 0x451; c++) chars += String.fromCodePoint(c);
chars += '\u00a0\u2013\u2014\u2018\u2019\u201c\u201d\u00ab\u00bb\u2026\u00b7\u2192\u2605\u2713\u00d7\u2116\u20bd';
const RANGES = {
  cyrillic: 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116',
  latin: 'U+0000-00FF,U+2011,U+2013-2014,U+2018-2019,U+201C-201D,U+2026,U+2116,U+20BD,U+2192,U+2248,U+2605,U+2713',
};
const jobs = [
  { fam: 'Prata', q: 'Prata', slug: 'prata', weight: '400' },
  { fam: 'Golos Text', q: 'Golos+Text:wght@400..600', slug: 'golos', weight: '400 600' },
];
let css = '', total = 0;
for (const j of jobs) {
  const text = await (await fetch(`https://fonts.googleapis.com/css2?family=${j.q}&display=swap`, { headers: { 'User-Agent': UA } })).text();
  for (const b of text.split('/*').slice(1)) {
    const subset = b.slice(0, b.indexOf('*/')).trim();
    if (!RANGES[subset]) continue;
    const url = (b.match(/url\((https:[^)]+\.woff2)\)/) || [])[1];
    if (!url) continue;
    const src = Buffer.from(await (await fetch(url, { headers: { 'User-Agent': UA } })).arrayBuffer());
    const out = await subsetFont(src, chars, { targetFormat: 'woff2' });
    const name = `${j.slug}-${subset}.woff2`;
    await fs.writeFile(`${OUT}/${name}`, out);
    total += out.length;
    css += `@font-face{font-family:'${j.fam}';font-style:normal;font-weight:${j.weight};font-display:swap;src:url("assets/fonts/${name}") format("woff2");unicode-range:${RANGES[subset]}}\n`;
    console.log(name, (src.length/1024).toFixed(1) + ' -> ' + (out.length/1024).toFixed(1) + ' KB');
  }
}
await fs.writeFile('fontface.css', css);
console.log('TOTAL', (total/1024).toFixed(1) + ' KB');
console.log(css);

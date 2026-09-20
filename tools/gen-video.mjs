import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import ff from '@ffmpeg-installer/ffmpeg';

const OUT = '../assets/video';
await fs.mkdir(OUT, { recursive: true });
const FPS = 25, SEC = 7, D = FPS * SEC;

for (let i = 1; i <= 3; i++) {
  const id = String(i).padStart(2, '0');
  const src = `../assets/img/video-${id}-poster.webp`;
  const tmp = `tmp-${id}.png`;
  await sharp(src).resize(1440, 2560).png().toFile(tmp);
  // Ping-pong zoom so the loop has no visible seam, with a slow lateral drift.
  const vf = [
    `zoompan=z='1.10+0.085*sin(2*PI*on/${D})':x='iw/2-(iw/zoom/2)+${8 + i * 4}*sin(2*PI*on/${D})':y='ih/2-(ih/zoom/2)':d=${D}:s=720x1280:fps=${FPS}`,
    `format=yuv420p`,
  ].join(',');
  execFileSync(ff.path, ['-y', '-loglevel', 'error', '-loop', '1', '-i', tmp, '-vf', vf,
    '-frames:v', String(D), '-c:v', 'libx264', '-preset', 'slow', '-crf', '30',
    '-profile:v', 'main', '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart',
    `${OUT}/work-${id}.mp4`], { stdio: 'inherit' });
  await fs.unlink(tmp);
  const st = await fs.stat(`${OUT}/work-${id}.mp4`);
  console.log(`work-${id}.mp4`, (st.size / 1024).toFixed(0) + 'KB');
}

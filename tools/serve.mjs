import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const ROOT = process.cwd();
const T = { '.html':'text/html; charset=utf-8', '.webp':'image/webp', '.mp4':'video/mp4',
  '.woff2':'font/woff2', '.svg':'image/svg+xml', '.png':'image/png', '.js':'text/javascript', '.css':'text/css' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    return res.end('404 ' + p);
  }
  res.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(f).pipe(res);
}).listen(5173, () => console.log('http://localhost:5173'));

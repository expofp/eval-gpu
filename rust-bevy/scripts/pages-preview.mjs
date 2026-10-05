// A deliberately plain static file server: no asset rewrites, SPA fallback,
// precompressed-WASM negotiation, or exposure outside the generated web tree.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const owned = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.join(owned, '.pages-preview/public');
const mount = '/eval-gpu/rust-bevy/';
const destination = path.join(root, mount);
fs.mkdirSync(destination, { recursive: true });
fs.cpSync(path.join(owned, 'web'), destination, { recursive: true });
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.wasm': 'application/wasm', '.wgsl': 'text/plain', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  let url, pathname;
  try { url = new URL(req.url, 'http://localhost'); pathname = decodeURIComponent(url.pathname); }
  catch { res.writeHead(400).end(); return; }
  let file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep)) { res.writeHead(404).end(); return; }
  try {
    if (fs.statSync(file).isDirectory()) {
      if (!pathname.endsWith('/')) { res.writeHead(301, { Location: pathname + '/' + url.search }).end(); return; }
      file = path.join(file, 'index.html');
    }
    const stat = fs.statSync(file);
    if (!stat.isFile()) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Content-Length': stat.size, 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  } catch { res.writeHead(404).end('Not found'); }
});
server.listen(5184, '127.0.0.1', () => console.log('STATIC_READY http://127.0.0.1:5184' + mount));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(() => process.exit(0)));

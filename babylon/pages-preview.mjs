import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import fs from 'node:fs/promises';
const project = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(project, '.pages-preview');
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.wasm':'application/wasm', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png' };
export async function startPagesPreview() {
  await fs.mkdir(root, { recursive: true });
  const destination = path.join(root, 'eval-gpu/babylon');
  await fs.rm(destination, { recursive: true, force: true });
  await fs.cp(path.join(project, 'dist'), destination, { recursive: true });
  const server = http.createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      let target = path.resolve(root, '.' + pathname);
      if (!target.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
      const stat = await fs.stat(target);
      if (stat.isDirectory()) {
        if (!pathname.endsWith('/')) { res.writeHead(301, { Location: pathname + '/' + new URL(req.url,'http://localhost').search }).end(); return; }
        target = path.join(target, 'index.html');
      }
      res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control':'no-store' });
      res.end(await fs.readFile(target));
    } catch { res.writeHead(404, { 'Content-Type':'text/plain' }).end('Not found'); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(5181, '127.0.0.1', resolve); });
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await startPagesPreview();
  console.log('Static files only: http://127.0.0.1:5181/eval-gpu/babylon/');
}

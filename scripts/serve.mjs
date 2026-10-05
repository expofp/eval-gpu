import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const demos = [ ['babylon','Babylon.js',5171], ['three-webgpu','Three.js / TSL',5172], ['playcanvas','PlayCanvas',5173], ['rust-bevy','Rust / Bevy',5174] ];
const server = http.createServer(async (req,res) => {
  const requestUrl = new URL(req.url,'http://localhost');
  const path = requestUrl.pathname;
  const exhibition = requestUrl.searchParams.get('scene') === 'exhibition';
  res.setHeader('Cache-Control','no-store');
  try {
    if (path === '/api/demos') {
      const data = await Promise.all(demos.map(async ([id,stack,port]) => {
        let manifest = {};
        try { manifest = JSON.parse(await readFile(`${root}${id}/${exhibition ? "exhibition-manifest.json" : "demo-manifest.json"}`,'utf8')); } catch {}
        let running = false;
        try { const response = await fetch(`http://127.0.0.1:${port}/`,{signal:AbortSignal.timeout(1200)}); running = response.ok; } catch {}
        return {...manifest,id,stack:manifest.stack || stack,localUrl:`http://localhost:${port}/${exhibition ? "?scene=exhibition" : ""}`,running,scene:exhibition?"exhibition":"original"};
      }));
      res.setHeader('Content-Type','application/json'); res.end(JSON.stringify(data)); return;
    }
    const allowed = {'/':'index.html','/index.html':'index.html','/style.css':'style.css','/app.js':'app.js'};
    if(!allowed[path]) { res.writeHead(404); res.end('Not found'); return; }
    res.setHeader('Content-Type', path.endsWith('.css') ? 'text/css' : path.endsWith('.js') ? 'text/javascript' : 'text/html');
    res.end(await readFile(`${root}portal/${allowed[path]}`));
  } catch(error) { res.writeHead(500); res.end('Unable to load comparison page'); console.error(error); }
});
server.listen(Number(process.env.PORT || 5170),'0.0.0.0',()=>console.log('GPU Lab comparison: http://localhost:5170'));

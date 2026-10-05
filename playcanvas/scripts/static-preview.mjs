import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));
export const mountPath = '/eval-gpu/playcanvas/';
export const previewPort = 5183;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.wasm':'application/wasm'};
// Only the actual Vite distribution is exposed. No source, logs, repository files,
// dev transforms, SPA fallback, or assets from the domain root are available.
export async function startStaticPreview() {
  const dist=path.join(projectRoot,'dist');
  await fs.access(path.join(dist,'index.html'));
  const server=http.createServer(async(req,res)=>{
    let pathname;
    try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
    if(pathname===mountPath.slice(0,-1)){res.writeHead(301,{Location:mountPath}).end();return;}
    if(!pathname.startsWith(mountPath)){res.writeHead(404).end('Outside project mount');return;}
    const relative=pathname.slice(mountPath.length)||'index.html';
    const filename=path.resolve(dist,relative);
    if(!filename.startsWith(dist+path.sep)){res.writeHead(403).end();return;}
    try{
      const data=await fs.readFile(filename);
      res.writeHead(200,{'Content-Type':types[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-store'});
      res.end(req.method==='HEAD'?undefined:data);
    }catch{res.writeHead(404).end('Static file not found');}
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(previewPort,'127.0.0.1',resolve);});
  return server;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const server=await startStaticPreview();
  console.log(`Static dist only: http://127.0.0.1:${previewPort}${mountPath}`);
  for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>server.close(()=>process.exit(0)));
}

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const mount='/eval-gpu/three-webgpu/';
export async function startStaticPreview(port=5182){
  const folder=path.resolve(path.join(project,'.pages-preview',mount));
  await fs.mkdir(folder,{recursive:true});
  await fs.cp(path.join(project,'dist'),folder,{recursive:true});
  const requests=[];
  const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.wasm':'application/wasm'};
  const server=http.createServer(async(req,res)=>{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const item={path:pathname,status:0};requests.push(item);
    try{
      if(!pathname.startsWith(mount))throw new Error('Outside static mount');
      const suffix=pathname.slice(mount.length)||'index.html';
      const file=path.resolve(folder,suffix);
      if(!file.startsWith(folder+path.sep))throw new Error('Outside static mount');
      const bytes=await fs.readFile(file);
      item.status=200;res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(bytes);
    }catch{item.status=404;res.writeHead(404,{'content-type':'text/plain'});res.end('Static file not found');}
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
  return {server,requests,url:`http://127.0.0.1:${port}${mount}`};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const {url}=await startStaticPreview();console.log(`Strict nested static preview: ${url}`);
}

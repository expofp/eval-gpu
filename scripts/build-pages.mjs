import { cp, mkdir, readFile, rm, writeFile, access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const out = new URL('../_site/', import.meta.url);
const ids = ['babylon', 'three-webgpu', 'playcanvas', 'rust-bevy'];
function run(cmd,args,cwd) {
  return new Promise((resolve,reject)=>{
    const child=spawn(cmd,args,{cwd,stdio:'inherit'});
    child.on('error',reject);
    child.on('exit',code=>code===0?resolve():reject(Error(`${cmd} ${args.join(' ')} exited ${code}`)));
  });
}
if(!process.argv.includes('--assemble-only')) {
  for(const id of ids) await run('npm',['run','build'],root+id);
}
await rm(out,{recursive:true,force:true});
await mkdir(new URL('data/',out),{recursive:true});
for(const file of ['index.html','style.css','app.js']) {
  let source=await readFile(new URL('../portal/'+file,import.meta.url),'utf8');
  if(file==='index.html') source=source
    .replace('<head>','<head><meta name="gpu-lab-mode" content="static">')
    .replace('Local demos + temporary, unauthenticated HTTPS tunnels','Hosted on GitHub Pages · 8 interactive GPU scenes');
  await writeFile(new URL(file,out),source);
}
for(const id of ids) {
  const source=new URL('../'+id+(id==='rust-bevy'?'/web/':'/dist/'),import.meta.url);
  await access(new URL('index.html',source));
  await cp(source,new URL(id+'/',out),{recursive:true,filter:path=>!path.endsWith('.gz')&&!path.endsWith('.d.ts')});
}
for(const scene of ['original','exhibition']) {
  const data=await Promise.all(ids.map(async id=>{
    const filename=scene==='original'?'demo-manifest.json':'exhibition-manifest.json';
    const m=JSON.parse(await readFile(new URL('../'+id+'/'+filename,import.meta.url),'utf8'));
    return {id,title:m.title,stack:m.stack,backend:m.backend,techniques:m.techniques,
      limitations:m.limitations.filter(t=>!/tunnel|local processes/i.test(t)),
      defaultResolution:m.defaultResolution,defaultPeople:m.defaultPeople,maxPeople:m.maxPeople,
      href:'./'+id+'/'+(scene==='exhibition'?'?scene=exhibition':''),running:true,status:'available',scene};
  }));
  await writeFile(new URL('data/'+scene+'.json',out),JSON.stringify(data,null,2)+'\n');
}
await writeFile(new URL('.nojekyll',out),'');
console.log('Assembled GitHub Pages site in _site/');

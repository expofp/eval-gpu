import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../_site/',import.meta.url));
const html=await readFile(root+'index.html','utf8');
assert.match(html,/gpu-lab-mode" content="static/);
assert(!/(?:href|src)="\/(?!\/)/.test(html),'Portal links must work below project prefix');
for(const scene of ['original','exhibition']) {
  const items=JSON.parse(await readFile(root+'data/'+scene+'.json','utf8'));
  assert.equal(items.length,4);
  for(const d of items) {
    assert.equal(d.href,'./'+d.id+'/'+(scene==='exhibition'?'?scene=exhibition':''));
    const path=root+d.id+'/index.html';
    const body=await readFile(path,'utf8');
    assert(!/(?:href|src)="\/(?!\/)/.test(body),path+' has origin-root asset URLs');
    assert(d.defaultResolution,'Missing resolution policy for '+d.id);
  }
}
async function walk(dir) {
  for(const item of await readdir(dir,{withFileTypes:true})) {
    const path=dir+'/'+item.name;
    assert(!item.isSymbolicLink(),'Pages artifact cannot contain symbolic links');
    if(item.isDirectory())await walk(path);
    else assert((await stat(path)).size<100*1024*1024,'Unexpectedly large artifact: '+path);
  }
}
await walk(root);
const wasm=await readFile(root+'rust-bevy/pkg/lattice_bg.wasm');
assert.equal(wasm.subarray(0,4).toString('hex'),'0061736d');
console.log('Static catalog, nested-path HTML, artifact sizes, and WASM checks passed.');

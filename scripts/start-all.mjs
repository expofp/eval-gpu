import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const specs=[['portal',5170],['babylon',5171],['three-webgpu',5172],['playcanvas',5173],['rust-bevy',5174]];
const children=[];
for(const [id,port] of specs){
  try {const r=await fetch(`http://127.0.0.1:${port}/`,{signal:AbortSignal.timeout(800)});if(r.ok){console.log(`${id}: already running on ${port}`);continue;}}catch{}
  let command='node scripts/serve.mjs';
  if(id!=='portal') {
    try {const pkg=JSON.parse(await readFile(`${root}${id}/package.json`,'utf8'));command=pkg.scripts?.dev?'npm run dev':'npm start';}catch{command='npm run dev';}
  }
  const child=spawn(command,{cwd:id==='portal'?root:`${root}${id}`,shell:true,stdio:'inherit',detached:process.platform!=='win32'});
  children.push(child);child.on('exit',code=>{if(code)console.error(`${id} exited with code ${code}. See ${id}/README.md for setup.`);});
}
function stop(){for(const child of children){try{if(process.platform!=='win32')process.kill(-child.pid,'SIGTERM');else child.kill();}catch{}}process.exit();}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
console.log('Comparison: http://localhost:5170 — Ctrl+C stops only processes started by this command.');

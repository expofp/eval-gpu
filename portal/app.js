const staticHosting=document.querySelector('meta[name="gpu-lab-mode"]')?.content==='static';
const scene=new URLSearchParams(location.search).get('scene')==='original'?'original':'exhibition';
document.querySelector(`#${scene}-tab`).setAttribute('aria-current','page');
document.querySelector('#comparison-settings').hidden=scene!=='exhibition';
document.querySelector('#scene-caption').textContent=scene==='exhibition'?'Shared floor plan · native HiDPI at 100%':'Distinct scenes · native HiDPI at 100%';
const definitions = {
 'babylon': {color:'#d6ef9b', label:'BABYLON.JS',title:scene==='exhibition'?'Babylon exhibition':'Babylon laboratory',shape:'reactor'},
 'three-webgpu': {color:'#95d8ea', label:'THREE.JS / TSL',title:scene==='exhibition'?'Three.js exhibition':'Three.js laboratory',shape:'waves'},
 'playcanvas': {color:'#e9b392', label:'PLAYCANVAS',title:scene==='exhibition'?'PlayCanvas exhibition':'PlayCanvas laboratory',shape:'city'},
 'rust-bevy': {color:'#bcb0ed', label:'RUST / BEVY / WGPU',title:scene==='exhibition'?'Bevy exhibition':'Bevy laboratory',shape:'crystal'}
};
const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl = value => {if(typeof value!=='string'||!value)return null;try {const u=new URL(value,location.href);return ['http:','https:'].includes(u.protocol)?u.href:null;}catch{return null;}};
function art(shape){
 if(scene==='exhibition'){
  let booths='';
  for(const z of [-62,-24,24,62])for(const x of [-132,-84,-36,36,84,132])booths+=`<rect x="${x-14}" y="${z-12}" width="28" height="24" rx="2"/>`;
  return `<svg viewBox="0 0 600 220" aria-hidden="true"><g transform="translate(310 105) scale(1 .72) rotate(-18)" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".7"><rect x="-172" y="-94" width="344" height="188" rx="4"/><path d="M0 94V-94M-172 0H172" stroke-width="3" opacity=".65"/>${booths}<path d="M-196-116H196V116H-196ZM-225-116h-18v42h18zm450 0h18v42h-18z" opacity=".4"/><path d="M0 106v-105h82v-25" stroke-width="3"/><circle cx="82" cy="-26" r="5" fill="currentColor"/></g></svg>`;
 }
 let paths='';
 if(shape==='waves'){for(let i=0;i<19;i++){paths+=`<path d="M-20 ${65+i*8} Q100 ${-30+i*9} 225 ${75+i*6} T630 ${65+i*9}"/>`;}}
 if(shape==='reactor'){for(let i=0;i<9;i++){paths+=`<ellipse cx="320" cy="105" rx="${40+i*19}" ry="${15+i*7}" transform="rotate(-25 320 105)"/>`;}paths+='<path d="M320 0V220M80 190L470 15M185 210L530 50"/>';}
 if(shape==='city'){for(let i=0;i<18;i++){const x=75+i*27,h=30+(Math.sin(i*12)+1)*48;paths+=`<path d="M${x} 195v-${h}l15 -9 18 7v${h}M${x} ${195-h}l18 8v${h}M${x+18} ${203-h}l15 -10"/>`;}}
 if(shape==='crystal'){for(let i=0;i<6;i++){const x=130+i*62,y=15+(i%3)*25;paths+=`<path d="M${x} ${y}l-30 85 30 70 28-67zM${x} ${y}v155m-30-70 30 16 28-13"/>`;}}
 return `<svg viewBox="0 0 600 220" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1" opacity=".65">${paths}</g></svg>`;
}
function render(data){
 const local=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
 document.querySelector('#availability').textContent=staticHosting?'4 engines · 8 scenes':`${data.filter(d=>d.running).length} / 4 local engines running`;
 document.querySelector('#demos').innerHTML=data.map((d,i)=>{
 const def=definitions[d.id],url=safeUrl(d.href||(local?d.localUrl:d.publicUrl)),pub=safeUrl(d.publicUrl);
 const techniques=Array.isArray(d.techniques)?d.techniques:[],limitations=Array.isArray(d.limitations)?d.limitations:[];
 return `<article class="card" style="--accent:${def.color}"><div class="art"><span class="art-label">${def.label}</span><span class="index">0${i+1}</span>${art(def.shape)}</div><div class="content"><div class="meta"><span>${escape(d.stack)}</span><span class="status ${d.running?'':'off'}">${staticHosting?'● Available':!d.title?'◌ Building':d.status==='testing'?'◌ Testing':d.running?'● Running':'○ Offline'}</span></div><h3>${escape(d.title||def.title)}</h3><p class="backend">${escape(d.backend||'Implementation in progress')}</p><ul class="tags">${techniques.map(t=>`<li>${escape(t)}</li>`).join('')}</ul><p class="limits"><strong>Notes / </strong>${escape(limitations.map(t=>/[.!?]$/.test(t)?t:t+'.').join(' ')||'Technique and fallback details will appear when the demo is ready.')}</p><div class="links">${url?`<a class="primary" href="${escape(url)}" target="_blank" rel="noopener">Open demo <span>↗</span></a>`:'<span class="pending">Public tunnel pending</span>'}${!staticHosting&&local&&pub?`<a href="${escape(pub)}" target="_blank" rel="noopener">Public URL ↗</a>`:''}</div></div></article>`;
 }).join('');
}
let last='';async function refresh(){try{const res=await fetch(staticHosting?'./data/'+scene+'.json':'./api/demos?scene='+scene);if(!res.ok)throw Error();const data=await res.json();const next=JSON.stringify(data);if(next!==last){render(data);last=next;}}catch{document.querySelector('#availability').textContent='Unable to load demo catalog';}}
document.querySelector('#device').textContent=`Display DPR ${devicePixelRatio}× · ${navigator.gpu?'WebGPU API present':'WebGPU API unavailable'}`;
refresh();if(!staticHosting)setInterval(refresh,10000);

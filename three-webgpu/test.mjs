import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:false,args:['--no-first-run','--disable-background-timer-throttling']});
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});const errors=[];const results={};page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const stats=()=>page.evaluate(()=>window.__pelagic.getStats());
const load=async n=>{await page.locator('#complexity').fill(String(n));await page.waitForTimeout(1800);return stats();};
try{
await page.goto('http://127.0.0.1:5172');await page.waitForFunction(()=>window.__pelagic?.getStats().frame>30,{timeout:60000});await page.waitForTimeout(1500);results.default=await stats();await page.screenshot({path:'artifacts/default.png'});
results.low=await load(1);results.high=await load(100);assert.equal(results.high.particleCount,120000);assert.equal(results.high.objectCount,1800);assert.ok(results.high.triangles>results.low.triangles);await page.screenshot({path:'artifacts/high.png'});
await page.locator('#quality').selectOption('0.5');await page.waitForTimeout(500);results.manual=await stats();assert.equal(results.manual.scale,.5);
await page.locator('#quality').selectOption('auto');await load(35);await page.locator('#tour').uncheck();await page.locator('#motion').uncheck();
const before=await page.evaluate(()=>window.__pelagic.camera.position.toArray());await page.mouse.move(800,600);await page.mouse.down();await page.mouse.move(930,670,{steps:12});await page.mouse.up();await page.waitForTimeout(500);const after=await page.evaluate(()=>window.__pelagic.camera.position.toArray());assert.notDeepEqual(before,after);results.orbit=true;
await page.mouse.wheel(0,-200);await page.waitForTimeout(500);results.zoom=await page.evaluate(()=>window.__pelagic.camera.position.toArray());assert.notDeepEqual(after,results.zoom);
const oldTarget=await page.evaluate(()=>window.__pelagic.controls.target.toArray());await page.mouse.down({button:'right'});await page.mouse.move(860,620,{steps:8});await page.mouse.up({button:'right'});await page.waitForTimeout(500);assert.notDeepEqual(oldTarget,await page.evaluate(()=>window.__pelagic.controls.target.toArray()));results.pan=true;
await page.locator('#reset').click();await page.waitForTimeout(700);
const points=await page.evaluate(async()=>{const a=window.__pelagic;const pts=[];for(let i=0;i<a.satellites.count;i++){const m=a.satellites.matrix.clone();a.satellites.getMatrixAt(i,m);const v=a.camera.position.clone().setFromMatrixPosition(m).applyMatrix4(a.satellites.matrixWorld).project(a.camera);const x=(v.x+1)*innerWidth/2,y=(1-v.y)*innerHeight/2;if(x>460&&x<1100&&y>350&&y<900)pts.push({x,y});}return pts;});
for(const p of points.slice(0,30)){await page.mouse.click(p.x,p.y);if((await stats()).selected>=0)break;}assert.ok((await stats()).selected>=0);results.interaction=await page.locator('#selection').textContent();
await page.locator('#bloom').uncheck();await page.waitForTimeout(500);await page.locator('#bloom').check();await page.locator('#motion').check();results.controls=true;
await page.evaluate(()=>{window.__pressure=true;function pressure(){if(!window.__pressure)return;const end=performance.now()+45;while(performance.now()<end){}requestAnimationFrame(pressure);}requestAnimationFrame(pressure);});await page.waitForTimeout(8000);results.adaptiveUnderSyntheticMainThreadPressure=await stats();assert.ok(results.adaptiveUnderSyntheticMainThreadPressure.scale<1);await page.evaluate(()=>window.__pressure=false);
await page.setViewportSize({width:390,height:844});await page.waitForTimeout(700);await page.screenshot({path:'artifacts/mobile.png'});await page.setViewportSize({width:1440,height:1000});
await page.goto('http://127.0.0.1:5172/?webgl');await page.waitForFunction(()=>window.__pelagic?.getStats().frame>20,{timeout:60000});results.webgl=await stats();assert.equal(results.webgl.backend,'WebGL2');await load(100);await page.screenshot({path:'artifacts/webgl.png'});
results.errors=errors;assert.equal(errors.length,0);results.passed=true;
}finally{fs.writeFileSync('artifacts/test-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));await browser.close();}

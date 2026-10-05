import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { startPagesPreview } from './pages-preview.mjs';
const base = 'http://127.0.0.1:5181/eval-gpu/babylon/';
const server = await startPagesPreview();
let browser;
const evidence = { base, viewport: {width:1440,height:960,deviceScaleFactor:2}, responses:[], requestFailures:[], consoleErrors:[], pageErrors:[] };
await fs.mkdir('artifacts', { recursive:true });
function native(s) { assert.equal(s.width,2880); assert.equal(s.height,1920); assert.equal(s.canvasWidth,2880); assert.equal(s.canvasHeight,1920); assert.equal(s.scale,1); assert.equal(s.quality,'1'); }
try {
  const executablePath = process.env.CHROME_PATH || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined);
  browser = await chromium.launch({ ...(executablePath ? {executablePath} : {}), headless: process.env.HEADLESS === '1' });
  const page = await browser.newPage({viewport:{width:1440,height:960},deviceScaleFactor:2});
  page.on('console', m=>{if(m.type()==='error')evidence.consoleErrors.push(m.text());});
  page.on('pageerror', e=>evidence.pageErrors.push(e.message));
  page.on('requestfailed', r=>evidence.requestFailures.push({url:r.url(),error:r.failure()?.errorText}));
  page.on('response', r=>evidence.responses.push({url:r.url(),status:r.status()}));
  async function ready(kind) { await page.waitForFunction(k=>!!window[k],kind,{timeout:90000}); await page.waitForTimeout(700); }
  async function state(kind) { return page.evaluate(k=>{const app=window[k],c=document.querySelector('#render');return {...app.getState(),width:app.engine.getRenderWidth(),height:app.engine.getRenderHeight(),canvasWidth:c.width,canvasHeight:c.height,quality:document.querySelector('#quality').value,url:location.href};},kind); }
  await page.goto(base); await ready('__helios');
  evidence.original=await state('__helios');native(evidence.original);assert.equal(evidence.original.backend,'WebGPU');
  await page.screenshot({path:'artifacts/static-original.png',scale:'css'});
  await page.locator('#complexity').fill('100');await page.locator('#complexity').dispatchEvent('input');await page.waitForTimeout(700);
  evidence.originalMax=await state('__helios');native(evidence.originalMax);assert.equal(evidence.originalMax.count,24000);
  await page.locator('a').filter({hasText:'City exhibition'}).click();await ready('__expo');assert.equal(page.url(),base+'?scene=exhibition');
  evidence.exhibition=await state('__expo');native(evidence.exhibition);assert.equal(evidence.exhibition.backend,'WebGPU');assert.equal(evidence.exhibition.people,120);assert.equal(evidence.exhibition.night,false);
  await page.screenshot({path:'artifacts/static-exhibition-day.png',scale:'css'});
  await page.locator('.map-label').filter({hasText:/^03  LUMA$/}).click();evidence.labelRoute=(await state('__expo')).route;assert.equal(evidence.labelRoute.destination,'stand-3');
  await page.locator('#destinations').selectOption('cafe-0');evidence.facilityRoute=(await state('__expo')).route;assert.equal(evidence.facilityRoute.destination,'cafe-0');
  await page.locator('#night').click();await page.waitForTimeout(500);evidence.night=await state('__expo');assert.equal(evidence.night.night,true);native(evidence.night);
  await page.screenshot({path:'artifacts/static-exhibition-night.png',scale:'css'});
  await page.locator('#complexity').fill('100');await page.locator('#complexity').dispatchEvent('input');await page.waitForTimeout(1000);evidence.exhibitionMax=await state('__expo');native(evidence.exhibitionMax);assert.equal(evidence.exhibitionMax.people,1200);
  await page.locator('#quality').selectOption('.5');await page.waitForTimeout(300);evidence.half=await state('__expo');assert.equal(evidence.half.width,1440);assert.equal(evidence.half.height,960);await page.locator('#quality').selectOption('1');
  await page.locator('#map').click();assert.equal((await state('__expo')).topDown,true);await page.locator('#reset').click();assert.equal((await state('__expo')).topDown,false);
  await page.locator('a').filter({hasText:'Helios reactor'}).click();await ready('__helios');assert.equal(page.url(),base);native(await state('__helios'));
  await page.goto(base+'?scene=exhibition&webgl');await ready('__expo');evidence.exhibitionWebGL=await state('__expo');native(evidence.exhibitionWebGL);assert.equal(evidence.exhibitionWebGL.backend,'WebGL2');
  await page.goto(base+'?webgl');await ready('__helios');evidence.originalWebGL=await state('__helios');native(evidence.originalWebGL);assert.equal(evidence.originalWebGL.backend,'WebGL2');
  assert(evidence.responses.some(r=>r.url===base+'vendor/glslang/glslang.wasm'&&r.status===200));
  assert(evidence.responses.some(r=>r.url===base+'vendor/twgsl/twgsl.wasm'&&r.status===200));
  assert.deepEqual(evidence.responses.filter(r=>r.status>=400),[]);
  assert.deepEqual(evidence.responses.filter(r=>!r.url.startsWith(base)),[]);
  assert.deepEqual(evidence.requestFailures,[]);assert.deepEqual(evidence.consoleErrors,[]);assert.deepEqual(evidence.pageErrors,[]);
  evidence.status='passed';
} catch (e) { evidence.status='failed'; evidence.failure=e.stack;process.exitCode=1; }
finally { await fs.writeFile('artifacts/static-subpath-tests.json',JSON.stringify(evidence,null,2));await browser?.close();await new Promise(resolve=>server.close(resolve));console.log(JSON.stringify({status:evidence.status,failure:evidence.failure,requests:evidence.responses.length,requestFailures:evidence.requestFailures,consoleErrors:evidence.consoleErrors},null,2)); }

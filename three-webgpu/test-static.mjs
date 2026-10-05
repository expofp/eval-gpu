import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {startStaticPreview,mount} from './scripts/static-preview.mjs';
const output='artifacts/static-subpath';await fs.mkdir(output,{recursive:true});
const preview=await startStaticPreview();
const evidence={mount,viewport:{width:1440,height:960,deviceScaleFactor:2},errors:[],failedRequests:[],httpFailures:[],browserRequests:[],checks:{}};
let browser;
const fixed=s=>{assert.equal(s.width,2880);assert.equal(s.height,1920);assert.equal(s.scale,1);assert.equal(s.adaptive,false);assert.equal(s.nativeDpr,2);};
try{
  browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined),headless:process.env.HEADLESS==='1',args:['--no-first-run']});
  const page=await browser.newPage({viewport:{width:1440,height:960},deviceScaleFactor:2});
  page.on('request',r=>evidence.browserRequests.push(r.url()));
  page.on('pageerror',e=>evidence.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')evidence.errors.push(m.text());});
  page.on('requestfailed',r=>evidence.failedRequests.push({url:r.url(),error:r.failure()?.errorText}));
  page.on('response',r=>{if(r.status()>=400)evidence.httpFailures.push({url:r.url(),status:r.status()});});
  const expo=()=>page.evaluate(()=>window.__expo.getStats());
  const original=()=>page.evaluate(()=>window.__pelagic.getStats());
  await page.goto(preview.url);await page.waitForFunction(()=>window.__pelagic?.getStats().frame>15,null,{timeout:120000});
  evidence.checks.original=await original();fixed(evidence.checks.original);
  await page.locator('#complexity').fill('100');await page.waitForTimeout(500);evidence.checks.originalMax=await original();fixed(evidence.checks.originalMax);
  await page.screenshot({path:`${output}/original.png`});
  await page.locator('.scene-nav a').nth(1).click();await page.waitForFunction(()=>window.__expo?.getStats().frames>15,null,{timeout:120000});
  assert.equal(new URL(page.url()).pathname,mount);assert.equal(new URL(page.url()).search,'?scene=exhibition');
  evidence.checks.exhibition=await expo();fixed(evidence.checks.exhibition);assert.equal(evidence.checks.exhibition.peopleCount,120);assert.equal(evidence.checks.exhibition.night,false);
  await page.screenshot({path:`${output}/exhibition-day.png`});
  await page.locator('#night').check();await page.locator('#destination').selectOption('CAFE-N');await page.waitForTimeout(500);evidence.checks.nightRoute=await expo();assert.equal(evidence.checks.nightRoute.night,true);assert.equal(evidence.checks.nightRoute.selected,'CAFE-N');assert.ok(evidence.checks.nightRoute.routeDistance>0);
  await page.locator('#map').click();await page.waitForTimeout(350);
  const target=await page.evaluate(()=>{const e=window.__expo;const v=e.camera.position.clone().set(-9,.2,-8).project(e.camera);return {x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2};});
  await page.mouse.click(target.x,target.y);evidence.checks.picked=(await expo()).selected;assert.equal(evidence.checks.picked,'B09');await page.locator('#reset').click();
  await page.locator('#complexity').fill('100');await page.waitForTimeout(500);evidence.checks.exhibitionMax=await expo();fixed(evidence.checks.exhibitionMax);assert.equal(evidence.checks.exhibitionMax.peopleCount,1200);
  await page.screenshot({path:`${output}/exhibition-night-max.png`});
  await page.locator('#quality').selectOption('0.5');await page.waitForTimeout(200);evidence.checks.manualHalf=await expo();assert.equal(evidence.checks.manualHalf.width,1440);assert.equal(evidence.checks.manualHalf.height,960);await page.locator('#quality').selectOption('1');
  await page.locator('.switch a').first().click();await page.waitForFunction(()=>window.__pelagic?.getStats().frame>10,null,{timeout:120000});assert.equal(page.url(),preview.url);fixed(await original());evidence.checks.navigationBothDirections=true;
  // Direct query navigation must also load static files, with no SPA fallback server.
  await page.goto(preview.url+'?scene=exhibition&webgl');await page.waitForFunction(()=>window.__expo?.getStats().frames>10,null,{timeout:120000});evidence.checks.webgl=await expo();assert.equal(evidence.checks.webgl.backend,'WebGL2');fixed(evidence.checks.webgl);
  assert.deepEqual(evidence.errors,[]);assert.deepEqual(evidence.failedRequests,[]);assert.deepEqual(evidence.httpFailures,[]);
  assert.ok(preview.requests.length>5);assert.ok(evidence.browserRequests.every(url=>url.startsWith(preview.url)));assert.ok(preview.requests.filter(r=>r.path.startsWith(mount)).every(r=>r.status===200));
  evidence.passed=true;
}finally{
  if(browser)await browser.close();await new Promise(resolve=>preview.server.close(resolve));
  evidence.staticRequests=preview.requests;await fs.writeFile(`${output}/results.json`,JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence,null,2));
}

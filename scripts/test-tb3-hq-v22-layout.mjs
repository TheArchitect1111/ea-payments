import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const port=3231, url=process.env.TB3_PREVIEW_URL||`http://127.0.0.1:${port}/tarris/future`;
const out=process.env.TB3_EVIDENCE_DIR||'official_previews/tb3_hq_v2_2_local_20261005';
fs.mkdirSync(out,{recursive:true});let server,browser,logs='';const results=[];
const args=process.env.TB3_CHROMIUM_MODULE?(await import(process.env.TB3_CHROMIUM_MODULE)).default.args:['--no-sandbox'];
try {
  if(!process.env.TB3_PREVIEW_URL){server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p',String(port)],{stdio:['ignore','pipe','pipe']});server.stdout.on('data',d=>logs+=d);server.stderr.on('data',d=>logs+=d);for(let i=0;i<120&&!logs.includes('Ready in');i++){if(server.exitCode!==null)throw new Error(logs);await new Promise(r=>setTimeout(r,250));}}
  for(const width of [1440,375]){
    browser=await chromium.launch({executablePath:process.env.TB3_CHROMIUM_PATH||undefined,args,proxy:process.env.TB3_PREVIEW_URL&&process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined});
    const context=await browser.newContext({viewport:{width,height:900},timezoneId:'America/New_York',ignoreHTTPSErrors:true,acceptDownloads:true});
    const p=await context.newPage(), errors=[];p.on('pageerror',e=>errors.push(e.message));
    const r=await p.goto(url,{waitUntil:'networkidle',timeout:90000});assert.equal(r.status(),200);await p.locator('#eva-command-bar').waitFor();
    assert.deepEqual(await p.locator('#hq-nav a').allTextContents(),['Home','My Journey','Academics','Training','NIL & Brand','Opportunities','Community','Calendar','Media Library']);
    assert.equal(await p.locator('#asset-grid article').count(),16);assert.equal(await p.locator('#asset-grid img').count(),0);assert.equal(await p.locator('#asset-lightbox').count(),0);
    assert.equal(await p.locator('#calendar-module img').count(),0);assert.equal(await p.locator('#earnings-tracker img,#contracts-vault img').count(),0);assert.equal(await p.locator('#tb3-store img').count(),10);
    const storytelling=await p.locator('#my-journey-module img,#academics-module img,#training-module img,#nil-brand-module img,#opportunities-module img,#community-module img,#future-module img').evaluateAll(imgs=>imgs.map(i=>i.src));assert.equal(storytelling.length,15);assert.equal(new Set(storytelling).size,15);
    assert.equal(await p.locator('#training-3').evaluate(i=>getComputedStyle(i).objectPosition),'50% 15%');
    await p.evaluate(async()=>{const root=document.querySelector('#hq-scroll');for(let y=0;y<root.scrollHeight;y+=600){root.scrollTop=y;await new Promise(r=>setTimeout(r,35));}root.scrollTop=0;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});
    assert.deepEqual(await p.locator('img').evaluateAll(imgs=>imgs.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src)),[]);
    assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    if(width===1440){assert.equal(await p.locator('#eva-panel').isVisible(),true);const [main,panel]=await Promise.all([p.locator('main').boundingBox(),p.locator('#eva-panel').boundingBox()]);assert.ok(main.x+main.width<=panel.x+1);assert.equal(Math.round(panel.width),320);}
    else{assert.equal(await p.locator('#eva-panel').isVisible(),false);const fab=await p.locator('#eva-fab').boundingBox();assert.equal(Math.round(fab.width),56);assert.equal(Math.round(width-fab.x-fab.width),20);assert.equal(Math.round(900-fab.y-fab.height),20);await p.locator('#eva-fab').click();assert.equal(await p.locator('#eva-mobile-chat').isVisible(),true);await p.locator('#eva-mobile-chat').getByRole('button',{name:'Close',exact:true}).click();}
    const body=await p.locator('body').innerText();for(const f of ['85%','72%','60%','90%','Nike','Gatorade','Coach Williams','OFFICIAL_','.png'])assert.ok(!body.includes(f),f);
    await p.screenshot({path:path.join(out,`hq_v2_2_wired_${width}.png`)});
    await p.evaluate(()=>{const root=document.querySelector('#hq-scroll');root.style.height='auto';root.style.overflow='visible';});await p.screenshot({path:path.join(out,`hq_v2_2_wired_full_${width}.png`),fullPage:true});await p.evaluate(()=>{const root=document.querySelector('#hq-scroll');root.style.height='';root.style.overflow='';});
    for(const id of ['training-3','future-tunnel','opportunities-hero'])await p.locator('#'+id).screenshot({path:path.join(out,`${id}_${width}.png`)});
    await p.locator('#asset-search').fill('CABLE');assert.equal(await p.locator('#asset-grid article').count(),1);assert.equal(await p.locator('#asset-grid img').count(),0);await p.locator('#asset-search').fill('');await p.locator('#asset-filter').getByRole('button',{name:'Community 2',exact:true}).click();assert.equal(await p.locator('#asset-grid article').count(),2);await p.locator('#asset-filter').getByRole('button',{name:'All 16',exact:true}).click();
    await p.getByRole('button',{name:'View Asset: CABLE MACHINE',exact:true}).click();assert.equal(await p.locator('#asset-lightbox img').count(),1);await p.locator('#asset-lightbox img').evaluate(i=>i.decode());const [download]=await Promise.all([p.waitForEvent('download'),p.locator('#asset-lightbox').getByRole('link',{name:'Download HD'}).click()]);assert.equal(download.suggestedFilename(),'OFFICIAL_06_CABLE_MACHINE.png');
    await p.locator('#asset-lightbox').getByRole('button',{name:'Copy Link ⧉'}).click();assert.ok(await p.locator('#asset-lightbox [role=status]').innerText());await p.keyboard.press('Escape');assert.equal(await p.locator('#asset-lightbox').count(),0);assert.equal(await p.locator('#asset-grid img').count(),0);
    await p.locator('#training-module').getByRole('button',{name:'View Approved Assets'}).click();assert.equal(await p.locator('#asset-grid article').count(),4);await p.locator('#asset-filter').getByRole('button',{name:'All 16',exact:true}).click();
    await p.locator('#calendar-views').getByRole('button',{name:'Week',exact:true}).click();assert.equal(await p.locator('#calendar-grid > div').count(),7);await p.locator('#calendar-views').getByRole('button',{name:'Day',exact:true}).click();assert.equal(await p.locator('#calendar-grid > div').count(),1);await p.locator('#calendar-views').getByRole('button',{name:'Month',exact:true}).click();assert.equal(await p.locator('#calendar-grid > div').count(),42);
    await p.locator('#eva-command-bar input').fill('Track opportunity');await p.locator('#eva-command-bar button').click();assert.equal(await p.locator('#manual-opportunity-form').count(),1);await p.locator('#track-opportunity-modal').getByRole('button',{name:'Close',exact:true}).click();
    await p.goto(`http://127.0.0.1:${port}/tarris`,{waitUntil:'networkidle'});await p.locator('#book-tarris-sticky').click();assert.equal(await p.locator('#book-tarris-form').count(),1);await p.locator('#book-tarris-form').screenshot({path:path.join(out,`public_tarris_book_form_${width}.png`)});
    assert.equal((await p.request.get(`http://127.0.0.1:${port}/api/opportunities/list`)).status(),401);
    assert.deepEqual(errors,[]);results.push({width,status:'PASS',navigation:9,vaultPlaceholders:16,vaultImagesBeforeCTA:0,storytelling:15,checks:['layout/no-overlap','source framing','asset search/filter/lightbox/unload/download/copy feedback','calendar month/week/day','manual inquiry form','public booking form','unauthenticated private API denied','empty initial state/no fake data','no console errors']});console.log(`PASS HQ v2.2 layout / fail-closed access width ${width}`);await browser.close();browser=null;
  }
  fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({url,results,persistence:'database APIs implemented, live verification pending configuration and active membership',sharedBackend:'not yet verified',liveAi:'requires signed-in account'},null,2));
}finally{if(browser)await browser.close();if(server)server.kill('SIGTERM');}

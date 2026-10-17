import {chromium} from 'playwright';import fs from 'node:fs/promises';
const before='https://ea-payments-a3fr8nf0c-the-architects-projects-cc813778.vercel.app/amanda-catherine';
const after='https://ea-payments-np259bb4t-the-architects-projects-cc813778.vercel.app/amanda-catherine';
const dir='artifacts/amanda-v3-upgrade-14';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch();const results=[];const failures=[];
try{for(const width of [375,1440])for(const [phase,url] of [['before',before],['after',after]]){
const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,250))});
const r=await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});await page.locator('.ac-nav').waitFor();await page.keyboard.press('Tab');
const first=await page.evaluate(()=>({text:document.activeElement?.textContent?.trim(),href:document.activeElement?.getAttribute('href')}));
await page.screenshot({path:`${dir}/keyboard-first-${phase}-${width}.png`});
await page.keyboard.press('Enter');await page.waitForTimeout(500);
const skip=await page.evaluate(()=>({hash:location.hash,main:!!document.querySelector('main#main-content')}));
await page.keyboard.press('Tab');await page.keyboard.press('Tab');await page.screenshot({path:`${dir}/keyboard-focus-${phase}-${width}.png`});
const accessibility=await page.evaluate(()=>({imagesMissingAlt:[...document.images].filter(i=>!i.hasAttribute('alt')).length,mainCount:document.querySelectorAll('main').length,h1Count:document.querySelectorAll('h1').length,scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,cls:performance.getEntriesByType('layout-shift').filter(e=>!e.hadRecentInput).reduce((a,b)=>a+b.value,0)}));
if(phase==='after'&&(!first.href?.startsWith('#main-content')||!skip.main||accessibility.imagesMissingAlt||accessibility.scrollWidth>width+3))failures.push('Accessibility '+width+' '+JSON.stringify({first,skip,accessibility}));
if(phase==='after'&&errors.length)failures.push('Console '+width+' '+JSON.stringify(errors.slice(0,3)));
results.push({width,phase,http:r?.status(),first,skip,accessibility,consoleErrors:errors});
await page.close();
}}finally{await browser.close();}
await fs.writeFile(dir+'/keyboard-report.json',JSON.stringify({results,failures},null,2));console.log(JSON.stringify({failures,results}));if(failures.length)process.exitCode=1;
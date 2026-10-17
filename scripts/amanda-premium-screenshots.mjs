import { chromium, devices } from 'playwright';
import fs from 'node:fs/promises';
const before = process.env.AMANDA_BEFORE_URL || 'https://ea-payments-vvhojegic-the-architects-projects-cc813778.vercel.app/amanda-catherine';
const after = process.env.AMANDA_AFTER_URL || 'https://ea-payments-bgbxi5zh1-the-architects-projects-cc813778.vercel.app/amanda-catherine';
const targets = [{name:'desktop',width:1440,height:900},{name:'mobile',width:375,height:812}];
const out='docs/baseline-screenshots';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
try {
 for (const [version,base] of [['before',before],['after',after]]) {
  for (const viewport of targets) {
   const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:1});
   for(const [section,path] of [['home',''],['portal','/portal/amanda-catherine']]){
    const response=await page.goto(base.replace(/\/amanda-catherine$/,'')+(path || '/amanda-catherine'),{waitUntil:'domcontentloaded',timeout:45000});
    if(!response || response.status()>=400) throw new Error(`${version} ${viewport.name} ${section}: HTTP ${response?.status()}`);
    await page.evaluate(()=>document.fonts.ready);
    if(section==='home') await page.locator('nav').first().waitFor({state:'visible',timeout:20000});
    await page.screenshot({path:`${out}/${version}-${section}-${viewport.name}.png`,fullPage:true,animations:'disabled'});
    if(section==='home'){
      for(const part of ['nav','classes-grid','footer']){
       const loc=part==='nav'?page.locator('nav').first():part==='footer'?page.locator('footer').last():page.locator('#classes-grid, #classes').first();
       if(await loc.count()) {await loc.scrollIntoViewIfNeeded();await loc.screenshot({path:`${out}/${version}-${part}-${viewport.name}.png`,animations:'disabled'});}
       else throw new Error(`Missing ${part} in ${version} ${viewport.name}`);
      }
    }
   }
   await page.close();
  }
 }
}finally{await browser.close();}

import { chromium } from 'playwright';
import fs from 'node:fs/promises';
const base=process.env.AMANDA_AUDIT_URL||'https://ea-payments-bgbxi5zh1-the-architects-projects-cc813778.vercel.app';
const results=[];let failures=0;
const browser=await chromium.launch({headless:true});
for(const [view,width,height] of [['desktop',1440,900],['mobile',375,812]]){
 const page=await browser.newPage({viewport:{width,height}});
 const res=await page.goto(base+'/amanda-catherine',{waitUntil:'domcontentloaded',timeout:45000});
 await page.locator('.ac-hero h1').waitFor();
 await page.evaluate(async()=>{for(const image of document.images){if(image.loading==='lazy')image.loading='eager';}await Promise.all([...document.images].filter(i=>i.src.startsWith(location.origin)).map(i=>i.decode().catch(()=>null)));});
 const data=await page.evaluate(()=>{
 const hero=document.querySelector('.ac-hero'),img=document.querySelector('.ac-hero-media img'),heading=document.querySelector('.ac-hero h1'),primary=document.querySelector('.ac-hero .ac-btn-fill');
 const rect=x=>x?.getBoundingClientRect();const h=rect(hero),i=rect(img);
 const broken=[...document.images].filter(x=>(!x.complete||x.naturalWidth===0)&&x.src.startsWith(location.origin)).map(x=>x.src).slice(0,15);
 const overflow=[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&!e.closest('.ac-links')&&(r.left < -3 || r.right>innerWidth+3)}).slice(0,8).map(e=>e.tagName+'.'+String(e.className).slice(0,50));
 return {heroImageCoverage:!!(h&&i&&i.top<=h.top+2&&i.bottom>=h.bottom-2),headingFontSize:parseFloat(getComputedStyle(heading).fontSize),primaryHeight:rect(primary)?.height||0,broken,overflow,heroHeight:h?.height};
 });
 const checks={http:res?.status()===200,heroImageCoverage:data.heroImageCoverage,headingReadable:data.headingFontSize>=40,primaryTapTarget:data.primaryHeight>=44,imagesLoaded:data.broken.length===0,noHorizontalOverflow:data.overflow.length===0};
 failures+=Object.values(checks).filter(x=>!x).length;
 results.push({view,checks,details:data});await page.close();
}
await browser.close();
await fs.mkdir('artifacts/visual-quality',{recursive:true});
await fs.writeFile('artifacts/visual-quality/objective-checks.json',JSON.stringify({base,results,failures},null,2));
console.log(JSON.stringify({results,failures}));
if(failures)process.exitCode=1;

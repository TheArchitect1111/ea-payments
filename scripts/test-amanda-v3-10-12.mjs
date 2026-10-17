import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const before='https://ea-payments-50qklyy5l-the-architects-projects-cc813778.vercel.app';
const after='https://ea-payments-emkkwpum1-the-architects-projects-cc813778.vercel.app';
const out='artifacts/amanda-v3-10-12';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch();const results=[];const failures=[];
try{
for(const viewport of [{name:'desktop',width:1440,height:900},{name:'mobile',width:375,height:812}]){
for(const phase of ['before','after']){
const origin=phase==='before'?before:after;
const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height}});
const response=await page.goto(origin+'/amanda-catherine',{waitUntil:'domcontentloaded',timeout:60000});
await page.locator('.ac-hero .ac-btn').first().waitFor();
if(phase==='after'){
await page.locator('.ac-hero .ac-btn').first().hover();
await page.screenshot({path:`${out}/hover-${viewport.name}.png`});
await page.locator('.ac-nav [href="#learn"]').click();await page.waitForTimeout(700);
const anchor=await page.evaluate(()=>({hash:location.hash,top:document.getElementById('learn')?.getBoundingClientRect().top}));
if(anchor.hash!=='#learn'||Math.abs(anchor.top??10000)>240)failures.push('scroll '+viewport.name+' '+JSON.stringify(anchor));
await page.screenshot({path:`${out}/scroll-${viewport.name}.png`});
const reduced=await browser.newPage({viewport:{width:viewport.width,height:viewport.height},reducedMotion:'reduce'});
await reduced.goto(origin+'/amanda-catherine',{waitUntil:'domcontentloaded'});const motion=await reduced.locator('.ac-hero .ac-btn').first().evaluate(e=>({transition:getComputedStyle(e).transitionDuration,scroll:getComputedStyle(document.querySelector('.ac-site')).scrollBehavior}));
if(!motion.transition.split(',').every(v=>parseFloat(v)<=0.01))failures.push('reduced motion '+viewport.name+' '+JSON.stringify(motion));await reduced.close();
}
const formPath='/courses/advanced-body-sculpt#waitlist';
const form=await browser.newPage({viewport:{width:viewport.width,height:viewport.height}});
const formResponse=await form.goto(origin+formPath,{waitUntil:'domcontentloaded',timeout:45000});
await form.screenshot({path:`${out}/form-${phase}-${viewport.name}.png`});
const formPresent=await form.locator('#waitlist,form').count()>0;
if(phase==='after'&&(!formPresent||formResponse.status()!==200))failures.push('waitlist '+viewport.name);
await form.close();
for(const [name,next] of [['student','%2Fportal%2Famanda-catherine%2Flearning'],['owner','%2Fportal%2Famanda-catherine']]){
const login=await browser.newPage({viewport:{width:viewport.width,height:viewport.height}});
const loginResponse=await login.goto(origin+'/portal/login?next='+next,{waitUntil:'domcontentloaded',timeout:45000});
await login.locator('.pl-page-amanda').waitFor();
await login.screenshot({path:`${out}/login-${name}-${phase}-${viewport.name}.png`});
const branded=await login.locator('.pl-page-amanda .pl-header-amanda').count()===1;
if(phase==='after'&&(!branded||loginResponse.status()!==200))failures.push('login '+name+' '+viewport.name);
await login.close();}
results.push({phase,viewport:viewport.name,homeStatus:response.status(),waitlistStatus:formResponse.status(),waitlistForm:formPresent});
await page.close();
}}finally{await browser.close();}
const report={passed:failures.length===0,failures,results,scope:'presentation only; no form submitted, no payment attempted, no authenticated sign-in'};await fs.writeFile(out+'/test-log.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(failures.length)process.exitCode=1;

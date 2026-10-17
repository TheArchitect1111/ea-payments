import { chromium } from 'playwright';
import fs from 'node:fs/promises';
const base=process.env.AMANDA_TEST_BASE||'https://ea-payments-50qklyy5l-the-architects-projects-cc813778.vercel.app';
const dir='artifacts/amanda-v3-7-9';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true}),results=[];let failures=[];
try{
for(const cfg of [{name:'desktop',width:1440,height:900},{name:'mobile',width:375,height:812}]){
const page=await browser.newPage({viewport:{width:cfg.width,height:cfg.height}});
const response=await page.goto(base+'/amanda-catherine',{waitUntil:'domcontentloaded',timeout:60000});
await page.locator('#classes-grid .amanda-card').first().waitFor({timeout:30000});
await page.locator('#classes-grid').screenshot({path:`${dir}/classes-${cfg.name}.png`,animations:'disabled'});
await page.locator('#create .ac-update-offers').screenshot({path:`${dir}/supporting-create-${cfg.name}.png`,animations:'disabled'});
await page.locator('#client-proof').screenshot({path:`${dir}/verified-trust-${cfg.name}.png`,animations:'disabled'});
const classes=await page.locator('#classes-grid .amanda-card').evaluateAll(cards=>cards.map(c=>({title:c.querySelector('h2')?.textContent?.trim(),href:c.querySelector('a')?.getAttribute('href'),cta:c.querySelector('a')?.textContent?.trim(),courseKey:c.querySelector('a')?.getAttribute('data-course-key')})));
if(response.status()!==200)failures.push(cfg.name+' HTTP '+response.status());
if(!classes.length)failures.push(cfg.name+' no classes');
if(new Set(classes.map(c=>c.courseKey)).size!==classes.length)failures.push(cfg.name+' duplicate class keys');
for(const c of classes){if(!c.href)failures.push(cfg.name+' missing CTA href '+c.title);if(c.cta==='Join Waitlist'&&!/^\/courses\/.test(c.href||''))failures.push(cfg.name+' invalid waitlist '+c.title);if(c.cta==='Register'&&!/^https:\/\//.test(c.href||''))failures.push(cfg.name+' invalid checkout '+c.title);}
const checkout=classes.find(c=>c.cta==='Register');
if(checkout){const p=await browser.newPage();try{const response=await p.goto(checkout.href,{waitUntil:'domcontentloaded',timeout:40000});results.push({view:cfg.name,checkout:{courseKey:checkout.courseKey,origin:new URL(p.url()).origin,http:response?.status(),noPaymentSubmitted:true}})}catch(e){results.push({view:cfg.name,checkout:{courseKey:checkout.courseKey,error:String(e),noPaymentSubmitted:true}})}finally{await p.close();}} 
const waitlist=classes.find(c=>c.cta==='Join Waitlist');
if(waitlist){const p=await browser.newPage();const r=await p.goto(base+waitlist.href,{waitUntil:'domcontentloaded',timeout:40000});await p.waitForTimeout(800);const hasWaitlist=await p.locator('#waitlist,form').count()>0;if(!hasWaitlist)failures.push(cfg.name+' waitlist form not found '+waitlist.courseKey);results.push({view:cfg.name,waitlist:{courseKey:waitlist.courseKey,http:r?.status(),formPresent:hasWaitlist,noSubmission:true}});await p.close();}
results.push({view:cfg.name,http:response.status(),count:classes.length,classes,images:[`classes-${cfg.name}.png`,`supporting-create-${cfg.name}.png`,`verified-trust-${cfg.name}.png`]});await page.close();
}}finally{await browser.close();}
const report={pass:failures.length===0,failures,results};await fs.writeFile(`${dir}/test-log.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:report.pass,failures,results:results.map(r=>({view:r.view,count:r.count,checkout:r.checkout,waitlist:r.waitlist}))}));if(failures.length)process.exitCode=1;

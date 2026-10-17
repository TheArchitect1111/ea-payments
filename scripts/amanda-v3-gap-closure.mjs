import { chromium } from 'playwright';import fs from 'node:fs/promises';
const base='https://amanda-catherine-4-qx1ohawcv-the-architects-projects-cc813778.vercel.app';
const out='artifacts/amanda-gap-closure';await fs.mkdir(out,{recursive:true});const browser=await chromium.launch();const items=[],checks=[];
try{
const page=await browser.newPage({viewport:{width:1440,height:900}});await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:45000});
const links=await page.locator('a[href]').evaluateAll(els=>els.map(a=>({label:(a.textContent||'').trim().slice(0,85),href:a.getAttribute('href')})));
const seen=new Set();
for(const l of links){if(!l.href||seen.has(l.href))continue;seen.add(l.href);
let url;try{url=new URL(l.href,base+'/')}catch{items.push({...l,status:'invalid-url'});continue;}
if(['mailto:','tel:','javascript:'].includes(url.protocol)) {items.push({...l,status:'action-only'});continue}
if(l.href.startsWith('#')){items.push({...l,status:await page.locator('#'+l.href.slice(1)).count()>0?'anchor-ok':'anchor-missing'});continue}
let status='unverified',finalUrl=url.href;try{const ctx=await browser.newContext({ignoreHTTPSErrors:true});const p=await ctx.newPage();const res=await p.goto(url.href,{waitUntil:'domcontentloaded',timeout:12000});status=res?.status()??'no-response';finalUrl=p.url();await ctx.close()}catch(e){status='timeout-or-blocked'}items.push({...l,status,finalUrl});}
const classes=await page.locator('#classes-grid .amanda-card').evaluateAll(cards=>cards.map(c=>({title:c.querySelector('h2')?.textContent?.trim(),price:c.querySelectorAll('p')[1]?.textContent?.trim()||null,label:c.querySelector('a')?.textContent?.trim(),href:c.querySelector('a')?.getAttribute('href'),key:c.querySelector('a')?.getAttribute('data-course-key')})));
await fs.writeFile(out+'/cards.json',JSON.stringify(classes,null,2));
const sample=[classes.find(c=>/register|buy now/i.test(c.label||'')),classes.find(c=>/waitlist/i.test(c.label||'')),classes.find(c=>/request info/i.test(c.label||''))].filter(Boolean);
for(const c of sample){const context=await browser.newContext();const p=await context.newPage();const url=new URL(c.href,base);let response=null;try{response=await p.goto(url.href,{waitUntil:'domcontentloaded',timeout:15000})}catch{}await p.screenshot({path:out+'/cta-'+c.key+'.png'});checks.push({key:c.key,title:c.title,cta:c.label,price:c.price,configuredHref:c.href,landed:p.url(),status:response?.status()||'blocked',noCharge:true});await context.close();}
const jane='https://aesthetikine.janeapp.com/#/discipline/1/treatment/2';let jr='blocked';try{const p=await browser.newPage();const r=await p.goto(jane,{waitUntil:'domcontentloaded',timeout:15000});jr=r?.status()||'no-response';await p.close()}catch{}checks.push({name:'Jane',url:jane,status:jr,noBooking:true});
const preview='https://tb3.online';let sr='blocked';try{const p=await browser.newPage();const r=await p.goto(preview,{waitUntil:'domcontentloaded',timeout:15000});sr=r?.status()||'no-response';await p.close()}catch{}checks.push({name:'TB3 shared-client public smoke',url:preview,status:sr});
await page.close();
}finally{await browser.close();}
await fs.writeFile(out+'/nav-crawl.json',JSON.stringify({base,count:items.length,links:items,issues:items.filter(x=>typeof x.status==='number'&&x.status>=400||x.status==='anchor-missing'||x.status==='invalid-url'),notes:'Public Playwright checks, no form posts, no payment, no authentication'},null,2));
await fs.writeFile(out+'/routing.json',JSON.stringify(checks,null,2));
console.log(JSON.stringify({count:items.length,issues:items.filter(x=>typeof x.status==='number'&&x.status>=400||x.status==='anchor-missing'||x.status==='invalid-url'),checks}));

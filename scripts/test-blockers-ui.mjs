import { build } from 'esbuild';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const compiled=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import Calendar from './app/portal/[slug]/calendar/PortalCalendar';import People from './app/portal/[slug]/people/PeopleDirectory';import Discovery from './app/portal/[slug]/discovery/DiscoveryForm';const m=new URLSearchParams(location.search).get('module');createRoot(document.getElementById('root')).render(m==='calendar'?<Calendar slug="cert-ui" canWrite/>:m==='people'?<People slug="cert-ui"/>:<Discovery slug="cert-ui"/>);`,loader:'tsx',resolveDir:process.cwd()},bundle:true,write:false,platform:'browser',format:'iife',jsx:'automatic'});
const css=readFileSync('app/portal/[slug]/ea-portal.css','utf8');
const server=createServer((req,res)=>{if(req.url==='/bundle.js'){res.setHeader('content-type','text/javascript');res.end(compiled.outputFiles[0].text);}else{res.setHeader('content-type','text/html');res.end(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}\nbody{margin:0;padding:20px;background:#f8f9fb}*{box-sizing:border-box}label{display:block}input:not([type=checkbox]),select,textarea{display:block;max-width:100%;width:100%}.ep-module-card{max-width:1100px;margin:auto}fieldset{min-width:0}</style></head><body class="ep-workspace-shell"><div id="root"></div><script src="/bundle.js"></script></body></html>`);}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;
const browser=await chromium.launch({headless:true});const proof=[];mkdirSync('artifacts/blockers-ui',{recursive:true});
try{
 for(const module of ['calendar','people','discovery'])for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  const context=await browser.newContext({viewport});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/**',route=>{const path=new URL(route.request().url()).pathname;const method=route.request().method();let payload;
   if(path.includes('/calendar/events'))payload={ok:true,event:route.request().postDataJSON()};else if(path==='/api/portal/calendar')payload={configured:true,provider:'internal',events:[]};
   else if(path.endsWith('/people'))payload=method==='GET'?{people:[]}:{ok:true,created:true,person:{id:'fixture-person'}};
   else payload={ok:true,id:'fixture-discovery',analysis:{capacityScore:72},confirmationSent:true};
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
  });
  await page.goto(`http://127.0.0.1:${port}/?module=${module}`);await page.getByRole('button',{name:module==='calendar'?'Add event':module==='people'?'Add contact':'Save my assessment',exact:true}).waitFor();
  if(module==='calendar'){await page.getByLabel('Event title').fill('Calendar fixture');await page.getByLabel('Starts',{exact:true}).fill('2030-01-01T10:00');await page.getByLabel('Ends',{exact:true}).fill('2030-01-01T11:00');await page.getByRole('button',{name:'Add event',exact:true}).click();await page.getByRole('status').filter({hasText:'Event saved.'}).waitFor();}
  if(module==='people'){await page.getByLabel('Name',{exact:true}).fill('Contact fixture');await page.getByLabel('Email',{exact:true}).fill('student@example.com');await page.getByRole('button',{name:'Add contact',exact:true}).click();await page.getByRole('status').filter({hasText:'Contact saved.'}).waitFor();}
  if(module==='discovery'){await page.getByLabel('Your name',{exact:true}).fill('Student fixture');await page.getByRole('button',{name:'Save my assessment',exact:true}).click();await page.getByRole('status').filter({hasText:'Your assessment is saved.'}).waitFor();}
  assert.deepEqual(errors,[],module+' page errors');const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,module+' horizontal overflow');
  await page.screenshot({path:`artifacts/blockers-ui/${module}-${viewport.width}.png`,fullPage:true});proof.push({module,width:viewport.width,render:true,submit:true,overflow:false,pageErrors:0,scope:'Actual client component with isolated HTTP fixtures'});await context.close();
 }
 writeFileSync('artifacts/blockers-ui/proof.json',JSON.stringify({status:'PASS',proof},null,2)+'\n');console.log(JSON.stringify({status:'PASS',proof},null,2));
}finally{await browser.close();server.close();}

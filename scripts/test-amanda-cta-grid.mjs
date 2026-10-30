import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium, devices } from '@playwright/test';

let target=process.env.AMANDA_CTA_PREVIEW_URL;
if (!target && process.env.PR_NUMBER) {
  const response=await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/issues/${process.env.PR_NUMBER}/comments`,{headers:{Authorization:`Bearer ${process.env.GITHUB_TOKEN}`}});
  assert.ok(response.ok,'Cannot resolve PR preview');
  const comments=await response.json();
  for (const comment of comments.reverse()) {
    const match=comment.body.match(/\[Preview\]\((https:\/\/[^)]+)\)/);
    if (match) {target=match[1];break;}
  }
}
assert.ok(target,'PR preview URL is required');
const base=new URL(target).origin;
assert.ok(new URL(base).hostname.endsWith('.vercel.app'),'Preview host required');
// A preview can still be building when CI starts. Require the new grid before testing.
let ready=false;
for(let attempt=0;attempt<60;attempt++) {
  const response=await fetch(base+'/amanda-catherine');
  const html=await response.text();
  if(response.ok&&html.includes('id="classes-grid"')&&html.includes('data-cta-name="Register"')&&(!process.env.EXPECTED_SHA||html.includes('data-source-commit="'+process.env.EXPECTED_SHA+'"'))){ready=true;break;}
  await new Promise(resolve=>setTimeout(resolve,10000));
}
assert.ok(ready,'New preview grid did not become available');
const available=new Set(['wood-therapy','non-surgical-bbl','body-sculpt-certification','nervous-system-reset','clinical-fat-loss','strategy-call']);
const inquiry=new Set(['starter-kit']);
const browser=await chromium.launch();
const results=[];
fs.mkdirSync('artifacts/amanda-classes',{recursive:true});
try {
for(const [device,options] of [['desktop',{viewport:{width:1440,height:1000}}],['mobile',devices['iPhone 13']]]) {
 for(const route of ['/amanda-catherine']) {
  const context=await browser.newContext(options);
  const page=await context.newPage();
  let documentRequests=0;
  page.on('request',r=>{if(r.isNavigationRequest()&&r.frame()===page.mainFrame())documentRequests++;});
  await page.goto(base+route);
  await page.locator('#classes-grid article').first().waitFor();
  const nav=page.getByRole('navigation').getByRole('link',{name:'Classes',exact:true});
  assert.equal(await nav.getAttribute('href'),'#classes-grid');
  assert.equal(await nav.getAttribute('target'),null);
  await nav.hover();
  assert.equal(await page.locator('nav [data-course-key]').count(),0);
  const documentCount=documentRequests;
  const timeOrigin=await page.evaluate(()=>performance.timeOrigin);
  await nav.click();
  await page.waitForFunction(()=>location.hash==='#classes-grid');
  await page.waitForFunction(()=>Math.abs(document.getElementById('classes-grid').getBoundingClientRect().top-96)<5);
  assert.equal(new URL(page.url()).pathname,route);
  assert.equal(documentRequests,documentCount,'Classes triggered document navigation');
  assert.equal(await page.evaluate(()=>performance.timeOrigin),timeOrigin,'Classes reloaded document');
  assert.equal(context.pages().length,1,'Classes opened another tab');
  const cards=await page.locator('#classes-grid article').evaluateAll(nodes=>nodes.map(node=>({text:node.textContent,buttons:[...node.querySelectorAll('a,button')].map(a=>({label:a.textContent,key:a.getAttribute('data-course-key'),href:a.getAttribute('href')}))})));
  assert.equal(cards.length,12);
  assert.ok(await page.locator('#classes-grid h2').evaluateAll(nodes=>nodes.every(node=>{const size=parseFloat(getComputedStyle(node).fontSize);return size>=24&&size<=32;})),'Class headings must retain the responsive grid typography');
  assert.ok(await page.locator('#classes-grid article').evaluateAll(nodes=>nodes.every(node=>node.getBoundingClientRect().right<=innerWidth+1)),'Class card overflow');
  for(const card of cards){assert.equal(card.buttons.length,1);const key=card.buttons[0].key;assert.equal(card.buttons[0].label,available.has(key)?'Register':inquiry.has(key)?'Request Info':'Join Waitlist');}
  assert.equal(cards.filter(c=>c.buttons[0].label==='Register').length,6);
  assert.equal(cards.filter(c=>c.buttons[0].label==='Join Waitlist').length,5);
  assert.equal(cards.filter(c=>c.buttons[0].label==='Request Info').length,1);
  assert.ok(!(await page.locator('body').innerText()).includes('Buy Now'));
  for(const [key,price] of [['nervous-system-reset','$997'],['clinical-fat-loss','$1,497'],['90-day-package','$2,500'],['starter-kit','$499']])assert.ok(cards.find(c=>c.buttons[0].key===key)?.text.includes(price));
  await page.screenshot({path:`artifacts/amanda-classes/${device}-${route.includes('portal')?'portal':'home'}.png`,fullPage:true});
  await page.locator('#classes-grid [data-course-key="90-day-package"]').click();
  await page.getByRole('textbox',{name:'Email',exact:true}).waitFor();
  assert.ok(page.url().includes('/courses/starter-kit#waitlist'));
  results.push({device,route,cards:12,register:6,waitlist:5,inquiry:1,duplicateButtons:0,newTabs:0,documentReload:false,waitlistForm:'PASS'});
  await context.close();
 }
}
} finally {await browser.close();}
fs.writeFileSync('artifacts/amanda-classes/report.json',JSON.stringify({preview:base,source:process.env.EXPECTED_SHA,results},null,2));
console.log(JSON.stringify(results,null,2));
console.log('AMANDA CLASSES: desktop/mobile, same-page anchor, 12 cards, 6 Register + 5 Join Waitlist + 1 Request Info PASS');

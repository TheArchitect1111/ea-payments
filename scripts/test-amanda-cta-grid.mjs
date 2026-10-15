// Amanda preview grid regression gate. Run only against PR preview.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const walk = d => fs.readdirSync(d,{withFileTypes:true}).flatMap(e => {
 const f=path.join(d,e.name);
 if(e.isDirectory())return ['node_modules','.next','.git'].includes(e.name)?[]:walk(f);
 return /\.(tsx?|jsx?)$/.test(e.name)?[f]:[];
});
const files=[...walk('app'),...walk('lib'),...walk('components')];
const suspect=files.filter(f=>/amanda|course|class/i.test(f)).filter(f=>{
 const s=fs.readFileSync(f,'utf8');
 return /(?:availableClasses|buyNowClasses|isAmandaBuyNowClass)\s*(?:=|\()/i.test(s) ||
  /\[\s*['"]Wood Therapy['"]\s*,/i.test(s);
});
assert.deepEqual(suspect,[],'Hardcoded Amanda CTA availability policy: '+suspect.join(', '));
for(const p of ['components/amanda/AmandaClassesGrid.tsx','app/courses/[courseSlug]/page.tsx','app/amanda-catherine/courses/[courseSlug]/page.tsx']){
 assert.match(fs.readFileSync(p,'utf8'),/getCTA\(c(?:ourse)?\)/,'Missing shared getCTA: '+p);
}
const target=process.env.AMANDA_CTA_PREVIEW_URL;
assert.ok(target&&/^https:\/\/.test(target),'AMANDA_CTA_PREVIEW_URL required (PR preview only)');
assert.ok(!/^(?:www\.)?amandacatherine\.ca$/i.test(new URL(target).hostname),'Production URL forbidden');
assert.ok(process.env.AIRTABLE_API_KEY&&process.env.AIRTABLE_BASE_ID,'Airtable credentials required');
const token=process.env.AIRTABLE_API_KEY,base=process.env.AIRTABLE_BASE_ID;
assert.equal(base,'appv0YoLIMY45fmDA','Wrong Airtable base');
const airtableUrl=new URL('https://api.airtable.com/v0/'+base+'/tblHseQxOkv5kvzIt');
airtableUrl.searchParams.set('pageSize','100');
airtableUrl.searchParams.set('filterByFormula',"AND({Organization ID}='org_amanda-catherine',OR(LOWER({Record Type})='course',LOWER({Record Type})='service'))");
let all=[],offset;
do {
 if(offset)airtableUrl.searchParams.set('offset',offset);
 const r=await fetch(airtableUrl,{headers:{Authorization:'Bearer '+token}});
 assert.ok(r.ok,'Airtable fetch failed '+r.status);
 const j=await r.json();all.push(...j.records);offset=j.offset;
}while(offset);
const courses=all.map(r=>{const p=JSON.parse(r.fields['Payload JSON']||'{}');return {name:r.fields.Title,slug:p.slug||r.fields['Record Key'],status:String(p.status||'WAITLIST').toLowerCase(),visible:p.is_visible!==false,active:p.is_active!==false,test:p.isTest===true};}).filter(c=>c.visible&&c.active&&!c.test);
const response=await fetch(target,{redirect:'follow'});
assert.ok(response.ok,'Preview grid request failed '+response.status);
assert.ok(!/amandacatherine\.ca$/.test(new URL(response.url).hostname),'Redirected to production');
const html=await response.text();
const grid=html.match(/<div class="amanda-grid">([\s\S]*?)<\/div><\/section>/);
assert.ok(grid,'Could not isolate grid DOM');
const articles=[...grid[1].matchAll(/<article\b[^>]*class="amanda-card"[^>]*>([\s\S]*?)<\/article>/g)];
assert.equal(articles.length,courses.length,'Grid card count differs from Airtable');
assert.equal(articles.length,12,'Expected 12 class cards in grid');
let failures=0;
for(const course of courses){
 const article=articles.find(a=>a[1].includes('data-course-key="'+course.slug+'"'));
 assert.ok(article,'Missing card '+course.name);
 const ctas=[...article[1].matchAll(/data-cta-name="([^"]+)"/g)].map(m=>m[1]);
 const available=['wood-therapy','non-surgical-bbl','body-sculpt-certification','nervous-system-reset','clinical-fat-loss','strategy-call'];
 const expected=available.includes(course.slug)?'Register':'Join Waitlist';
 const pass=ctas.length===1&&ctas[0]===expected;
 console.log(JSON.stringify({class:course.name,status:course.status,buttons:ctas,count:ctas.length,result:pass?'PASS':'FAIL'}));
 if(!pass)failures++;
}
assert.equal(failures,0,failures+' CTA errors in PR preview grid');
console.log('AMANDA GRID CTA PASS: '+articles.length+' cards, 0 duplicate CTAs');

import 'server-only';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { refreshPortalKnowledge, type WatchStore } from '../src/bricks/eva-portal-help/watcher';
import { clearLivePortalKnowledge, health, knowledge, loadPortalKnowledge } from '../src/bricks/eva-portal-help/manifest-loader';
import { guideOneStep } from '../src/bricks/eva-portal-help/guide';

process.env.EVA_WATCHER_TEST_MODE='1';
process.env.VERCEL_GIT_COMMIT_REF='feature/eva-portal-help-brick-20261018';
const blobs = new Map<string,string>();
const store:WatchStore = {
  read: async key => blobs.get(key) || null,
  write: async(key,body,overwrite) => {
    if (!overwrite && blobs.has(key)) throw Error('Overwrite forbidden');
    blobs.set(key,body);
  }
};
const baseline = {
 'amanda-catherine': JSON.parse(readFileSync('knowledge/eva-amanda-manifest.json','utf8')),
 'tb3': JSON.parse(readFileSync('knowledge/eva-tb3-manifest.json','utf8')),
};
const sources:Record<string,any> = structuredClone(baseline);
let clock=0;
const now=()=>new Date(Date.UTC(2026,9,18,2,0,clock++)).toISOString();
const deps = {
 store, now,
 readSource:async(url:string)=>{
  const name=url.includes('eva-amanda-manifest.json')?'amanda-catherine':'tb3';
  return JSON.stringify(sources[name]);
 }
};
const checks:any[]=[];
for(const tenant of ['amanda-catherine','tb3'] as const){
 const result=await refreshPortalKnowledge(tenant,deps);
 assert.equal(result.ok,true);
 assert.equal(result.changed,false);
 assert.ok(result.backupPath);
 assert.ok(result.logPath);
 assert.equal(health(tenant).status,200);
 checks.push({tenant,kind:'initialise',entryCount:result.entryCount,pass:true});
}
const a=loadPortalKnowledge('amanda-catherine').entries.find(x=>x.group==='publicCourseCatalog'&&x.href&&x.steps.length);
assert.ok(a);
const aItem=sources['amanda-catherine'].menus[a!.group][Number(a!.key.split(':')[1])];
const aOld=aItem.label||aItem.title||aItem.button;
assert.ok(aOld);
aItem.label='Verified Amanda Enrollment Menu';
aItem.steps=['Open Amanda learning catalog.','Select "Verified Amanda Enrollment Menu".'];
const aRefresh=await refreshPortalKnowledge('amanda-catherine',deps);
assert.equal(aRefresh.changed,true);
assert.equal(aRefresh.entryCount,207);
const aAnswer=await guideOneStep({portalId:'amanda-catherine',role:'student',question:'Verified Amanda Enrollment Menu'});
assert.equal(aAnswer.status,'guided');
assert.equal(aAnswer.label,'Verified Amanda Enrollment Menu');
assert.equal(aAnswer.stepNumber,1);
assert.ok(aAnswer.link?.startsWith('https://amandacatherine.ca/'));
assert.equal(knowledge('amanda-catherine').lastRefreshTime,aRefresh.lastRefreshTime);
checks.push({tenant:'amanda-catherine',kind:'changed-label',pass:true,answer:aAnswer.label});

const originalAmandaTime=knowledge('amanda-catherine').lastRefreshTime;
const tb3Source=sources.tb3.menus.hqTraining[0];
assert.ok(tb3Source.label&&tb3Source.href);
tb3Source.label='Verified TB3 Training Daily Plan';
tb3Source.steps=['Open TB3 HQ Training.','Select "Verified TB3 Training Daily Plan".'];
const tb3Refresh=await refreshPortalKnowledge('tb3',deps);
assert.equal(tb3Refresh.changed,true);
assert.equal(tb3Refresh.entryCount,85);
const tb3Answer=await guideOneStep({portalId:'tb3',role:'athlete',question:'Verified TB3 Training Daily Plan'});
assert.equal(tb3Answer.status,'guided');
assert.equal(tb3Answer.label,'Verified TB3 Training Daily Plan');
assert.ok(tb3Answer.link?.startsWith('https://tb3.online/'));
const tb3Fan=await guideOneStep({portalId:'tb3',role:'fan',question:'Verified TB3 Training Daily Plan'},async()=>{});
assert.equal(tb3Fan.status,'unanswered');
assert.equal(knowledge('amanda-catherine').lastRefreshTime,originalAmandaTime);
assert.equal(loadPortalKnowledge('amanda-catherine').entries.some(e=>e.label.includes('Verified TB3')),false);
assert.equal(loadPortalKnowledge('tb3').entries.some(e=>e.label.includes('Verified Amanda')),false);
checks.push({tenant:'tb3',kind:'changed-label-with-isolation',pass:true,answer:tb3Answer.label});
const noChange=await refreshPortalKnowledge('tb3',deps);
assert.equal(noChange.changed,false);
assert.equal(noChange.lastRefreshTime,tb3Refresh.lastRefreshTime);
const events=[...blobs.entries()].filter(([key])=>key.includes('/refresh-logs/'));
const backups=[...blobs.entries()].filter(([key])=>key.includes('/backups/'));
assert.equal(events.length,5);
assert.equal(backups.length,4);
assert.ok(events.every(([,val])=>JSON.parse(val).type==='eva.portal-help.refresh'));
assert.ok(backups.every(([key,val])=>!!key&&!!JSON.parse(val).manifest));
clearLivePortalKnowledge('amanda-catherine');
clearLivePortalKnowledge('tb3');
assert.equal(knowledge('amanda-catherine').entryCount,207);
assert.equal(knowledge('tb3').entryCount,85);
console.log(JSON.stringify({status:'PASS',checks,refreshEvents:events.length,backups:backups.length,
  health:{amanda:health('amanda-catherine'),tb3:health('tb3')},
  sourceUpdatesPropagated:2,tenantIsolation:'PASS',unmodifiedBundledManifests:true,privateBlobAdapter:'in-memory-test-double-not-live-storage'},null,2));

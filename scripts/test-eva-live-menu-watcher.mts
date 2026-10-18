import 'server-only';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {refreshPortalKnowledge,parseLiveNavigation,type LiveMenuItem,type LiveMenuSource,type WatchStore} from '../src/bricks/eva-portal-help/watcher';
import {clearLivePortalKnowledge,health,knowledge,loadPortalKnowledge} from '../src/bricks/eva-portal-help/manifest-loader';
import {guideOneStep} from '../src/bricks/eva-portal-help/guide';

process.env.EVA_WATCHER_TEST_MODE='1';
process.env.VERCEL_GIT_COMMIT_REF='feature/eva-portal-help-brick-20261018';
const configs={
 'amanda-catherine':JSON.parse(readFileSync('knowledge/eva-menu-sources/amanda-owner.json','utf8')),
 'tb3':JSON.parse(readFileSync('knowledge/eva-menu-sources/tb3-hq.json','utf8'))
} as Record<string,{items:LiveMenuItem[]}>;
const html={
 'amanda-catherine':'<nav class="ac-nav" aria-label="Amanda Catherine"><a href="#top">Amanda Catherine</a><a href="#restore">Restore</a><a href="#learn">Learn</a><a href="#create">Create</a><a href="#classes-grid">Classes</a><a href="/amanda/eva">Eva</a></nav>',
 'tb3':'<nav id="public" aria-label="Public navigation"><a href="#home">HOME</a><a href="#athlete">ATHLETE</a><a href="#story">STORY</a><a href="#brand">BRAND</a><a href="#nil">NIL</a><a href="#community">COMMUNITY</a><a href="#media">MEDIA</a><a href="#merch">MERCH</a><a href="#future">FUTURE</a></nav>'
};
const storeData=new Map<string,string>();
const store:WatchStore={
 read:async path=>storeData.get(path)||null,
 write:async(path,body,overwrite)=>{if(!overwrite&&storeData.has(path))throw Error('Unexpected overwrite');storeData.set(path,body);}
};
let tick=0;
const now=()=>new Date(Date.UTC(2026,9,18,3,0,tick++)).toISOString();
const events:any[]=[];
const readLiveSource=async(source:LiveMenuSource,conf:{origin:string}):Promise<LiveMenuItem[]>=>{
  const tenant=source.file?.includes('amanda')||conf.origin.includes('amandacatherine')?'amanda-catherine':'tb3';
  if(source.kind==='app-config')return structuredClone(configs[tenant].items);
  return parseLiveNavigation(html[tenant as keyof typeof html],source);
};
async function refresh(portalId:string){
 const result=await refreshPortalKnowledge(portalId,{store,now,mode:'live',readLiveSource});
 assert.equal(result.ok,true);
 assert.equal(result.mode,'live');
 assert.ok(result.logPath && storeData.get(result.logPath));
 events.push(JSON.parse(storeData.get(result.logPath)!));
 return result;
}
const originalAmanda=loadPortalKnowledge('amanda-catherine').entries.length;
const originalTB3=loadPortalKnowledge('tb3').entries.length;
const aInitial=await refresh('amanda-catherine');
const tInitial=await refresh('tb3');
assert.equal(health('amanda-catherine').status,200);
assert.equal(health('tb3').status,200);
const firstAmandaCount=aInitial.entryCount,firstTb3Count=tInitial.entryCount;
const tb3InitialTimestamp=knowledge('tb3').lastRefreshTime;
const amandaNav={label:'Preview Solstice Care Toolkit',href:'/portal/amanda-catherine/owner/preview-solstice'};
configs['amanda-catherine'].items.push(amandaNav);
const aAdded=await refresh('amanda-catherine');
assert.equal(aAdded.entryCount,firstAmandaCount+1);
assert.equal(aAdded.changed,true);
assert.equal(aAdded.changedItemsCount,1);
assert.equal(events.at(-1).diff[0].operation,'added');
const aAnswer=await guideOneStep({portalId:'amanda-catherine',role:'owner',question:amandaNav.label});
assert.equal(aAnswer.status,'guided');
assert.equal(aAnswer.label,amandaNav.label);
assert.equal(aAnswer.stepNumber,1);
assert.ok(aAnswer.link?.includes('amandacatherine.ca/portal/'));
assert.equal(knowledge('amanda-catherine').lastRefreshTime,aAdded.lastRefreshTime);
assert.equal(knowledge('tb3').lastRefreshTime,tb3InitialTimestamp);
const privateAttempt=await guideOneStep({portalId:'amanda-catherine',role:'student',question:amandaNav.label},async()=>{});
assert.equal(privateAttempt.status,'unanswered');
configs['amanda-catherine'].items.pop();
const aRemoved=await refresh('amanda-catherine');
assert.equal(aRemoved.entryCount,firstAmandaCount);
assert.equal(aRemoved.changedItemsCount,1);
assert.equal(events.at(-1).diff[0].operation,'removed');
const aMissing=await guideOneStep({portalId:'amanda-catherine',role:'owner',question:amandaNav.label},async()=>{});
assert.equal(aMissing.status,'unanswered');
const amandaTimestamp=knowledge('amanda-catherine').lastRefreshTime;
const tb3Nav={label:'Preview Solstice Film Toolkit',href:'/tarris/future#preview-solstice-film'};
configs.tb3.items.push(tb3Nav);
const tAdded=await refresh('tb3');
assert.equal(tAdded.entryCount,firstTb3Count+1);
assert.equal(tAdded.changedItemsCount,1);
assert.equal(events.at(-1).diff[0].operation,'added');
const tAnswer=await guideOneStep({portalId:'tb3',role:'athlete',question:tb3Nav.label});
assert.equal(tAnswer.status,'guided');
assert.equal(tAnswer.label,tb3Nav.label);
assert.ok(tAnswer.link?.includes('tb3.online/tarris/'));
const fanAttempt=await guideOneStep({portalId:'tb3',role:'fan',question:tb3Nav.label},async()=>{});
assert.equal(fanAttempt.status,'unanswered');
assert.equal(knowledge('amanda-catherine').lastRefreshTime,amandaTimestamp);
configs.tb3.items.pop();
const tRemoved=await refresh('tb3');
assert.equal(tRemoved.entryCount,firstTb3Count);
assert.equal(tRemoved.changedItemsCount,1);
assert.equal(events.at(-1).diff[0].operation,'removed');
const tMissing=await guideOneStep({portalId:'tb3',role:'athlete',question:tb3Nav.label},async()=>{});
assert.equal(tMissing.status,'unanswered');
const crossOne=await guideOneStep({portalId:'tb3',role:'athlete',question:amandaNav.label},async()=>{});
const crossTwo=await guideOneStep({portalId:'amanda-catherine',role:'owner',question:tb3Nav.label},async()=>{});
assert.equal(crossOne.status,'unanswered');
assert.equal(crossTwo.status,'unanswered');
const backupKeys=[...storeData.keys()].filter(x=>x.includes('/backups/'));
assert.equal(backupKeys.length,6);
assert.equal(events.length,6);
assert.ok(events.every(x=>x.mode==='live'&&Array.isArray(x.diff)));
const sample=parseLiveNavigation('<nav aria-label="Example"><a href="#one">One &amp; Done</a></nav>',{kind:'html-nav',group:'sample',ariaLabel:'Example',hrefPrefix:'/test',roles:['fan']});
assert.deepEqual(sample,[{label:'One & Done',href:'/test#one',section:'sample',roles:['fan']}]);
clearLivePortalKnowledge('amanda-catherine');
clearLivePortalKnowledge('tb3');
assert.equal(knowledge('amanda-catherine').entryCount,originalAmanda);
assert.equal(knowledge('tb3').entryCount,originalTB3);
console.log(JSON.stringify({status:'PASS',mode:'live',initialCounts:{amanda:firstAmandaCount,tb3:firstTb3Count},
 changedChecks:{amandaAdded:aAdded.changedItemsCount,amandaRemoved:aRemoved.changedItemsCount,tb3Added:tAdded.changedItemsCount,tb3Removed:tRemoved.changedItemsCount},
 verifiedGuidance:[aAnswer.label,tAnswer.label],verifiedRemoval:true,privateRoleIsolation:'PASS',
 crossTenantIsolation:'2/2',refreshLogs:events.length,backups:backupKeys.length,
 storage:'in-memory test double, not live private Blob',previewHttp:'not covered by fixture'},null,2));

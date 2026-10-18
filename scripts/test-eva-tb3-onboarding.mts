import assert from 'node:assert/strict';
import { health, knowledge, loadPortalKnowledge } from '../src/bricks/eva-portal-help/manifest-loader';
import { guideOneStep } from '../src/bricks/eva-portal-help/guide';
import { canReadEntry, normalizeGuideRole } from '../src/bricks/eva-portal-help/roles';

const amanda = loadPortalKnowledge('amanda-catherine');
const tb3 = loadPortalKnowledge('tb3');
assert.equal(health('amanda-catherine').status, 200);
assert.equal(health('tb3').status, 200);
assert.equal(knowledge('amanda-catherine').entryCount, 207);
assert.equal(knowledge('tb3').entryCount, 85);
assert.deepEqual((amanda.manifest as any).roles.map((r:any)=>r.id), ['student','admin','owner']);
assert.deepEqual((tb3.manifest as any).roles.map((r:any)=>r.id), ['fan','athlete','admin','family']);
const events: any[] = [];
const writer = async (event:any) => { events.push(event); };

const cases = [
  ['NIL partnership criteria','athlete'],
  ['Training weekly plan','athlete'],
  ['Media Library filter Film','athlete'],
  ['SHOP TB3','fan'],
  ['BOOK TARRIS / PARTNER WITH TB3 FORM','fan'],
  ['Opportunity pipeline','athlete'],
  ['Community impact metrics','athlete'],
  ['Calendar Month Week Day','athlete'],
  ['Media Library download HD','athlete'],
  ['NIL public partnership request','athlete'],
] as const;
const results = [];
for (const [question,role] of cases) {
  const response=await guideOneStep({portalId:'tb3',role,question},writer);
  assert.equal(response.portalId,'tb3');
  assert.ok(['guided','unanswered'].includes(response.status));
  if (response.status==='guided') {
    assert.equal(response.stepNumber,1);
    assert.ok(response.step?.length);
    assert.ok(response.link?.startsWith('https://tb3.online/'));
    assert.ok(!JSON.stringify(response).toLowerCase().includes('amandacatherine'));
    if (response.nextStepIndex != null) {
      const follow=await guideOneStep({portalId:'tb3',role,question,entryKey:response.entryKey,stepIndex:response.nextStepIndex},writer);
      assert.equal(follow.stepNumber,2);
    }
  } else {
    assert.equal(response.logged,true);
    assert.ok(events.some(e=>e.portalId==='tb3'&&e.question===question));
  }
  results.push({question,role,status:response.status,link:response.link??null});
}

const crossToTb3=await guideOneStep({portalId:'tb3',role:'athlete',question:"Where can I find Amanda Catherine's classes?"},writer);
assert.equal(crossToTb3.status,'unanswered');
assert.equal(crossToTb3.logged,true);
assert.ok(events.some(e=>e.portalId==='tb3'&&e.question==="Where can I find Amanda Catherine's classes?"));
const crossToAmanda=await guideOneStep({portalId:'amanda-catherine',role:'owner',question:'How do I access TB3 NIL partnership criteria?'},writer);
assert.ok(!JSON.stringify(crossToAmanda).toLowerCase().includes('tb3.online'));
assert.ok(!JSON.stringify(crossToAmanda).toLowerCase().includes('nil partnership criteria'));
assert.equal(crossToAmanda.portalId,'amanda-catherine');
// Unknown roles inherit only the least-privileged permissions FROM THEIR OWN manifest.
const privateTb3=tb3.entries.find(e=>e.group==='hqNIL');
const publicTb3=tb3.entries.find(e=>e.group==='publicMerch');
const privateAmanda=amanda.entries.find(e=>e.group==='ownerSidebar');
const publicAmanda=amanda.entries.find(e=>e.group==='studentLearningControls');
assert.ok(privateTb3&&publicTb3&&privateAmanda&&publicAmanda);
assert.equal(canReadEntry(privateTb3!, normalizeGuideRole('unrecognized')),false);
assert.equal(canReadEntry(publicTb3!, normalizeGuideRole('unrecognized')),true);
assert.equal(canReadEntry(privateAmanda!, normalizeGuideRole('unrecognized')),false);
assert.equal(canReadEntry(publicAmanda!, normalizeGuideRole('unrecognized')),true);
assert.equal(canReadEntry(privateTb3!, normalizeGuideRole('fan')),false);
assert.equal(canReadEntry(privateTb3!, normalizeGuideRole('family')),false);
assert.equal(canReadEntry(privateTb3!, normalizeGuideRole('athlete')),true);
assert.equal(canReadEntry(privateTb3!, normalizeGuideRole('admin')),true);
assert.equal(canReadEntry(privateAmanda!, normalizeGuideRole('student')),false);
assert.equal(canReadEntry(privateAmanda!, normalizeGuideRole('owner')),true);
console.log(JSON.stringify({
 status:'PASS',health:{amanda:health('amanda-catherine'),tb3:health('tb3')},
 isolation:{tb3AmandaQuestion:crossToTb3.status,amandaNilQuestion:crossToAmanda.status,noCrossPortalData:true,passes:2,checks:2},
 tb3:{total:results.length,guided:results.filter(r=>r.status==='guided').length,unanswered:results.filter(r=>r.status==='unanswered').length,results},
 unknownRoleFallBack:'per-tenant-least-privileged',
 unansweredLogged:events.length,
},null,2));

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {writeFileSync,unlinkSync,readFileSync} from 'node:fs';
const state={live:[] as any[],test:[] as any[],paid:[] as any[],confirmed:0};
(globalThis as any).__brickRegistrarFixture=state;
const mock:Record<string,string>={
 '@/lib/services/trackingPortal':`
 export async function pushToTrackingPortal(lead){
  const s=globalThis.__brickRegistrarFixture;
  if(lead.is_test){s.test.push(lead);return {ok:true,id:'test-'+lead.registration_id};}
  s.live.push(lead);return {ok:true,id:'live-'+lead.registration_id};
 }
 export async function enqueueTrackingPortalRetry(lead,error){globalThis.__brickRegistrarFixture.test.push({queued:true,lead});return true;}
 export async function confirmTrackingPayment(payment){
  const s=globalThis.__brickRegistrarFixture;
  s.paid.push(payment);s.confirmed++;return {ok:true,id:'paid-'+payment.registration_id};
 }`,
};
const bundle=await build({stdin:{contents:"export * from './lib/services/brickRegistrar';",resolveDir:process.cwd()},
 bundle:true,platform:'node',format:'esm',packages:'external',write:false,
 plugins:[{name:'tracking-port',setup(b){
  b.onResolve({filter:/.*/},a=>Object.hasOwn(mock,a.path)?{path:a.path,namespace:'fixture'}:undefined);
  b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mock[a.path],loader:'js',resolveDir:process.cwd()}));
 }}]});
const file='tests/.brick-registrar-bundle.mjs';
writeFileSync(file,bundle.outputFiles[0].text);
const api=await import('../'+file);unlinkSync(file);
const common={client_id:'amanda-catherine',registration_id:'registration-00001',
 name:'First Last',email:'PERSON@EXAMPLE.COM',phone:'123',
 status:'submitted',payment_status:'unpaid',payment_reference:null,
 timestamp:'2026-10-11T15:00:00.000Z',source:'portal',is_test:false};
test('waitlist, calendar and payments use one public registrar entry point',async()=>{
 state.live.length=0;state.test.length=0;state.paid.length=0;
 for(const [index,brick_type] of ['waitlist','calendar','payments'].entries()){
  const result=await api.registerBrickEvent({...common,brick_type,brick_id:brick_type+'-brick',
   client_id:brick_type==='calendar'?'tarris':'amanda-catherine',
   source:brick_type==='calendar'?'tb3-booking':'portal',
   registration_id:'registration-0000'+(index+1)});
  assert.equal(result.ok,true);
 }
 assert.deepEqual(state.live.map(x=>x.brick_type),['waitlist','calendar','payments']);
 assert.ok(state.live.every(x=>x.payment_status==='unpaid'));
 assert.ok(state.live.every(x=>x.email==='person@example.com'));
 assert.equal(state.live.find(x=>x.brick_type==='calendar')?.client_id,'tarris');
 assert.equal(state.live.find(x=>x.brick_type==='calendar')?.source_page,'tb3-booking');
});
test('test mode never enters production tracking',async()=>{
 const before=state.live.length;
 const result=await api.registerBrickEvent({...common,brick_type:'waitlist',brick_id:'test-class',
   is_test:true,registration_id:'test-registration-111'});
 assert.equal(result.ok,true);assert.equal(state.live.length,before);
 assert.equal(state.test.at(-1).is_test,true);
});
test('paid events cannot trigger confirmation without provider-verified evidence',async()=>{
 const e={...common,brick_type:'payments',brick_id:'course-x',
  status:'payment_confirmed',payment_status:'paid',payment_reference:'pi_confirmed_123'};
 const prior=state.confirmed;
 assert.equal((await api.registerBrickEvent(e)).ok,false);
 assert.equal((await api.registerBrickEvent({...common,brick_type:'payments',brick_id:'course-x',
  payment_reference:'pi_untrusted'})).ok,false);
 assert.equal(state.confirmed,prior);
 const proof={event_type:'payment_confirmed',registration_id:e.registration_id,
 email:e.email.toLowerCase(),class_id:'course-x',payment_status:'paid',
 payment_reference:'pi_confirmed_123',payment_provider:'stripe',timestamp:e.timestamp,is_test:false};
 assert.equal((await api.registerBrickEvent(e,{...proof,payment_reference:'other'})).ok,false);
 assert.equal((await api.registerBrickEvent(e,proof)).ok,true);
 assert.equal(state.confirmed,prior+1);
});
test('generic client payments require same client ID in server verification',async()=>{
 const e={...common,brick_type:'payments',brick_id:'tb3-booking',
  client_id:'tarris',registration_id:'tb3-booking-1234',
  status:'payment_confirmed',payment_status:'paid',payment_reference:'pi_tb3'};
 const proof={event_type:'payment_confirmed',registration_id:e.registration_id,
 email:e.email.toLowerCase(),class_id:e.brick_id,payment_status:'paid',
 payment_reference:'pi_tb3',payment_provider:'stripe',timestamp:e.timestamp,is_test:false};
 assert.equal((await api.registerBrickEvent(e,proof)).ok,false);
 assert.equal((await api.registerBrickEvent(e,{...proof,client_id:'tarris'})).ok,true);
});
test('both Amanda entry points call only registrar, not direct tracking',()=>{
 const paths=['app/api/public/amanda/waitlist/route.ts','lib/amanda-catherine/storage.ts'];
 for(const path of paths){
  const source=readFileSync(path,'utf8');
  assert.match(source,/registerBrickEvent\(/);
  assert.doesNotMatch(source,/\b(pushToTrackingPortal|confirmTrackingPayment|enqueueTrackingPortalRetry)\s*\(/);
 }
});

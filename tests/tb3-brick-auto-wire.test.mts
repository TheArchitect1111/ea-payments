import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {writeFileSync,unlinkSync,readFileSync} from 'node:fs';
import {NextRequest} from 'next/server.js';
const store={events:[] as any[],payments:[] as any[]};
(globalThis as any).__tb3BrickFixtures=store;
const mocks:Record<string,string>={
 '@/lib/tb3/server':`
 export class Tb3Error extends Error {constructor(status,message){super(message);this.status=status;}}
 export async function handled(fn){try{return await fn();}catch(e){return Response.json({ok:false,error:e.message},{status:e.status||503});}}
 export async function db(path){if(path.includes('tb3_calendar_events'))return [{id:'event-live-001'}];return [{id:'business-live-001'}];}
 export function workspace(){return 'tb3-preview';}
 export function scope(){return 'workspace_key=eq.tb3-preview';}
 export function scopedId(id){return 'id=eq.'+id;}
 export function json(payload,status=200){return Response.json(payload,{status});}
 export async function body(req){return req.json();}
 export function sameOrigin(){}
 export async function authorize(){return {actor:'staff@tb3.online',workspace:'tb3-preview'};}
 `,
 '@/lib/ai/rate-limit':"export function checkRateLimit(){return {ok:true};}",
 '@/lib/tb3/brick-events':`
 export async function registerTb3Event(value,proof){
 const s=globalThis.__tb3BrickFixtures;
 if(value.payment_status==='paid'){
  if(!proof||proof.event_type!=='payment_confirmed'||proof.is_test!==true||proof.client_id!=='tarris'||proof.payment_reference!==value.payment_reference)
    return {ok:false,error:'Unverified payment'};
  s.payments.push({value,proof});return {ok:true,id:'tb3-test-'+value.registration_id};
 }
 s.events.push(value);return {ok:true,id:'tb3-test-'+value.registration_id};
 }`
};
const b=await build({stdin:{contents:
 "export {POST as book} from './app/api/opportunities/create/route';"+
 "export {POST as calendar} from './app/api/calendar/events/route';"+
 "export {POST as activity} from './app/api/activity/log/route';"+
 "export {GET as testGET,POST as testPOST} from './app/api/tarris/brick-dollar-test/route';",
 resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false,packages:'external',
 plugins:[{name:'tb3-ports',setup(p){p.onResolve({filter:/.*/},a=>Object.hasOwn(mocks,a.path)?{path:a.path,namespace:'fixture'}:undefined);
 p.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js',resolveDir:process.cwd()}));}}]});
const file='tests/.tb3-brick-wire-bundle.mjs';writeFileSync(file,b.outputFiles[0].text);
const api=await import('../'+file);unlinkSync(file);
const post=(route:string,body:any,headers:Record<string,string>={})=>new NextRequest('https://tb3.online'+route,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
const booking={request_id:'3a463188-3ed9-44f7-94fd-36be545f70fb',
 contact_name:'Parent Contact',company_name:'Youth Sports',contact_email:'parent@example.com',
 phone:'7045550100',type:'Camp/Clinic',budget_range:'$1k-5k',date_requested:'2026-10-20',
 vision_answer:'Community teaching and discipline',message:''};
test('public TB3 booking POST persists inquiry then calls the shared brick registrar',async()=>{
 store.events.length=0;
 const res=await api.book(post('/api/opportunities/create',booking));
 assert.equal(res.status,201);
 assert.equal(store.events.at(-1)?.brick_type,'booking');
 assert.equal(store.events.at(-1)?.registration_id,booking.request_id);
 assert.equal(store.events.at(-1)?.email,booking.contact_email);
 assert.equal(store.events.at(-1)?.is_test,undefined);
});
test('TB3 calendar POST registers persisted calendar identity through registrar',async()=>{
 const req={title:'Training session',type:'Training',start_time:'2026-10-20T14:00:00Z',
 end_time:'2026-10-20T15:00:00Z',description:'Workout',linked_module:'Training',
 linked_opportunity_id:null,earnings_amount:null,completed:false};
 const res=await api.calendar(post('/api/calendar/events',req));
 assert.equal(res.status,201);
 assert.equal(store.events.at(-1)?.brick_type,'calendar');
 assert.equal(store.events.at(-1)?.registration_id,'event-live-001');
});
test('TB3 class and activity log POST flows through registrar',async()=>{
 const req={type:'Workout',module:'Training',title:'Shooting drills',start_time:'2026-10-20T15:00:00Z',
 duration_minutes:60,notes:'',kids_impacted:0,subtype:'Strength',
 request_id:'c061cb15-9e11-4ae9-9338-28f6bb2f45fe'};
 const res=await api.activity(post('/api/activity/log',req));
 assert.equal(res.status,201);
 assert.equal(store.events.at(-1)?.brick_type,'activity');
 assert.equal(store.events.at(-1)?.registration_id,req.request_id);
});
test('preview-only $1 fixture is isolated and production returns GET/POST 404',async()=>{
 const previous=process.env.VERCEL_ENV,key=process.env.TB3_BRICK_TEST_KEY;
 try{
  process.env.VERCEL_ENV='production';process.env.TB3_BRICK_TEST_KEY='test-fixture-key';
  assert.equal((await api.testGET()).status,404);
  assert.equal((await api.testPOST(post('/api/tarris/brick-dollar-test',{testId:'preview123456',email:'test@example.com',name:'Preview User'}))).status,404);
  process.env.VERCEL_ENV='preview';
  assert.equal((await api.testPOST(post('/api/tarris/brick-dollar-test',{testId:'preview123456',email:'test@example.com',name:'Preview User'}))).status,401);
  const res=await api.testPOST(post('/api/tarris/brick-dollar-test',{testId:'preview123456',email:'test@example.com',name:'Preview User'}, {'x-tb3-test-key':'test-fixture-key'}));
  assert.equal(res.status,200);const value=await res.json();
  assert.equal(value.testOnly,true);assert.equal(value.liveCharge,false);assert.equal(value.sameRecord,true);
  assert.equal(store.events.at(-1)?.is_test,true);
  assert.equal(store.payments.at(-1)?.proof.client_id,'tarris');
 }finally{
  if(previous===undefined)delete process.env.VERCEL_ENV;else process.env.VERCEL_ENV=previous;
  if(key===undefined)delete process.env.TB3_BRICK_TEST_KEY;else process.env.TB3_BRICK_TEST_KEY=key;
 }
});
test('no TB3 API has a direct trackingPortal dependency',()=>{
 for(const path of ['app/api/opportunities/create/route.ts','app/api/calendar/events/route.ts','app/api/activity/log/route.ts','app/api/tarris/brick-dollar-test/route.ts','lib/tb3/brick-events.ts']){
  const s=readFileSync(path,'utf8');
  assert.doesNotMatch(s,/pushToTrackingPortal\s*\(|confirmTrackingPayment\s*\(|from\s+['"]@\/lib\/services\/trackingPortal/);
  assert.match(s,/registerTb3Event\s*\(|registerBrickEvent\s*\(/);
 }
});

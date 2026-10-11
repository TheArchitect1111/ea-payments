import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { NextRequest } from 'next/server.js';
import { db, mocks as baseMocks } from './fixtures/chassis-ports';
const state = db as any;
const mocks = { ...baseMocks,
  '@/lib/admin-session-guard': `export async function requireAdminActionFromRequest(){globalThis.__chassisTest.authCalls++;return {ok:globalThis.__chassisTest.admin};}export const requireAdminSessionFromRequest=requireAdminActionFromRequest;export function adminAuthJsonError(){return Response.json({error:'Admin required'},{status:401});}`,
  '@/lib/api/portal-route': baseMocks['@/lib/api/portal-route'] + `export async function guardPortalApiCookie(){return {ok:false,status:401,error:'Unauthorized'};}`,
  '@/lib/memberships': `export async function findMembership(){return globalThis.__chassisTest.member?{status:'active',role:globalThis.__chassisTest.role}:null;}`,
  '@/lib/modules/portal-modules': `export async function isModuleEnabled({orgId,moduleId}){return globalThis.__chassisTest.entitlements.some(e=>e.organizationId===orgId&&e.moduleId===moduleId&&e.status==='active');}`,
  '@/lib/ea-auth-email': `export async function sendAuthEmail(message){const d=globalThis.__chassisTest;d.confirmations++;d.mail=message;return {ok:!d.mailFail};}`,
};
const result = await build({ stdin: { contents: `
export * from './lib/tenant-foundation';export * from './lib/bricks/module-install';export * from './lib/bricks/provision-test';
export * from './lib/calendar/storage';export * from './lib/discovery/storage';export * from './lib/people/ensure-person';
export * from './lib/people/adapter';export * from './lib/people/resolve-tenant';
export {POST as calendarPOST} from './app/api/portal/[slug]/calendar/events/route';
export {POST as discoveryPOST} from './app/api/portal/[slug]/discovery/route';
export {GET as calendarGET} from './app/api/portal/calendar/route';
export {POST as entitlementsPOST} from './app/api/admin/entitlements/route';export {guardPeopleApi} from './lib/people/guard';
export * from './lib/modules/assembly';export * from './lib/modules/registry';
`, resolveDir: process.cwd() }, bundle: true, write: false, platform: 'node', format: 'esm', packages: 'external', plugins: [{ name: 'ports', setup(b) {
 b.onResolve({filter:/.*/}, a => a.path in mocks ? {path:a.path,namespace:'ports'} : undefined);
 b.onLoad({filter:/.*/,namespace:'ports'}, a => ({contents:mocks[a.path as keyof typeof mocks],loader:'js'}));
} }] });
const bundle = 'tests/.blockers-bundle.mjs';writeFileSync(bundle,result.outputFiles[0].text);
const api = await import('../'+bundle);unlinkSync(bundle);
const originalFetch = globalThis.fetch;
const people = new Map<string,any>();const memberships = new Map<string,any>();const audits:any[]=[];const calls:any[]=[];
function reset() {
 db.records.clear();db.entitlements=[];db.writes=[];db.durable=true;db.dropped=false;db.confirmations=0;db.member=true;db.session=null;
 state.admin=true;state.authCalls=0;state.role='owner';state.mailFail=false;state.providerFail=false;state.nylasFail=false;people.clear();memberships.clear();audits.length=0;calls.length=0;
 process.env.VERCEL_ENV='preview';process.env.UNIVERSAL_PEOPLE='1';process.env.UNIVERSAL_PEOPLE_PERSIST='1';
 process.env.PEOPLE_SUPABASE_URL='https://people-fixture.invalid';process.env.PEOPLE_SUPABASE_API_KEY='fixture-gateway';process.env.PEOPLE_SUPABASE_KEY='fixture-people-app';
 delete process.env.PEOPLE_SUPABASE_JWT_SECRET;delete process.env.PEOPLE_CERT_MEMORY;delete process.env.PEOPLE_TEST_ORG_MAP_JSON;
 process.env.NYLAS_API_KEY='fixture-nylas';
}
globalThis.fetch = async (url:any, init:any={}) => {
 const u=new URL(String(url));const headers=new Headers(init.headers);const body=init.body?JSON.parse(init.body):{};
 calls.push({url:u.toString(),headers,body});
 if(u.hostname==='api.us.nylas.com') return Response.json(state.nylasFail?{error:'Unavailable'}:{data:[{id:'provider-event',title:'Mapped event',when:{object:'timespan',start_time:1893492000,end_time:1893495600}}]},{status:state.nylasFail?502:200});
 assert.equal(u.hostname,'people-fixture.invalid','Tests must not contact a real provider');
 assert.equal(headers.get('Accept-Profile'),'people');assert.equal(headers.get('Content-Profile'),'people');assert.equal(headers.get('apikey'),'fixture-gateway');assert.equal(headers.get('Authorization'),'Bearer fixture-people-app');
 if(state.providerFail)return Response.json({message:'Schema unavailable'},{status:503});
 const name=u.pathname.split('/').at(-1);let out:any=[];
 const org=(u.searchParams.get('organization_id')||'').replace(/^eq\./,'');const key=(u.searchParams.get('person_key')||'').replace(/^eq\./,'');
 if(name==='persons')out=[...people.values()].filter(x=>x.organization_id===org);
 else if(name==='person_email_keys')out=[...people.values()].filter(x=>x.organization_id===org&&x.emails.some((e:any)=>e.value===(u.searchParams.get('email_normalized')||'').replace(/^eq\./,''))).map(x=>({person_key:x.person_key}));
 else if(name==='ensure_person'){
  let row=[...people.values()].find(x=>x.organization_id===body.p_organization_id&&x.emails.some((e:any)=>e.value===body.p_email));const created=!row;
  row??={person_key:body.p_person_key,organization_id:body.p_organization_id,portal_slug:body.p_portal_slug,display_name:body.p_display_name,emails:[{value:body.p_email,kind:'primary'}],phones:[],external_ids:[],lifecycle_status:'active',created_at:new Date().toISOString(),updated_at:new Date().toISOString()};
  people.set(row.person_key,row);out={created,person:row};
 } else if(name==='get_person')out=people.get(body.p_person_key)||null;
 else if(name==='org_memberships'){
  if(init.method==='POST'){
   const prior=[...memberships.values()].find(x=>x.organization_id===body.organization_id&&x.person_key===body.person_key&&x.status!=='ended');
   if(prior&&prior.membership_key!==body.membership_key)return Response.json({message:'Duplicate active membership'},{status:409});
   memberships.set(body.membership_key,body);out=[body];
  }else out=[...memberships.values()].filter(x=>x.organization_id===org&&x.person_key===key);
 }else if(name==='audit_events'){audits.push(body);out=[];}
 else throw new Error('Unimplemented provider fixture '+name);
 return Response.json(out);
};
const tenant={organizationId:'recTENANT1',portalSlug:'cert-example'};
const foundation={portalSlug:tenant.portalSlug,clientName:'Certification',packagePurchased:'Launch Verification',assemblyMode:'certified' as const};
const discovery={requestId:'request-1234',name:'<Student>',teamSize:2,revenueRange:'under_100k',systemsCount:2,operationalChallenges:['manual_scheduling'],complexity:'low',goals:'Grow'};
const event={id:'event-1234',title:'First event',start:'2030-01-01T10:00:00.000Z',end:'2030-01-01T11:00:00.000Z',allDay:false};
const req=(path:string,body:any={},origin='https://example.com')=>new NextRequest('https://example.com'+path,{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
const ctx={params:Promise.resolve({slug:tenant.portalSlug})};
const session=()=>{db.session={slug:tenant.portalSlug,orgId:tenant.organizationId,email:'student@example.com',role:'owner'};};
test('dependency-integration-readiness: actual admitted selectors install Calendar, People and Discovery',async()=>{
 reset();const r=await api.ensureTenantFoundation({...foundation,requestedModuleIds:['calendar','people','discovery','people']});
 assert.deepEqual(new Set(r.assemblyEvidence.admitted),new Set(db.entitlements.filter(x=>x.status==='active').map(x=>x.moduleId)));
 for(const module of ['calendar','people','discovery'])assert.ok([...db.records.keys()].some(x=>x.startsWith('experience:'+module+'-install-')));
 const journal=[...db.records.values()].find((x:any)=>x.state==='installed');assert.deepEqual(journal.admitted,r.assemblyEvidence.admitted);
 assert.equal(api.moduleHref(tenant.portalSlug,api.getModuleDefinition('discovery')),`/portal/${tenant.portalSlug}/discovery`);
});
test('durable-persistence: Calendar replay updates one event, survives install replay and is tenant scoped',async()=>{
 reset();await api.installCalendar(tenant);await api.saveCalendarEvent(tenant,event);await api.saveCalendarEvent(tenant,{...event,title:'Updated'});await api.installCalendar(tenant);
 const rows=await api.listCalendarEvents(tenant,new Date('2030-01-01'),new Date('2030-01-02'));assert.equal(rows.length,1);assert.equal(rows[0].title,'Updated');
 await assert.rejects(api.listCalendarEvents({...tenant,portalSlug:'other'},new Date('2030-01-01'),new Date('2030-01-02')),/tenant mismatch/);
 assert.ok([...db.records.values()].some((x:any)=>x.eventType==='event_updated'));
});
test('dependency-integration-readiness: optional Nylas maps the installed tenant grant and rejects provider errors',async()=>{
 reset();await api.installCalendar(tenant,{provider:'nylas',grantId:'tenant-grant',calendarId:'tenant-calendar'});
 const rows=await api.listCalendarEvents(tenant,new Date('2030-01-01'),new Date('2030-01-02'));assert.equal(rows[0].id,'provider-event');
 const call=calls.find(x=>x.url.includes('nylas.com'));assert.match(call.url,/grants\/tenant-grant\/events/);assert.match(call.url,/calendar_id=tenant-calendar/);
 state.nylasFail=true;await assert.rejects(api.installCalendar({...tenant,organizationId:'recOTHER'},{provider:'nylas',grantId:'bad',calendarId:'bad'}),/request failed/);
 assert.ok(![...db.records.values()].some((x:any)=>x.organizationId==='recOTHER'));
});
test('business-lifecycle: People uses actual Postgres adapter and identity replay preserves person, membership and audit',async()=>{
 reset();await api.ensureTenantFoundation({...foundation,requestedModuleIds:['people']});assert.equal(api.getPeopleRepository().kind,'postgres');
 const input={...tenant,email:'STUDENT@example.com',displayName:'Student',actorEmail:'owner@example.com'};
 const [first,second]=await Promise.all([api.ensurePersonForClientRecordAsync(input),api.ensurePersonForClientRecordAsync(input)]);
 assert.equal(first.id,second.id);assert.equal(people.size,1);assert.equal(memberships.size,1);assert.equal(audits.length,1);
 await api.ensurePersonForClientRecordAsync(input);assert.equal(memberships.size,1);
 assert.ok(calls.some(c=>c.headers.get('X-People-Organization-Id')===tenant.organizationId));
});
test('success-empty-failure-states: People flags, missing credentials and schema errors reject before tenant writes',async()=>{
 for(const mode of ['flag','persist','credentials','schema']){reset();if(mode==='flag')delete process.env.UNIVERSAL_PEOPLE;if(mode==='persist')delete process.env.UNIVERSAL_PEOPLE_PERSIST;if(mode==='credentials')delete process.env.PEOPLE_SUPABASE_API_KEY;if(mode==='schema')state.providerFail=true;
 await assert.rejects(api.ensureTenantFoundation({...foundation,requestedModuleIds:['people']}));assert.deepEqual(db.writes,[]);}
});
test('authorization-tenant-isolation: production ignores People test tenant map and fallback overrides',async()=>{
 reset();process.env.PEOPLE_TEST_ORG_MAP_JSON='{"cert-example":"recOTHER"}';process.env.PEOPLE_ALLOW_SLUG_ORG_FALLBACK='1';
 const found=await api.resolvePeopleTenantFromSlug(tenant.portalSlug);assert.equal(found.organizationId,tenant.organizationId);
});
test('business-lifecycle: Discovery saves one assessment with tracking and one escaped confirmation on replay',async()=>{
 reset();await api.installDiscovery(tenant,{brandName:'Academy'});const first=await api.handleDiscoverySubmit(tenant,'STUDENT@example.com',discovery);const second=await api.handleDiscoverySubmit(tenant,'student@example.com',discovery);
 assert.equal(first.id,second.id);assert.equal(db.confirmations,1);assert.match(state.mail.bodyHtml,/&lt;Student&gt;/);assert.equal(state.mail.brandLabel,'Academy');
 assert.equal([...db.records.keys()].filter(x=>x.startsWith('experience:discovery-submission-')).length,1);
 assert.ok([...db.records.values()].some((x:any)=>x.eventType==='assessment_submitted'));
 assert.ok([...db.records.values()].some((x:any)=>x.eventType==='confirmation_sent'));
 await assert.rejects(api.handleDiscoverySubmit(tenant,'student@example.com',{...discovery,teamSize:3}),/Conflicting/);
});
test('success-empty-failure-states: confirmation retry repairs same assessment; dropped durability never reports success',async()=>{
 reset();await api.installDiscovery(tenant);state.mailFail=true;await assert.rejects(api.handleDiscoverySubmit(tenant,'student@example.com',discovery),/confirmation/);
 state.mailFail=false;await api.handleDiscoverySubmit(tenant,'student@example.com',discovery);assert.equal([...db.records.keys()].filter(x=>x.startsWith('experience:discovery-submission-')).length,1);
 reset();db.durable=false;await assert.rejects(api.installCalendar(tenant),/durable/);await assert.rejects(api.installDiscovery(tenant),/durable/);
});
test('authorization-tenant-isolation: routes reject missing session, wrong org, membership, role, disabled module and origin',async()=>{
 for(const scenario of ['session','org','membership','role','disabled','origin']){
  reset();await api.ensureTenantFoundation({...foundation,requestedModuleIds:['calendar','discovery']});session();
  if(scenario==='session')db.session=null;if(scenario==='org')db.session.orgId='recOTHER';if(scenario==='membership')db.member=false;if(scenario==='role')db.session.role=undefined;if(scenario==='disabled')db.entitlements=[];
  const origin=scenario==='origin'?'https://evil.example':'https://example.com';const before=db.writes.length;
  assert.ok([401,403].includes((await api.discoveryPOST(req('/api/portal/cert-example/discovery',discovery,origin),ctx)).status));
  assert.ok([401,403].includes((await api.calendarPOST(req('/api/portal/cert-example/calendar/events',event,origin),ctx)).status));
  assert.equal(db.writes.length,before);
 }
});
test('route-render: authenticated Calendar and Discovery handlers perform installed lifecycle',async()=>{
 reset();await api.ensureTenantFoundation({...foundation,requestedModuleIds:['calendar','discovery']});session();
 assert.equal((await api.calendarPOST(req('/api/portal/cert-example/calendar/events',event),ctx)).status,200);
 const r=await api.calendarGET(new NextRequest('https://example.com/api/portal/calendar?slug=cert-example&start=2030-01-01&end=2030-01-02'));assert.equal(r.status,200);assert.equal((await r.json()).events.length,1);
 assert.equal((await api.discoveryPOST(req('/api/portal/cert-example/discovery',discovery),ctx)).status,200);
});
test('rollback-disable: suspending selected entitlement blocks Calendar reads and writes',async()=>{
 reset();await api.ensureTenantFoundation({...foundation,requestedModuleIds:['calendar']});session();db.entitlements.find(x=>x.moduleId==='calendar').status='suspended';
 assert.equal((await api.calendarPOST(req('/api/portal/cert-example/calendar/events',event),ctx)).status,403);
 assert.equal((await api.calendarGET(new NextRequest('https://example.com/api/portal/calendar?slug=cert-example&start=2030-01-01&end=2030-01-02'))).status,403);
});
test('observability: all preview provisioning runs prove persisted selection and same-row replay',async()=>{
 for(const module of ['calendar','people','discovery']){reset();const response=await api.runProvisionTest(req('/test',{runId:'proof-1234'}),module);assert.equal(response.status,200);const payload=await response.json();assert.equal(payload.ok,true);assert.deepEqual(new Set(payload.admitted),new Set(payload.persisted));assert.ok(payload.tenant.portalSlug.startsWith('cert-'+module+'-'));}
});
test('rollback-disable: test endpoints return 404 in production before auth, providers or writes',async()=>{
 for(const module of ['calendar','people','discovery']){reset();process.env.VERCEL_ENV='production';(process.env as Record<string,string|undefined>).NODE_ENV='test';
 assert.equal(api.provisionTestGET().status,404);assert.equal((await api.runProvisionTest(req('/test',{runId:'proof-1234'}),module)).status,404);assert.equal(state.authCalls,0);assert.deepEqual(db.writes,[]);assert.deepEqual(calls,[]);}
});
test('authorization-tenant-isolation: preview tests require admin and cannot select an arbitrary tenant',async()=>{
 reset();state.admin=false;assert.equal((await api.runProvisionTest(req('/test',{runId:'proof-1234'}),'calendar')).status,401);assert.deepEqual(db.writes,[]);
 reset();assert.equal((await api.runProvisionTest(req('/test',{runId:'proof-1234',organizationId:'recREAL'}),'calendar')).status,400);assert.deepEqual(db.writes,[]);
});
test('dependency-integration-readiness: selector enables autowire before granting a new module',async()=>{
 reset();await api.ensureTenantFoundation(foundation);const response=await api.entitlementsPOST(req('/api/admin/entitlements',{organizationId:tenant.organizationId,moduleId:'calendar',enabled:true}));
 assert.equal(response.status,200);assert.ok([...db.records.keys()].some(x=>x.startsWith('experience:calendar-install-')));
 const installed=[...db.records.values()].find((x:any)=>x.state==='installed');assert.ok(installed.admitted.includes('calendar'));
 reset();await api.ensureTenantFoundation(foundation);delete process.env.UNIVERSAL_PEOPLE;const before=db.writes.length;
 assert.equal((await api.entitlementsPOST(req('/api/admin/entitlements',{organizationId:tenant.organizationId,moduleId:'people',enabled:true}))).status,503);assert.equal(db.writes.length,before);
});
test('authorization-tenant-isolation: People guard rejects wrong org, inactive membership and suspended entitlements',async()=>{
 reset();await api.ensureTenantFoundation({...foundation,requestedModuleIds:['people']});session();
 assert.equal((await api.guardPeopleApi(req('/api/portal/cert-example/people'),tenant.portalSlug)).ok,true);
 for(const scenario of ['org','membership','disabled']){session();db.member=true;if(scenario==='org')db.session.orgId='recOTHER';if(scenario==='membership')db.member=false;if(scenario==='disabled')db.entitlements=[];
 const guarded=await api.guardPeopleApi(req('/api/portal/cert-example/people'),tenant.portalSlug);assert.equal(guarded.ok,false);assert.equal(guarded.response.status,403);}
});
test('immutable-version-fingerprint: all three module certificates have exact version and ten evidence classes',()=>{
 const inventory=JSON.parse(readFileSync('config/capability-inventory.json','utf8'));const ledger=JSON.parse(readFileSync('config/module-certification-evidence.json','utf8'));
 for(const id of ['calendar','people','discovery']){const m=inventory.modules.find((x:any)=>x.id===id);const c=ledger.certificates.find((x:any)=>x.moduleId===id);assert.equal(m.version,2);assert.equal(c.moduleVersion,2);assert.equal(Object.keys(c.evidence).length,10);assert.ok(c.sourceFiles.length);}
});
process.on('exit',()=>{globalThis.fetch=originalFetch;});

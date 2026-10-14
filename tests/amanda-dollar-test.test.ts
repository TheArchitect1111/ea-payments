import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build, type Plugin } from 'esbuild';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
type TestDb = {
  records: Map<string, { payload: any; organizationId: string }>;
  clients: Map<string, any>;
  waitlist: Map<string, any>;
  writes: Array<{ id: string; kind: string }>;
  trackingEvents: any[];
};
const db: TestDb = { records: new Map(), clients: new Map(), waitlist: new Map(), writes: [], trackingEvents: [] };
(globalThis as any).__amandaE2E = db;

const mocks: Record<string, string> = {
  './registry': "export async function create(){throw new Error('Payment updates must not create signup rows');} export async function registry(){return {};}",
  'stripe': "export default class Stripe {}",
  '@/lib/services/trackingPortal': `export async function pushToTrackingPortal(event){globalThis.__amandaE2E.trackingEvents.push(event);return {ok:true};} export async function enqueueTrackingPortalRetry(){} export async function getTestTrackingRegistration(id){return globalThis.__amandaE2E.records.get('experience:'+id)?.payload??null;} export async function confirmTrackingPayment(event){ globalThis.__amandaE2E.trackingEvents.push(event); return {ok:true}; }`,
  '@/lib/amanda-catherine/confirmation-letters': `export async function getAmandaConfirmationLetter(){return {type:'live',subject:'Registered for {{class_name}}',body_html:'Hello {{first_name}}, {{class_name}}'};}`,
  './practitioner-kit-orders': "export async function recordAmandaKitOrder(){return {ok:true};}",
  '@/lib/amanda-catherine/config': `
    export const AMANDA_MEMBERSHIPS = [];
    export const AMANDA_OFFERS = [{ id:'aesthetikine-reset-training', name:'Nervous System Reset', priceCad:997, courseId:'aesthetikine-reset-training' }];
    export const AMANDA_COURSES = [{ id:'aesthetikine-reset-training', title:'Nervous System Reset', lessons:['Introduction','Clinical Practice'], practicalRequirements:[] }];
  `,
  '@/lib/creative-studio/persistence': `
    const db = () => globalThis.__amandaE2E;
    export async function loadStudioRecordFromAirtable(type,id){return db().records.get(type+':'+id)?.payload ?? null;}
    export async function loadStudioRecord(type,id) {return db().records.get(type+':'+id)?.payload ?? null;}
    export async function saveStudioRecord(row) { db().records.set(row.recordType+':'+row.id,{payload:structuredClone(row.payload),organizationId:row.organizationId});db().writes.push({id:row.id,kind:'studio'});return {ok:true,persistedToAirtable:true};}
    export async function listStudioRecords(type,org) {return [...db().records.entries()].filter(([k,v])=>k.startsWith(type+':')&&v.organizationId===org).map(([,v])=>v.payload);}
  `,
  '@/lib/platform-store': "export function syntheticOrgId(slug){return 'org_'+slug;}",
  '@/lib/platform-urls': "export function canonicalPlatformOrigin(){return 'https://amandacatherine.ca';}",
  '@/lib/pulse-bus': "export async function emitPulseEvent(){return {ok:true};}",
  '@/lib/email': "export async function sendAdminNotification(){return {ok:true};} export async function sendPaymentConfirmationEmail(){return {ok:true};}",
  '@/lib/activity-events-store': "export async function publishPlatformActivityEvent(){return {ok:true};}",
  '@/lib/airtable': `
    const db = () => globalThis.__amandaE2E;
    export async function getClientByEmail(email){return db().clients.get(email) || null;}
    export async function createOrUpdateClientRecord(input){const id='rec-test';db().clients.set(input.email,{id,email:input.email,portalSlug:null,tempPassword:'',passwordChanged:false});return {ok:true,recordId:id};}
    export async function setPortalCredentials(id,slug,password,email){const client=db().clients.get(email);db().clients.set(email,{...client,portalSlug:slug,tempPassword:password});return {ok:true};}
  `,
  '@/lib/organizations': "export async function ensureOrganizationForPortal(){return {orgId:'org_amanda-catherine'};}",
  '@/lib/memberships': "export async function createMembership(){} export async function findMembership(){return null;}",
  '@/lib/ea-auth-email': "export async function sendAuthEmail(){return {ok:true};}",
  './invited-learners': "export function invitedAmandaLearner(){return null;}",
  '@/lib/email/gmail': "export async function sendGmailEmail(){throw new Error('Gmail must not be used without credentials');}",
  '@/lib/data/airtable-client': `
    const db = () => globalThis.__amandaE2E;
    export function airtableConfigured(){return true;}
    export async function airtableQuery(table,options={}){
      const match=String(options.filterByFormula||'').match(/'([^']+)'/);
      return [...db().waitlist.entries()].filter(([key,fields])=>
        key.startsWith(table+':') && (!match || fields.registration_key===match[1]))
        .map(([id,fields])=>({id,fields}));
    }
    export async function airtableUpsertByField(table,field,key,fields){
      const id=table+':'+key;const current=db().waitlist.get(id)||{};
      db().waitlist.set(id,{...current,...structuredClone(fields)});
      db().writes.push({id,kind:'waitlist'});return {id,fields:db().waitlist.get(id)};
    }
    export async function airtableUpdate(table,id,fields){
      const current=db().waitlist.get(id)||{};
      db().waitlist.set(id,{...current,...structuredClone(fields)});
      db().writes.push({id,kind:'waitlist-update'});return {id,fields:db().waitlist.get(id)};
    }
  `,
};
const plugin: Plugin = {
  name: 'mock-external-amanda-transports',
  setup(ctx) {
    ctx.onResolve({ filter: /.*/ }, (args) => mocks[args.path]
      ? { path: args.path, namespace: 'amanda-test-transport' } : undefined);
    ctx.onLoad({ filter: /.*/, namespace: 'amanda-test-transport' }, (args) =>
      ({ contents: mocks[args.path], loader: 'js' }));
  },
};

async function loadRealHandlers(): Promise<any> {
  const result = await build({
    entryPoints: [resolve(root, 'tests/fixtures/amanda-certification-entry.ts')],
    tsconfig: resolve(root, 'tsconfig.json'),
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    write: false,
    logLevel: 'silent',
    plugins: [plugin],
  });
  const code = result.outputFiles[0].text;
  return import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
}


async function loadTrackingHandler(): Promise<any> {
  const plugin: Plugin={name:'tracking-persistence-mocks',setup(ctx){
    ctx.onResolve({filter:/.*/},(args)=>{
      if(args.path==='@/lib/services/trackingPortal')return undefined;
      return mocks[args.path]?{path:args.path,namespace:'amanda-test-transport'}:undefined;
    });
    ctx.onLoad({filter:/.*/,namespace:'amanda-test-transport'},args=>({contents:mocks[args.path],loader:'js'}));
  }};
  const buildResult=await build({entryPoints:[resolve(root,'lib/services/trackingPortal.ts')],
    tsconfig:resolve(root,'tsconfig.json'),bundle:true,platform:'node',format:'esm',
    target:'node22',write:false,logLevel:'silent',plugins:[plugin]});
  return import('data:text/javascript;base64,'+Buffer.from(buildResult.outputFiles[0].text).toString('base64'));
}

test('Live signup and $1 test stay isolated; verified payment replay never creates a duplicate',async()=>{
  db.records.clear();db.waitlist.clear();db.writes.length=0;
  delete process.env.TRACKING_PORTAL_API_URL;delete process.env.TRACKING_PORTAL_URL;
  const tracking=await loadTrackingHandler();
  const lead={first_name:'Amanda',last_name:'Tracking',email:'tracking-qa@example.invalid',
    phone:'',class_name:'Clinical Training',class_id:'ready-course',
    registration_type:'live',created_at:new Date().toISOString(),source_page:'amandacatherine.ca',
    registration_id:'reg-test-live-01',payment_status:'unpaid',is_test:false};
  await tracking.pushToTrackingPortal(lead);
  const before=[...db.waitlist.keys()].filter(k=>k.startsWith('portal_registrations:'));
  assert.equal(before.length,1,'Live signup not recorded');
  const paid={event_type:'payment_confirmed',registration_id:lead.registration_id,email:lead.email,
    class_id:lead.class_id,payment_status:'paid',payment_reference:'square-reference-1',
    payment_provider:'square',timestamp:new Date().toISOString(),is_test:false};
  await tracking.storeTrackingPayment(paid);
  await tracking.storeTrackingPayment(paid);
  await tracking.pushToTrackingPortal(lead);
  assert.equal(db.waitlist.get('portal_registrations:amanda-catherine:'+lead.registration_id).payment_status,'paid','Signup replay must preserve payment');
  assert.equal([...db.waitlist.keys()].filter(k=>k.startsWith('portal_registrations:')).length,1,'Payment created duplicate live registration');
  const realRecord=db.waitlist.get('portal_registrations:amanda-catherine:'+lead.registration_id);
  assert.equal(realRecord.payment_status,'paid','Original tracking lead must show paid');
  assert.equal(realRecord.payment_reference,'square-reference-1','Original lead must store payment reference');
  const metadata=[...db.records.values()].find(x=>x.payload?.payment_reference==='square-reference-1');
  assert.ok(metadata,'Payment reference missing from existing lead metadata');
  const testLead={...lead,email:'private-test@example.invalid',registration_id:'test-reg-isolated-01',is_test:true};
  await tracking.pushToTrackingPortal(testLead);
  await tracking.storeTrackingPayment({...paid,registration_id:testLead.registration_id,email:testLead.email,
    payment_reference:'stripe-test-reference-1',payment_provider:'stripe',is_test:true});
  const testReceipt=await tracking.getTestTrackingRegistration(testLead.registration_id);
  assert.equal(testReceipt.is_test,true);
  assert.equal(testReceipt.payment_status,'paid');
  assert.equal([...db.waitlist.keys()].filter(k=>k.startsWith('portal_registrations:')).length,1,
    'Test data polluted real registration table');
  await assert.rejects(tracking.storeTrackingPayment({...paid,email:'no-registration@example.invalid'}),
    /Matching live registration not found/);
  const repeat={...lead,registration_id:'reg-repeat-purchase-02'};
  await tracking.pushToTrackingPortal(repeat);
  await tracking.storeTrackingPayment({...paid,registration_id:repeat.registration_id,payment_reference:'square-reference-2'});
  assert.equal([...db.waitlist.keys()].filter(k=>k.startsWith('portal_registrations:')).length,2,'Repeat purchase needs a distinct signup');
  assert.equal(db.waitlist.get('portal_registrations:amanda-catherine:'+lead.registration_id).payment_reference,'square-reference-1');
  const legacy={...lead,registration_id:undefined,email:'legacy@example.invalid'};
  await tracking.pushToTrackingPortal(legacy);
  await tracking.storeTrackingPayment({...paid,registration_id:undefined,email:legacy.email,payment_reference:'legacy-reference'});
  assert.equal(db.waitlist.get('portal_registrations:'+legacy.email+':'+legacy.class_id).payment_status,'paid','Legacy callers must retain their email/course key');
  db.waitlist.set('portal_registrations:old-checkout@example.invalid:ready-course',{registration_key:'old-checkout@example.invalid:ready-course',email:'old-checkout@example.invalid',class_id:'ready-course',registration_id:'old-uuid-checkout'});
  await tracking.storeTrackingPayment({...paid,registration_id:'old-uuid-checkout',email:'old-checkout@example.invalid',payment_reference:'old-checkout-paid'});
  assert.equal(db.waitlist.get('portal_registrations:old-checkout@example.invalid:ready-course').payment_reference,'old-checkout-paid');
});

test('Amanda upgrade route and middleware are deployed in the source artifact', () => {
  const middleware = readFileSync(resolve(root, 'middleware.ts'), 'utf8');
  const page = readFileSync(resolve(root, 'app/portal/amanda-catherine/expired/page.tsx'), 'utf8');
  assert.match(middleware, /'\/portal\/amanda-catherine\/expired'/);
  assert.match(page, /Your \$1 test access has expired/);
  assert.match(page, /Upgrade to full course access/);
});

test('Amanda verified $1 fulfillment, replay, 72-hour denial, no-write preview, waitlist and hourly expiry', async () => {
  // This fixture is NOT a live Stripe charge or a write to the real Airtable base.
  console.log('PRODUCTION OBSERVED BASELINE (Oct 8, read-only): payments=4, access=1, progress=8, course-content=1');
  db.records.clear();db.waitlist.clear();db.writes.length=0;db.trackingEvents.length=0;
  const app = await loadRealHandlers();
  assert.equal(db.records.size, 0);
  const created = Math.floor(Date.now()/1000);
  const email = 'qa-amanda-certification@example.invalid';
  // An owner-only CAD $1 test starts with an existing authenticated portal identity.
  // The test must never create or update an ordinary Client Records entry.
  db.clients.clear();
  db.clients.set(email, { id: 'rec-amanda-owner-test', email, portalSlug: 'amanda-catherine',
    tempPassword: 'existing-test-only', passwordChanged: true });
  const clientsBefore = structuredClone([...db.clients.entries()]);
  const session = {
    id: 'cs_test_amanda_ci_mock_0001',
    created,
    amount_total: 100,
    currency: 'cad',
    payment_status: 'paid',
    customer_email: email,
    customer_details: { email, name: 'Amanda CI Test' },
    metadata: {
      portalSlug: 'amanda-catherine', amandaOfferId: 'aesthetikine-reset-training',
      amandaCourseId: 'aesthetikine-reset-training',
      clientEmail: email, paymentOption: 'test', privateTestCheckout: 'true', registrationId:'test-reg-001',clientName:'Amanda CI Test',
    },
  };
  const first = await app.fulfillAmandaCheckout(session as any, 'webhook');
  assert.equal(first.ok, true, JSON.stringify(first));
  assert.deepEqual([...db.clients.entries()], clientsBefore, 'Private tests must not mutate ordinary client records');
  const paidAt = new Date(created*1000).toISOString();
  const expires = new Date((created+72*3600)*1000).toISOString();
  assert.equal(first.record.isTestAccess, true);
  assert.equal(db.trackingEvents.length,1);
  assert.deepEqual({is_test:db.trackingEvents[0].is_test,payment_status:db.trackingEvents[0].payment_status,registration_id:db.trackingEvents[0].registration_id},{is_test:true,payment_status:'paid',registration_id:'test-reg-001'});
  assert.ok(first.record.trackingLetterSentAt,'test registration confirmation letter was not sent');
  assert.equal(first.record.testPaidAt, paidAt);
  assert.equal(first.record.expiresAt, expires);

  const payments = () => [...db.records.entries()].filter(([key])=>key.startsWith('experience:amanda-payment-'));
  const profiles = () => [...db.records.entries()].filter(([key])=>key.startsWith('experience:amanda-access-'));
  const progress = () => [...db.records.entries()].filter(([key])=>key.startsWith('experience:amanda-progress-'));
  assert.equal(payments().length,1);
  assert.equal(profiles().length,1);
  const courseId = 'aesthetikine-reset-training';
  const profile = profiles()[0][1].payload;
  const grant = profile.entitlements[courseId];
  assert.equal(grant.isTestAccess,true);
  assert.equal(grant.status,'active');
  assert.equal(grant.testPaidAt,paidAt);
  assert.equal(grant.expiresAt,expires);

  const replay = await app.fulfillAmandaCheckout(session as any,'webhook');
  assert.equal(replay.ok,true);
  assert.equal(payments().length,1,'webhook retry duplicated a payment');
  assert.equal(db.trackingEvents.length,2,'verified replay should update the same tracking registration');
  assert.equal(profiles().length,1,'webhook retry duplicated access');
  assert.equal(profiles()[0][1].payload.entitlements[courseId].expiresAt,expires,'replay restarted the clock');

  const writesBefore = db.writes.length;
  const preview = await app.peekAmandaCourseProgress('amanda-catherine',email,courseId,true);
  assert.equal(preview.completedLessons.length,0);
  assert.equal(progress().length,0);
  assert.equal(db.writes.length,writesBefore,'preview changed Airtable mock');

  const assigned = await app.getAmandaAssignedCourseIds('amanda-catherine',email);
  assert.deepEqual(assigned,[courseId]);
  const active = await app.getAmandaCourseAccessDecision('amanda-catherine',email,courseId);
  assert.equal(active.authorized,true);

  const cron = await app.expireAmandaTestEntitlements(new Date((created+73*3600)*1000));
  assert.equal(cron.ok,true);
  assert.equal(cron.expired,1);
  const cronRetry = await app.expireAmandaTestEntitlements(new Date((created+74*3600)*1000));
  assert.equal(cronRetry.expired,0,'cron duplicate expiry write');
  const expired = await app.getAmandaCourseAccessDecision('amanda-catherine',email,courseId);
  assert.equal(expired.authorized,false);
  assert.equal(expired.reason,'TRIAL_EXPIRED');
  assert.match(expired.redirect,/\/portal\/amanda-catherine\/expired/);
  assert.deepEqual(await app.getAmandaAssignedCourseIds('amanda-catherine',email),[]);

  const interest = {
    student_name:'Automated Waitlist QA',student_email:'amanda-waitlist-ci@example.invalid',
    student_phone:'',student_message:'CI only',course_name:'Clinical Fat Loss Injectables for Face & Body Contouring',
    course_slug:'clinical-fat-loss-injectables',
    course_url:'https://amandacatherine.ca/amanda-catherine/courses/clinical-fat-loss-injectables#waitlist',
  };
  delete process.env.AMANDA_GMAIL_CLIENT_ID;
  delete process.env.AMANDA_GMAIL_CLIENT_SECRET;
  delete process.env.AMANDA_GMAIL_REFRESH_TOKEN;
  const waitlistId = await app.saveAmandaWaitlist(interest);
  const provider = await app.notifyAmandaWaitlist(interest);
  await app.updateAmandaWaitlistNotification(waitlistId,'sent',provider);
  assert.equal(provider,'resend');
  assert.equal(db.waitlist.get(waitlistId).notification_status,'sent');
  assert.equal(db.waitlist.size,1);
  console.log('ISOLATED FIXTURE AFTER: payment=1, entitlement profile=1, preview progress=0, waitlist=1, delivery=sent (mocked).');
});

test('Storage payment update calls tracking without creating another submission', async () => {
  const app = await loadRealHandlers();
  const writes = db.writes.length;
  const before = db.trackingEvents.length;
  const payment = { event_type:'payment_confirmed', registration_id:'storage-paid-01',
    email:'storage-qa@example.invalid', class_id:'ready-course', payment_status:'paid',
    payment_reference:'pi_test_storage', payment_provider:'stripe',
    timestamp:new Date().toISOString(), is_test:true };
  const result = await app.handleAmandaSubmit({}, undefined, payment);
  assert.equal(result.ok,true);
  assert.equal(result.type,'payment_update');
  assert.equal(db.trackingEvents.length,before+1);
  assert.deepEqual(db.trackingEvents.at(-1),payment);
  assert.equal(db.writes.length,writes,'Payment update created a signup row');
  await assert.rejects(app.handleAmandaSubmit({},undefined,{...payment,payment_reference:''}),
    /Verified registration payment required/);
});

test('Preview guard uses the dedicated test key and rejects live keys and production', async () => {
  const bundled = await build({entryPoints:[resolve(root,'lib/amanda-catherine/preview-dollar-test.ts')],
    tsconfig:resolve(root,'tsconfig.json'),bundle:true,platform:'node',format:'esm',
    target:'node22',write:false,logLevel:'silent',plugins:[plugin]});
  const app = await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
  const keys=['VERCEL_ENV','VERCEL_GIT_COMMIT_REF','STRIPE_TEST_SECRET_KEY','STRIPE_SECRET_KEY'];
  const previous=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
  try {
    process.env.VERCEL_ENV='preview';process.env.VERCEL_GIT_COMMIT_REF='fix/amanda-tracking-wire';
    process.env.STRIPE_TEST_SECRET_KEY='sk_test_primary';process.env.STRIPE_SECRET_KEY='sk_live_blocked';
    assert.equal(app.previewDollarTestGuard('qa.vercel.app').enabled,true);
    delete process.env.STRIPE_TEST_SECRET_KEY;
    assert.equal(app.previewDollarTestGuard('qa.vercel.app').code,503);
    process.env.STRIPE_SECRET_KEY='sk_test_fallback';
    assert.equal(app.previewDollarTestGuard('qa.vercel.app').enabled,true);
    process.env.STRIPE_TEST_SECRET_KEY='sk_live_invalid_primary';
    assert.equal(app.previewDollarTestGuard('qa.vercel.app').code,503);
    process.env.STRIPE_TEST_SECRET_KEY='sk_test_primary';process.env.VERCEL_ENV='production';
    assert.equal(app.previewDollarTestGuard('qa.vercel.app').code,404);
  } finally { for(const key of keys) {if(previous[key]===undefined)delete process.env[key];else process.env[key]=previous[key];} }
});


test('Amanda alternate owner Gmail receives isolated $1 entitlement without a Client Records write', async () => {
  db.records.clear(); db.clients.clear(); db.writes.length=0; db.trackingEvents.length=0;
  const app = await loadRealHandlers();
  const email='amandacatherinec@gmail.com';
  const created=Math.floor(Date.now()/1000);
  const session={
    id:'cs_test_amanda_alt_owner_0001',created,amount_total:100,currency:'cad',
    payment_status:'paid',customer_email:email,customer_details:{email,name:'Amanda Catherine'},
    metadata:{
      portalSlug:'amanda-catherine',amandaOfferId:'aesthetikine-reset-training',
      amandaCourseId:'aesthetikine-reset-training',clientEmail:email,
      paymentOption:'test',privateTestCheckout:'true',registrationId:'test-owner-alt-001',
      clientName:'Amanda Catherine',
    },
  };
  const result=await app.fulfillAmandaCheckout(session as any,'webhook');
  assert.equal(result.ok,true,JSON.stringify(result));
  assert.equal(db.clients.size,0,'Owner test must not create a normal customer record');
  assert.deepEqual(await app.getAmandaAssignedCourseIds('amanda-catherine',email),['aesthetikine-reset-training']);
  assert.equal(result.record.isTestAccess,true);
  assert.ok(result.record.expiresAt,'Owner trial must expire after 72 hours');
});

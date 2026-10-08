import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build, type Plugin } from 'esbuild';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
type TestDb = {
  records: Map<string, { payload: any; organizationId: string }>;
  clients: Map<string, any>;
  waitlist: Map<string, any>;
  writes: Array<{ id: string; kind: string }>;
};
const db: TestDb = { records: new Map(), clients: new Map(), waitlist: new Map(), writes: [] };
(globalThis as any).__amandaE2E = db;

const mocks: Record<string, string> = {
  './practitioner-kit-orders': "export async function recordAmandaKitOrder(){return {ok:true};}",
  '@/lib/amanda-catherine/config': `
    export const AMANDA_MEMBERSHIPS = [];
    export const AMANDA_OFFERS = [{ id:'aesthetikine-reset-training', name:'Nervous System Reset', priceCad:997, courseId:'aesthetikine-reset-training' }];
    export const AMANDA_COURSES = [{ id:'aesthetikine-reset-training', title:'Nervous System Reset', lessons:['Introduction','Clinical Practice'], practicalRequirements:[] }];
  `,
  '@/lib/creative-studio/persistence': `
    const db = () => globalThis.__amandaE2E;
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

test('Amanda verified $1 fulfillment, replay, 72-hour denial, no-write preview, waitlist and hourly expiry', async () => {
  // This fixture is NOT a live Stripe charge or a write to the real Airtable base.
  console.log('PRODUCTION OBSERVED BASELINE (Oct 8, read-only): payments=4, access=1, progress=8, course-content=1');
  const app = await loadRealHandlers();
  assert.equal(db.records.size, 0);
  const created = Math.floor(Date.now()/1000);
  const email = 'qa-amanda-certification@example.invalid';
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
      clientEmail: email, paymentOption: 'test', privateTestCheckout: 'true',
    },
  };
  const first = await app.fulfillAmandaCheckout(session as any, 'webhook');
  assert.equal(first.ok, true, JSON.stringify(first));
  const paidAt = new Date(created*1000).toISOString();
  const expires = new Date((created+72*3600)*1000).toISOString();
  assert.equal(first.record.isTestAccess, true);
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

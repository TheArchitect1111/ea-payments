import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { requireTestKey, isVerifiedWoodTest, woodTestOrigin, WOOD_TEST_FLOW, WOOD_TEST_COURSE } from '../lib/amanda-catherine/reusable-test';
import { getCTA } from '../lib/amanda-catherine/class-cta-policy';
const state = { records: new Map<string, any>(), clients: new Map<string, any>(), emails: [] as any[], signups: [] as any[], kitOrders: 0 };
(globalThis as any).__wood = state;
const mocks: Record<string, string> = {
  'server-only': '',
  '@/lib/creative-studio/persistence': `const s=globalThis.__wood; export async function loadStudioRecord(t,id){return s.records.get(id)||null} export async function listStudioRecords(){return [...s.records.values()]} export async function saveStudioRecord(r){s.records.set(r.id,structuredClone(r.payload));return {ok:true,persistedToAirtable:true}}`,
  '@/lib/airtable': `const s=globalThis.__wood; export async function getClientByEmail(e){return s.clients.get(e)||null} export async function createOrUpdateClientRecord(i){s.clients.set(i.email,{id:i.email,email:i.email,passwordChanged:false,portalSlug:null});return {ok:true,recordId:i.email}} export async function setPortalCredentials(id,slug,p,e){if(p)throw Error('Plaintext credentials prohibited');s.clients.set(e,{...s.clients.get(e),portalSlug:slug});return {ok:true}}`,
  '@/lib/ea-portal-password-reset': `export async function requestPortalPasswordReset(e,origin){return {email:e,resetUrl:origin+'/portal/reset-password?token=fixture'}}`,
  '@/lib/organizations': `export async function ensureOrganizationForPortal(){return {orgId:'persisted-amanda-organization'}}`,
  '@/lib/memberships': `export async function findMembership(){return null} export async function createMembership(i){if(i.role!=='guest')throw Error('Role escalation')}`,
  '@/lib/ea-auth-email': `export async function sendAuthEmail(i){globalThis.__wood.emails.push(i);return {ok:true}}`,
  '@/lib/platform-store': `export function syntheticOrgId(){return 'org_amanda-catherine'}`,
  '@/lib/platform-urls': `export function canonicalPlatformOrigin(){return 'https://amandacatherine.ca'}`,
  '@/lib/pulse-bus': `export async function emitPulseEvent(){}`,
  '@/lib/activity-events-store': `export async function publishPlatformActivityEvent(){}`,
  '@/lib/email': `export async function sendPaymentConfirmationEmail(i){globalThis.__wood.emails.push(i);return {ok:true}} export async function sendAdminNotification(){return {ok:true}}`,
  './premium-receipt-email': `export async function sendAmandaPremiumReceiptEmail(i){globalThis.__wood.emails.push(i);return {ok:true}}`,
  '@/lib/amanda-catherine/confirmation-letters': `export async function getAmandaConfirmationLetter(){return {subject:'Test enrollment',body_html:'Hello {{first_name}}: {{class_name}}'}}`,
  './payments': `export async function recordAmandaVerifiedPayment(s,id,isTest){globalThis.__wood.signups.push({email:s.customer_details.email,id,isTest});return {registrationId:s.id}}`,
  './invited-learners': `export function invitedAmandaLearner(){return null}`,
};
async function handlers() {
  const result = await build({stdin:{contents:"export {fulfillAmandaCheckout} from './lib/amanda-catherine/payment-fulfillment'; export {getAmandaAssignedCourseIds,getAmandaCourseAccessDecision} from './lib/amanda-catherine/client-access';",resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',write:false,
    plugins:[{name:'transports',setup(b){b.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'test'}:undefined);b.onLoad({filter:/.*/,namespace:'test'},a=>({contents:mocks[a.path],loader:'js'}));}}]});
  return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}
function session(email: string, id = 'cs_test_fresh1', created = Math.floor(Date.now()/1000)) { return { id, created, livemode:false, mode:'payment', amount_total:100,currency:'cad',payment_status:'paid',
  customer_details:{email,name:email.split('@')[0]},metadata:{portalSlug:'amanda-catherine',amandaOfferId:WOOD_TEST_COURSE,amandaCourseId:WOOD_TEST_COURSE,enrollmentFlow:WOOD_TEST_FLOW,paymentOption:'test',privateTestCheckout:'true',kitFulfillment:'pickup',kitShippingCents:'0'} } as any; }
test('live keys, unpaid sessions, wrong amounts, currencies and courses cannot grant test access',()=>{
  assert.throws(()=>requireTestKey('sk_live_fixture')); assert.throws(()=>requireTestKey(''));
  assert.equal(requireTestKey('sk_test_fixture'),'sk_test_fixture');
  const valid=session('a@example.invalid'); assert.equal(isVerifiedWoodTest(valid),true);
  for(const change of [{livemode:true},{payment_status:'unpaid'},{amount_total:99700},{currency:'usd'},{mode:'subscription'},{id:'cs_live_x'}]) assert.throws(()=>isVerifiedWoodTest({...valid,...change}));
  assert.throws(()=>isVerifiedWoodTest({...valid,metadata:{...valid.metadata,amandaCourseId:'other'}}));
  assert.equal(woodTestOrigin('https://amandacatherine.ca'),'https://amandacatherine.ca');assert.throws(()=>woodTestOrigin('https://attacker.example'));
});
test('one shared CTA, with normal course and waitlist behavior preserved',()=>{
  const c={key:'wood-therapy',title:'Wood Therapy',status:'AVAILABLE',square_checkout_url:null};
  assert.equal(getCTA(c).label,'TEST - $1 Full Workflow (Amanda + Brick)');assert.equal(Array.isArray(getCTA(c)),false);
  assert.equal(getCTA({...c,title:'Body Sculpt',square_checkout_url:'https://checkout.square.site/example'}).label,'Register');
  assert.equal(getCTA({...c,title:'Other',status:'WAITLIST'}).label,'Join the waitlist');
});
test('both fresh identities receive receipts, secure welcome and course access; replay and renewals preserve paid grants',async()=>{
  const app=await handlers();
  for(const [index,email] of ['amanda-qa@example.invalid','brick-qa@example.invalid'].entries()) {
    const s=session(email,'cs_test_student'+index);
    const first=await app.fulfillAmandaCheckout(s,'return-verification');assert.equal(first.ok,true,JSON.stringify(first));
    assert.deepEqual(await app.getAmandaAssignedCourseIds('amanda-catherine',email),[WOOD_TEST_COURSE]);
    assert.ok(state.emails.some(e=>e.to===email&&String(e.text).includes('Set your password')));
    assert.ok(state.emails.some(e=>e.to===email&&e.receipt?.amountCad===1));
    const before=state.emails.length;const replay=await app.fulfillAmandaCheckout(s,'webhook');assert.equal(replay.ok,true);assert.equal(state.emails.length,before,'No duplicate email on replay');
    assert.equal(state.clients.get(email).tempPassword,undefined);
  }
  const email='brick-qa@example.invalid';const older=session(email,'cs_test_old',Math.floor(Date.now()/1000)-80*3600);
  await app.fulfillAmandaCheckout(older,'webhook');
  assert.equal((await app.getAmandaCourseAccessDecision('amanda-catherine',email,WOOD_TEST_COURSE)).authorized,true,'Delayed older checkout cannot replace new grant');
  const profile=[...state.records.values()].find(p=>p.email===email&&p.entitlements);profile.entitlements[WOOD_TEST_COURSE]={isTestAccess:false,testPaidAt:null,expiresAt:null};
  const next=await app.fulfillAmandaCheckout(session(email,'cs_test_again',Math.floor(Date.now()/1000)+10),'webhook');assert.equal(next.ok,true);
  const after=[...state.records.values()].find(p=>p.email===email&&p.entitlements);assert.equal(after.entitlements[WOOD_TEST_COURSE].isTestAccess,false,'Permanent access must remain permanent');
  const denied=await app.fulfillAmandaCheckout({...session('unpaid@example.invalid'),payment_status:'unpaid'},'return-verification');assert.equal(denied.ok,false);assert.equal(state.clients.has('unpaid@example.invalid'),false);
});


test('checkout creates a fresh test session each time and refuses live credentials', async()=>{
  const created: any[]=[];
  (globalThis as any).__woodSessions=created;
  const compiled=await build({entryPoints:['app/api/public/amanda/wood-test/checkout/route.ts'],bundle:true,platform:'node',format:'esm',write:false,
    plugins:[{name:'stripe-transport',setup(b){
      b.onResolve({filter:/^(stripe|next\/server)$/},a=>({path:a.path,namespace:'checkout-mock'}));
      b.onLoad({filter:/.*/,namespace:'checkout-mock'},a=>({loader:'js',contents:a.path==='stripe'
        ? `export default class Stripe {checkout={sessions:{create:async p=>{globalThis.__woodSessions.push(p);return {id:'cs_test_'+globalThis.__woodSessions.length,livemode:false,url:'https://checkout.stripe.com/c/pay/cs_test_'+globalThis.__woodSessions.length}}}}}`
        : `export const NextResponse={json:(data,options={})=>({data,status:options.status||200})};`}));
    }}]});
  const route=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  const prior=process.env.STRIPE_SECRET_KEY;
  try {
    process.env.STRIPE_SECRET_KEY='sk_live_fixture';
    assert.equal((await route.POST({nextUrl:{origin:'https://amandacatherine.ca'}})).status,503);
    assert.equal(created.length,0);
    process.env.STRIPE_SECRET_KEY='sk_test_fixture';
    const first=await route.POST({nextUrl:{origin:'https://amandacatherine.ca'}});
    const second=await route.POST({nextUrl:{origin:'https://amandacatherine.ca'}});
    assert.equal(first.status,200);assert.notEqual(first.data.url,second.data.url);
    assert.equal(created[0].line_items[0].price_data.unit_amount,100);
    assert.equal(created[0].line_items[0].price_data.currency,'cad');
    assert.equal(created[0].customer_email,undefined,'Stripe collects each student email');
    assert.equal(created[0].metadata.enrollmentFlow,WOOD_TEST_FLOW);
  } finally {if(prior===undefined) delete process.env.STRIPE_SECRET_KEY;else process.env.STRIPE_SECRET_KEY=prior;}
});

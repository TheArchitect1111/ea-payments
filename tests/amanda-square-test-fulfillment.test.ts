import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, createHash } from 'node:crypto';
import { build } from 'esbuild';
const state = { records: new Map<string,any>(), clients: new Map<string,any>(), emails: [] as any[], paid: [] as any[],
  payment: {} as any, receiptFails: false, apiCalls: [] as string[] };
(globalThis as any).__squareFulfillment = state;
const mocks: Record<string,string> = {
  'next/server': `export const NextResponse={json:(data,options={})=>({data,status:options.status||200})};`,
  '@/lib/creative-studio/persistence': `const s=globalThis.__squareFulfillment; export async function loadStudioRecord(t,id){return s.records.get(id)||null} export async function listStudioRecords(){return [...s.records.values()]} export async function saveStudioRecord(r){s.records.set(r.id,structuredClone(r.payload));return {ok:true,persistedToAirtable:true}}`,
  '@/lib/platform-store': `export function syntheticOrgId(){return 'org_amanda-catherine'}`,
  './brick-events': `export async function registerAmandaPaid(i){globalThis.__squareFulfillment.paid.push(i);return {ok:true}}`,
  '@/lib/airtable': `const s=globalThis.__squareFulfillment; export async function getClientByEmail(e){return s.clients.get(e)||null} export async function createOrUpdateClientRecord(i){s.clients.set(i.email,{id:i.email,email:i.email,portalSlug:null,passwordChanged:false});return {ok:true,recordId:i.email}} export async function setPortalCredentials(id,slug,password,email){if(password)throw Error('Must not store plaintext passwords');s.clients.set(email,{...s.clients.get(email),portalSlug:slug});return {ok:true}}`,
  '@/lib/organizations': `export async function ensureOrganizationForPortal(){return {orgId:'rec-amanda-org'}}`,
  '@/lib/memberships': `export async function findMembership(){return null} export async function createMembership(i){if(i.role!=='guest')throw Error('Privilege escalation');return {id:'membership',status:'active'}}`,
  '@/lib/ea-portal-password-reset': `export async function requestPortalPasswordReset(e,origin){return {email:e,resetUrl:origin+'/portal/reset-password?token=fixture'}}`,
  '@/lib/ea-auth-email': `export async function sendAuthEmail(i){globalThis.__squareFulfillment.emails.push({kind:'setup',...i});return {ok:true}}`,
  './premium-receipt-email': `export async function sendAmandaPremiumReceiptEmail(i){if(globalThis.__squareFulfillment.receiptFails)return {ok:false};globalThis.__squareFulfillment.emails.push({kind:'receipt',...i});return {ok:true}}`,
  './confirmation-letters': `export async function getAmandaConfirmationLetter(){return {body_html:'Hello {{first_name}}, welcome to {{class_name}}'}}`,
  './invited-learners': `export function invitedAmandaLearner(){return null}`,
  '@/lib/platform-urls': `export function canonicalPlatformOrigin(){return 'https://amandacatherine.ca'}`,
};
async function load() {
  const output=await build({stdin:{contents:`export { fulfillSquareTestPayment } from './lib/amanda-catherine/square-test-fulfillment'; export { getAmandaCourseAccessDecision } from './lib/amanda-catherine/client-access'; export { POST as webhook } from './app/api/webhooks/square-amanda-test/route'; export { POST as verify } from './app/api/public/amanda/square-test/verify/route';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'node',format:'esm',write:false,
    plugins:[{name:'isolated-transports',setup(b){b.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'test'}:undefined);b.onLoad({filter:/.*/,namespace:'test'},a=>({contents:mocks[a.path],loader:'js'}))}}]});
  return import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));
}
function seed(email:string,id:string) {
  state.records.set('amanda-square-test-order-'+id,{email,name:'Test Student',class_id:'wood-therapy',course_id:'wood-therapy-certification',registration_id:'reg-'+id,order_id:id,expected_amount:100,currency:'CAD',is_test:true,provider_environment:'sandbox',payment_status:'unpaid'});
  state.payment={id:'payment_'+id,order_id:id,status:'COMPLETED',amount_money:{amount:100,currency:'CAD'},location_id:'sandbox-location',created_at:new Date().toISOString()};
}
test('verified Square Sandbox payment provisions two students, records tests, sends emails and replays without duplicate enrollment',async()=>{
  process.env.SQUARE_SANDBOX_ACCESS_TOKEN='sandbox-fixture';process.env.SQUARE_SANDBOX_LOCATION_ID='sandbox-location';
  const original=globalThis.fetch;
  globalThis.fetch=(async(url:any)=>{state.apiCalls.push(String(url));return {ok:true,json:async()=>({payment:state.payment,order:{id:state.payment.order_id,tenders:[{id:state.payment.id}]}})} as any}) as any;
  try {
    const app=await load();
    for(const [i,email] of ['amanda@example.invalid','brick@example.invalid'].entries()) {
      seed(email,'order'+i);const id=state.payment.id;
      assert.equal((await app.fulfillSquareTestPayment(id)).ok,true);
      assert.equal((await app.getAmandaCourseAccessDecision('amanda-catherine',email,'wood-therapy-certification')).authorized,true);
      assert.ok(state.emails.some(e=>e.to===email&&e.kind==='receipt'&&e.receipt.provider==='Square'&&e.receipt.isTest&&e.receipt.amountCad===1));
      assert.ok(state.emails.some(e=>e.to===email&&e.kind==='setup'&&e.bodyHtml.includes('Set your portal password')));
      const count=state.emails.length;await app.fulfillSquareTestPayment(id);assert.equal(state.emails.length,count);
    }
    assert.equal(state.clients.size,2);assert.ok(state.paid.every(p=>p.isTest===true));
    assert.ok(state.apiCalls.every(url=>url.startsWith('https://connect.squareupsandbox.com/')));
    seed('pending@example.invalid','pending');state.payment.status='APPROVED';
    const before=state.clients.size;assert.equal((await app.fulfillSquareTestPayment(state.payment.id)).pending,true);assert.equal(state.clients.size,before);
    for(const change of [{amount_money:{amount:99700,currency:'CAD'}},{amount_money:{amount:100,currency:'USD'}},{location_id:'live-location'}]) {
      seed('bad@example.invalid','bad');Object.assign(state.payment,change);await assert.rejects(()=>app.fulfillSquareTestPayment(state.payment.id));assert.equal(state.clients.has('bad@example.invalid'),false);
    }
    seed('retry@example.invalid','retry');state.receiptFails=true;
    await assert.rejects(()=>app.fulfillSquareTestPayment(state.payment.id),/receipt delivery/);
    assert.equal(state.records.get('amanda-square-test-order-retry').confirmation_sent,undefined);
    state.receiptFails=false;assert.equal((await app.fulfillSquareTestPayment(state.payment.id)).ok,true);
    assert.equal(state.emails.filter(e=>e.to==='retry@example.invalid'&&e.kind==='setup').length,1);
    // A newer test can renew an expired test grant, without affecting permanent grants.
    const expired=[...state.records.values()].find(r=>r.email==='amanda@example.invalid'&&r.entitlements);
    expired.entitlements['wood-therapy-certification']={isTestAccess:true,testPaidAt:new Date(Date.now()-80*3600000).toISOString(),expiresAt:new Date(Date.now()-8*3600000).toISOString(),squarePaymentId:'old_payment',status:'expired'};
    assert.equal((await app.getAmandaCourseAccessDecision('amanda-catherine','amanda@example.invalid','wood-therapy-certification')).authorized,false);
    seed('amanda@example.invalid','renewed');await app.fulfillSquareTestPayment(state.payment.id);
    assert.equal((await app.getAmandaCourseAccessDecision('amanda-catherine','amanda@example.invalid','wood-therapy-certification')).authorized,true);
    const profile=[...state.records.values()].find(r=>r.email==='brick@example.invalid'&&r.entitlements);
    profile.entitlements['wood-therapy-certification']={isTestAccess:false,testPaidAt:null,expiresAt:null};
    seed('brick@example.invalid','repeat');await app.fulfillSquareTestPayment(state.payment.id);
    const after=[...state.records.values()].find(r=>r.email==='brick@example.invalid'&&r.entitlements);
    assert.equal(after.entitlements['wood-therapy-certification'].isTestAccess,false);
    // Bad webhook signatures and confirmation tokens cannot trigger provider calls or access.
    process.env.SQUARE_SANDBOX_WEBHOOK_SIGNATURE_KEY='fixture-signing-key';process.env.SQUARE_SANDBOX_WEBHOOK_NOTIFICATION_URL='https://preview.example/api/webhooks/square-amanda-test';
    const raw=JSON.stringify({type:'payment.updated',data:{object:{payment:{id:state.payment.id}}}});
    const calls=state.apiCalls.length;
    assert.equal((await app.webhook({text:async()=>raw,headers:new Headers({'x-square-hmacsha256-signature':'forged'})})).status,403);
    assert.equal(state.apiCalls.length,calls);
    const sig=createHmac('sha256','fixture-signing-key').update(process.env.SQUARE_SANDBOX_WEBHOOK_NOTIFICATION_URL+raw).digest('base64');
    assert.equal((await app.webhook({text:async()=>raw,headers:new Headers({'x-square-hmacsha256-signature':sig})})).status,200);
    const reg='10000000-0000-4000-8000-000000000000',token='x'.repeat(43);
    state.records.set('amanda-square-test-status-'+reg,{orderId:state.payment.order_id,tokenHash:createHash('sha256').update(token).digest('hex')});
    assert.equal((await app.verify({json:async()=>({registrationId:reg,token:'y'.repeat(43)})})).status,403);
    assert.equal((await app.verify({json:async()=>({registrationId:reg,token})})).data.ok,true);
  } finally { globalThis.fetch=original; }
});

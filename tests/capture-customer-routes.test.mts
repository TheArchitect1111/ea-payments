import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { writeFileSync, unlinkSync } from 'node:fs';
import { NextRequest } from 'next/server.js';

const state:any={ calls:[], forms:new Map(), relationship:null, sessionSlug:'tenant-live' };
(globalThis as any).__captureRoutesState=state;
const mocks:Record<string,string>={
 '@/lib/api/portal-route': "export async function guardPortalApiCookie(){return {ok:true,session:{slug:'tenant-live',email:'owner@example.com',role:'staff'}};}export async function guardPortalApi(){const s=globalThis.__captureRoutesState;return {ok:true,session:{slug:s.sessionSlug,email:'owner@example.com',role:'staff'}};}export function portalTenant(s){return {portalSlug:s.slug,organizationId:'recTENANT123'};}export function portalApiUnauthorized(){return Response.json({error:'Unauthorized'},{status:401});}",
 '@/lib/airtable': "export async function getClientByPortalSlug(slug){return {clientName:'Client',packagePurchased:'Implementation Package',email:'owner@example.com'};}",
 '@/lib/capture-records': "export function portalCaptureSource(){return 'Simplifi Portal';}",
 '@/lib/capture-submit': "export async function submitCapture(){return {ok:true,record:{id:'capture-live-1',title:'Demo capture'}};}export function toCaptureApiResponse(r){return {ok:r.ok,id:r.record.id};}",
 '@/lib/capture-response': "export function sanitizeCaptureClientError(v){return v;}",
 '@/lib/modules/portal-modules': "export async function isModuleEnabled(){return true;}",
 '@/lib/capture-upload-limits': "export const MAX_CAPTURE_UPLOAD_BYTES=1000000;export function captureUploadTooLargeMessage(){return 'too big';}",
 '@/lib/bricks/capture-entry-bridge': "export async function resolveCaptureTenant(slug){return slug==='tenant-live'?{organizationId:'recTENANT123',portalSlug:slug}:null;}export async function bridgeCapturedRecord(input){globalThis.__captureRoutesState.calls.push(['bridge',input]);return input;}",
 '@/lib/connect-store': "export async function getConnectOrg(){return {name:'Test Org',offer:{resourceTitle:'Guide'},sequence:[],resources:[],redirectDestination:'/next'};}export async function listConnectRelationships(){const r=globalThis.__captureRoutesState.relationship;return r?[r]:[];}export async function createConnectRelationship(input){const s=globalThis.__captureRoutesState;s.calls.push(['createRelationship',input]);const r={...input,id:'relationship-live-1',source:input.source||'QR',status:'New',aiProfile:{opportunityScore:50,recommendedAction:'Follow up'},tags:[]};s.relationship=r;return r;}export async function recordConnectEngagement(){return true;}export async function updateConnectRelationshipHandoff(){return true;}export async function markSequenceStepSent(){return true;}",
 '@/lib/connect-pipeline': "export async function handoffConnectRelationship(){return {simplifi:{},amplifi:{}};}",
 '@/lib/connect-delivery-log': "export async function logConnectChannelDelivery(){return true;}",
 '@/lib/email': "export async function sendConnectSms(){return {ok:true};}export async function sendConnectWelcomeEmail(){globalThis.__captureRoutesState.calls.push(['welcome']);return {ok:true};}export async function sendInternalNotification(){return {ok:true};}",
 '@/lib/admin-session-guard': "export async function requireAdminSessionFromRequest(){return {ok:true};}export function adminAuthJsonError(){return Response.json({error:'Admin required'},{status:401});}",
 '@/lib/bricks/durable': "export function brickHash(data){return require('node:crypto').createHash('sha256').update(JSON.stringify(data)).digest('hex');}",
 '@/lib/portal-forms/store': "export async function createPortalFormSubmission(input){const s=globalThis.__captureRoutesState;const id=input.idempotencyId||('legacy-'+s.forms.size);const row=s.forms.get(id)||{id,portalSlug:input.portalSlug,kind:input.kind,name:input.name,email:input.email,payload:input.payload,status:'submitted'};s.forms.set(id,row);s.calls.push(['saveForm',input]);return row;}export async function updatePortalFormSubmissionStatus(input){const s=globalThis.__captureRoutesState;const row=s.forms.get(input.submissionId);if(!row||row.portalSlug!==input.portalSlug)return null;const next={...row,status:input.status};s.forms.set(row.id,next);return next;}",
 '@/lib/portal-notify': "export async function notifyPortal(){return true;}",
 '@/lib/platform-store': "export function syntheticOrgId(slug){return 'org_'+slug;}",
 '@/lib/ctp-asset-store': "export function parseAssetUploads(){return null;}export async function finalizeCtpAssetManifest(){return {};}",
 '@/lib/amanda-catherine/config': "export const AMANDA_PORTAL_FORMS=[];",
 '@/lib/ai/rate-limit': "export function checkRateLimit(){return {ok:true};}",
 '@/lib/amanda-catherine/application-routing': "export function amandaApplicationRoute(){return {queueHref:'/queue',confirmation:'Thanks',reviewStep:'Review'};}",
 '@/lib/activity-events-store': "export async function publishPlatformActivityEvent(){return true;}",
 '@/lib/rbac': "export function normalizeRole(x){return x;}export function roleAtLeast(){return true;}",
 '@/lib/bricks/capture-family': "export async function progressCapture(tenant,kind,id,ports){globalThis.__captureRoutesState.calls.push(['progress',kind,id]);if(kind==='applications')await ports.confirm({email:'candidate@example.com',subject:'Application received'});return {state:'reviewed'};}",
 '@/lib/bricks/commerce-family': "export async function registerCommerce(tenant,kind,input){globalThis.__captureRoutesState.calls.push(['registerBilling',kind,input]);return {id:'billing-order-1'};}",
 '@/lib/bricks/commerce-stripe': "export async function fulfillCommerceStripePayment(tenant,kind,id,ref){globalThis.__captureRoutesState.calls.push(['verifyStripe',kind,id,ref]);return {payment_status:'paid'};}",
 '@/lib/ea-auth-email': "export async function sendAuthEmail(message){globalThis.__captureRoutesState.calls.push(['confirmation',message.to]);return {ok:true};}"
};
const bundle=await build({stdin:{contents:
 "export {POST as simplifiPOST} from './app/api/portal/captures/analyze/route';"+
 "export {POST as connectPOST} from './app/api/connect/relationships/route';"+
 "export {POST as formsPOST} from './app/api/portal/forms/submit/route';"+
 "export {POST as statusPOST} from './app/api/portal/forms/status/route';",
 resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'esm',packages:'external',
 plugins:[{name:'ports',setup(b){
  b.onResolve({filter:/.*/},a=>Object.hasOwn(mocks,a.path)?{path:a.path,namespace:'ports'}:undefined);
  b.onLoad({filter:/.*/,namespace:'ports'},a=>({contents:mocks[a.path],loader:'js',resolveDir:process.cwd()}));
 }}]});
const name='tests/.capture-live-routes-bundle.mjs';
writeFileSync(name,bundle.outputFiles[0].text);
const api=await import('../'+name);unlinkSync(name);
const request=(path:string,body:unknown)=>new NextRequest('https://example.test'+path,{
 method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const reset=()=>{state.calls=[];state.forms.clear();state.relationship=null;state.sessionSlug='tenant-live';};
test('Simplifi live analyze POST invokes durable outcome bridge',async()=>{
 reset();
 const res=await api.simplifiPOST(request('/api/portal/captures/analyze',{url:'https://example.org'}));
 assert.equal(res.status,200);
 assert.ok(state.calls.some((v:any)=>v[0]==='bridge'&&v[1].kind==='simplifi'&&v[1].identity==='capture-live-1'&&v[1].route===true));
});
test('Connect live POST retries same relationship without duplicate records or welcome',async()=>{
 reset();
 const body={orgSlug:'tenant-live',name:'Contact',email:'contact@example.com',campaignId:'event-1'};
 const first=await api.connectPOST(request('/api/connect/relationships',body));assert.equal(first.status,200);
 const second=await api.connectPOST(request('/api/connect/relationships',body));assert.equal(second.status,200);
 assert.equal((await second.json()).replay,true);
 assert.equal(state.calls.filter((v:any)=>v[0]==='createRelationship').length,1);
 assert.equal(state.calls.filter((v:any)=>v[0]==='welcome').length,1);
 assert.equal(state.calls.filter((v:any)=>v[0]==='bridge'&&v[1].kind==='connect').length,2);
});
test('P/intake POST persists stable ID and staff review invokes capture adapter',async()=>{
 reset();
 const body={slug:'tenant-live',kind:'intake',name:'New Contact',email:'intake@example.com',payload:{goal:'growth'}};
 const a=await api.formsPOST(request('/api/portal/forms/submit',body));
 const b=await api.formsPOST(request('/api/portal/forms/submit',body));
 assert.equal(a.status,200);assert.equal(b.status,200);
 const first=(await a.json()).submission;
 assert.equal(first.id,(await b.json()).submission.id);assert.equal(state.forms.size,1);
 assert.ok(state.calls.filter((v:any)=>v[0]==='saveForm').every((v:any)=>v[1].requireDurable===true));
 assert.ok(state.calls.some((v:any)=>v[0]==='bridge'&&v[1].kind==='intake'));
 const reviewed=await api.statusPOST(request('/api/portal/forms/status',{submissionId:first.id,status:'reviewed'}));
 assert.equal(reviewed.status,200);
 assert.ok(state.calls.some((v:any)=>v[0]==='progress'&&v[1]==='intake'&&v[2]===first.id));
});
test('P/apply and P/applications reviewed/accepted route into Billing verifier with tenant isolation',async()=>{
 reset();
 const body={slug:'tenant-live',kind:'application',name:'Applicant',email:'applicant@example.com',payload:{offerId:'course-1'}};
 const submitted=await api.formsPOST(request('/api/portal/forms/submit',body));
 assert.equal(submitted.status,200);
 const row=(await submitted.json()).submission;
 const review=await api.statusPOST(request('/api/portal/forms/status',{
  submissionId:row.id,status:'accepted',paymentReference:'pi_test_confirmed'}));
 assert.equal(review.status,200);
 assert.ok(state.calls.some((v:any)=>v[0]==='progress'&&v[1]==='applications'));
 assert.ok(state.calls.some((v:any)=>v[0]==='registerBilling'&&v[1]==='billing'&&v[2].offerId==='course-1'));
 assert.ok(state.calls.some((v:any)=>v[0]==='verifyStripe'&&v[3]==='pi_test_confirmed'));
 assert.ok(state.calls.some((v:any)=>v[0]==='confirmation'));
 state.sessionSlug='another-tenant';
 const denied=await api.statusPOST(request('/api/portal/forms/status',{submissionId:row.id,status:'rejected'}));
 assert.equal(denied.status,404);
});

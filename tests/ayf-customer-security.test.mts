import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { NextRequest } from 'next/server.js';

const tenant={organizationId:'recAYFTEST',portalSlug:'are-you-fundable'};
const identity=(email:string,role='viewer')=>({slug:tenant.portalSlug,orgId:tenant.organizationId,email,role});
const admin=identity('admin@example.test','admin'),a=identity('a@example.test'),b=identity('b@example.test'),staff=identity('staff@example.test','staff'),otherStaff=identity('other@example.test','staff');
const state={rows:new Map<string,any>(),members:new Map<string,any>(),session:admin as any};
(globalThis as any).__ayfSecurity=state;
const durable=`import {createHash} from 'node:crypto';export const brickHash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export async function readBrickRecord(t,id){const row=globalThis.__ayfSecurity.rows.get(id);if(row&&(row.organizationId!==t.organizationId||row.portalSlug!==t.portalSlug))throw Error('Tenant mismatch');return row?structuredClone(row):null;}
export async function writeBrickRecord(t,id,row){if(row.organizationId!==t.organizationId||row.portalSlug!==t.portalSlug)throw Error('Tenant mismatch');globalThis.__ayfSecurity.rows.set(id,structuredClone(row));return row;}`;
const mocks:Record<string,string>={
 '@/lib/bricks/durable':durable,'./durable':durable,
 '@/lib/memberships':`export async function findMembership(email,org){return structuredClone(globalThis.__ayfSecurity.members.get(org+'/'+email)||null);}`,
 '@/lib/modules/tenant-install':`export async function loadTenantInstall(org){return {organizationId:org,portalSlug:org==='recAYFTEST'?'are-you-fundable':'other',state:'installed',admitted:['intake','people','messaging','documents','applications','reports','dashboard']};}`,
 '@/lib/api/portal-route':`export async function guardPortalApi(req,opts){const s=globalThis.__ayfSecurity.session;return s&&(!opts?.slug||opts.slug===s.slug)?{ok:true,session:s}:{ok:false};}export function portalTenant(s){return {organizationId:s.orgId,portalSlug:s.slug};}export function portalApiUnauthorized(){return Response.json({error:'No access'},{status:401});}`,
 '@/lib/organizations':`export async function findOrganizationByPortalSlug(slug){return slug==='are-you-fundable'?{id:'recAYFTEST'}:null;}`,
 '@/lib/bricks/content-portal':`export async function portalContentDefault(slug,kind){return {organizationId:slug==='are-you-fundable'?'recAYFTEST':'recOTHER',portalSlug:slug,key:'getting-started'};}`,
 '@/lib/bricks/final-portal':`export async function portalFinalDefault(slug,kind){return {organizationId:slug==='are-you-fundable'?'recAYFTEST':'recOTHER',portalSlug:slug,key:'welcome'};}`,
 '@/lib/training-transformation-store':`export async function listPublishedTrainingForTenant(){return [];}`,
 '@/lib/provision-website-portal':`export async function findPublishedSitePage(){return null;}export function siteUrlForSlug(){return '/';}`,
 '@/lib/airtable':`export async function getContentRequestsForClient(){throw Error('Legacy customer data must not be queried');}`,
 '@/lib/ctp-documents-view':`export function buildCtpDocumentsView(){throw Error('Legacy customer data must not be queried');}`,
 '@/lib/ctp-submissions':`export async function getCtpSubmissionForPortal(){throw Error('Legacy customer data must not be queried');}`,
 '@/lib/update-hub-feed':`export function getPendingRequests(){return [];}export function getPublishedFeedItems(){return [];}`,
};
const compiled=await build({stdin:{resolveDir:process.cwd(),contents:`
export * from './lib/bricks/content-family';export * from './lib/bricks/final-family';export * from './lib/ayf/customer-access';
export {listPortalDocuments} from './lib/portal-document-hub';export {listPortalMessagingThreads} from './lib/portal-messaging-hub';
export {GET as download} from './app/api/portal/content/download/route';
export {GET as getContent,POST as postContent} from './app/api/portal/content/route';
export {POST as upload} from './app/api/portal/content/upload/route';
export {GET as getMessages,POST as postMessages} from './app/api/portal/final-bricks/route';
export {POST as assign} from './app/api/portal/ayf/customer-access/route';`},bundle:true,write:false,platform:'node',format:'cjs',packages:'external',plugins:[{name:'controlled-storage',setup(p){
 p.onResolve({filter:/.*/},arg=>mocks[arg.path]?{path:arg.path,namespace:'controlled'}:undefined);
 p.onLoad({filter:/.*/,namespace:'controlled'},arg=>({contents:mocks[arg.path],loader:'ts',resolveDir:process.cwd()}));
}}]});
const require=createRequire(join(process.cwd(),'package.json'));
const Module=require('node:module');const module=new Module(join(process.cwd(),'tests/ayf-security-controlled.cjs'));module.filename=join(process.cwd(),'tests/ayf-security-controlled.cjs');module.paths=Module._nodeModulePaths(join(process.cwd(),'tests'));module._compile(compiled.outputFiles[0]!.text,module.filename);
const api=module.exports;
const req=(url:string,body?:unknown)=>new NextRequest('https://ayf.example.test'+url,body?{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://ayf.example.test'},body:JSON.stringify(body)}:undefined);
const doc=(customerEmail=a.email,key='a-doc')=>({key,title:'Synthetic document',customerEmail,visibility:'member',body:Buffer.from('Synthetic bytes only').toString('base64'),mediaType:'text/plain'});
beforeEach(async()=>{state.rows.clear();state.members.clear();state.session=admin;for(const u of [admin,a,b,staff,otherStaff])state.members.set(tenant.organizationId+'/'+u.email,{id:'rec'+u.email.split('@')[0],userEmail:u.email,organizationId:tenant.organizationId,role:u.role,status:'active'});await api.setCustomerStaff(tenant,admin,{customerEmail:a.email,staffEmails:[staff.email]});await api.setCustomerStaff(tenant,admin,{customerEmail:b.email,staffEmails:[otherStaff.email]});});

test('Customer document lists and direct downloads exclude another customer in the same organization',async()=>{
 await api.saveContent(tenant,'documents',doc(),'staff',admin);await api.saveContent(tenant,'documents',doc(b.email,'b-doc'),'staff',admin);
 state.session=a;const list=await api.getContent(req('/api/portal/content?kind=documents&list=1'));assert.equal(list.status,200);assert.deepEqual((await list.json()).items.map((x:any)=>x.key),['a-doc']);
 const own=await api.download(req('/api/portal/content/download?kind=documents&key=a-doc'));assert.equal(own.status,200);assert.equal(await own.text(),'Synthetic bytes only');assert.equal(own.headers.get('cache-control'),'private, no-store');
 state.session=b;assert.equal((await api.download(req('/api/portal/content/download?kind=documents&key=a-doc'))).status,404);assert.equal((await api.getContent(req('/api/portal/content?kind=documents&key=a-doc'))).status,404);
});
test('Assigned staff access is live, revocable and cannot be self-granted; administrators retain control',async()=>{
 await api.saveContent(tenant,'documents',doc(),'staff',admin);state.session=staff;assert.equal((await api.download(req('/api/portal/content/download?kind=documents&key=a-doc'))).status,200);
 state.session=otherStaff;assert.equal((await api.download(req('/api/portal/content/download?kind=documents&key=a-doc'))).status,404);
 assert.equal((await api.assign(req('/api/portal/ayf/customer-access',{customerEmail:a.email,staffEmails:[otherStaff.email]}))).status,403);
 state.session=admin;assert.equal((await api.assign(req('/api/portal/ayf/customer-access',{customerEmail:a.email,staffEmails:[]}))).status,200);
 state.session=staff;assert.equal((await api.download(req('/api/portal/content/download?kind=documents&key=a-doc'))).status,404);
 state.session=admin;assert.equal((await api.download(req('/api/portal/content/download?kind=documents&key=a-doc'))).status,200);
});
test('Suspension, forged session roles, missing actor and cross-tenant actors fail closed',async()=>{
 await api.saveContent(tenant,'documents',doc(),'staff',admin);
 await assert.rejects(api.readContent(tenant,'documents','a-doc','staff'),/denied/);
 await assert.rejects(api.readContent(tenant,'documents','a-doc','staff',{...admin,orgId:'recOTHER'}),/denied/);
 state.members.get(tenant.organizationId+'/'+a.email).status='suspended';state.session={...a,role:'admin'};assert.equal((await api.download(req('/api/portal/content/download?kind=documents&key=a-doc'))).status,404);
 state.session={...b,role:'owner'};assert.equal((await api.download(req('/api/portal/content/download?kind=documents&key=a-doc'))).status,404);
 state.session=null;assert.equal((await api.download(req('/api/portal/content/download?kind=documents&key=a-doc'))).status,401);
});
test('Uploads bind customer owner and enforce staff assignment without ownership escalation',async()=>{
 const upload=async(email:string)=>{const f=new FormData();f.set('customerEmail',email);f.set('visibility','member');f.set('file',new File(['Synthetic bytes only'],'fixture.txt',{type:'text/plain'}));return api.upload(new NextRequest('https://ayf.example.test/api/portal/content/upload',{method:'POST',headers:{Origin:'https://ayf.example.test'},body:f}));};
 state.session=staff;const own=await upload(a.email);assert.equal(own.status,200);const key=(await own.json()).key;
 assert.notEqual((await upload(b.email)).status,200);state.session=b;assert.equal((await api.download(req('/api/portal/content/download?kind=documents&key='+key))).status,404);
 state.session=a;assert.equal((await upload(a.email)).status,403);
});
test('Messages ignore forged customer ownership and protect list, key reads, replay and transitions',async()=>{
 state.session=a;const create=await api.postMessages(req('/api/portal/final-bricks',{kind:'messaging',action:'create',key:'message-a',title:'Question',body:'Synthetic question',customerEmail:b.email}));assert.equal(create.status,200);assert.equal((await create.json()).record.customerEmail,a.email);
 state.session=b;assert.deepEqual((await (await api.getMessages(req('/api/portal/final-bricks?kind=messaging'))).json()).records,[]);assert.equal((await api.getMessages(req('/api/portal/final-bricks?kind=messaging&key=message-a'))).status,404);
 assert.notEqual((await api.postMessages(req('/api/portal/final-bricks',{kind:'messaging',action:'create',key:'message-a',title:'Question',body:'Synthetic question'}))).status,200);
 state.session=otherStaff;assert.notEqual((await api.postMessages(req('/api/portal/final-bricks',{kind:'messaging',action:'transition',key:'message-a',state:'delivered'}))).status,200);
 state.session=staff;assert.equal((await api.postMessages(req('/api/portal/final-bricks',{kind:'messaging',action:'transition',key:'message-a',state:'delivered'}))).status,200);
 state.session=a;assert.notEqual((await api.postMessages(req('/api/portal/final-bricks',{kind:'messaging',action:'transition',key:'message-a',state:'responded',reply:'forged'}))).status,200);
});
test('Report listing/downloads and generation are customer-scoped, including forged staff claims',async()=>{
 await api.saveContent(tenant,'documents',doc(),'staff',admin);await api.saveContent(tenant,'documents',doc(b.email,'b-doc'),'staff',admin);
 await api.saveContent(tenant,'reports',{key:'a-report',title:'Synthetic inventory',customerEmail:a.email,visibility:'member'},'staff',admin);
 state.session={...a,role:'staff'};assert.equal((await api.download(req('/api/portal/content/download?kind=reports&key=a-report'))).status,404);
 const result=await api.generateReport(tenant,'a-report','documents','staff',admin);assert.deepEqual(JSON.parse(result.body).sourceKeys,['a-doc']);
 state.session=a;assert.equal((await api.download(req('/api/portal/content/download?kind=reports&key=a-report'))).status,200);
 state.session=b;assert.equal((await api.download(req('/api/portal/content/download?kind=reports&key=a-report'))).status,404);
 assert.deepEqual((await (await api.getContent(req('/api/portal/content?kind=reports&list=1'))).json()).items,[]);
 await assert.rejects(api.generateReport(tenant,'a-report','documents','staff',otherStaff),/denied/);
});
test('Legacy unowned content is administrator-only; membership and assignment errors cannot widen access',async()=>{
 const legacy={...tenant,...doc(),id:'legacy',kind:'documents',version:1,state:'ready'};delete (legacy as any).customerEmail;
 // Insert the precise persisted legacy key without changing real data.
 const {createHash}=await import('node:crypto');state.rows.set('content-'+createHash('sha256').update(JSON.stringify([tenant.organizationId,'documents','a-doc'])).digest('hex'),legacy);
 for(const actor of [a,b,staff])await assert.rejects(api.readContent(tenant,'documents','a-doc',actor.role==='staff'?'staff':'member',actor),/denied/);
 assert.equal((await api.readContent(tenant,'documents','a-doc','staff',admin)).id,'legacy');
 await assert.rejects(api.setCustomerStaff(tenant,admin,{customerEmail:'missing@example.test',staffEmails:[]}),/membership/);
 await assert.rejects(api.setCustomerStaff(tenant,admin,{customerEmail:a.email,staffEmails:[b.email]}),/staff membership/);
});
test('Legacy document and message launchers cannot expose organization-wide customer data',async()=>{
 assert.deepEqual(await api.listPortalDocuments('are-you-fundable',{id:'recSHARED',email:a.email}),[]);
 assert.deepEqual(await api.listPortalMessagingThreads('are-you-fundable',{id:'recSHARED',email:a.email}),{threads:[],pendingCount:0,publishedCount:0});
});
test('Assigned staff cannot combine two customers in one report or write using a forged session role',async()=>{
 await api.setCustomerStaff(tenant,admin,{customerEmail:b.email,staffEmails:[staff.email]});
 for(const [email,key] of [[a.email,'a-doc'],[b.email,'b-doc']])await api.saveContent(tenant,'documents',doc(email,key),'staff',admin);
 await api.saveContent(tenant,'reports',{key:'a-report',title:'Synthetic inventory',customerEmail:a.email,visibility:'staff'},'staff',staff);
 const report=await api.generateReport(tenant,'a-report','documents','staff',staff);assert.deepEqual(JSON.parse(report.body).sourceKeys,['a-doc']);
 state.session={...b,role:'staff'};const denied=await api.postContent(req('/api/portal/content',{kind:'documents',action:'save',...doc(b.email,'forged-staff')}));assert.notEqual(denied.status,200);
 state.members.get(tenant.organizationId+'/'+staff.email).status='suspended';
 await assert.rejects(api.readContent(tenant,'reports','a-report','staff',staff),/denied/);
});
test('Cross-origin and missing-origin AYF mutations cannot change assignments or messages',async()=>{
 for(const origin of [undefined,'https://untrusted.example.test']){
  const request=(url:string,body:unknown)=>new NextRequest('https://ayf.example.test'+url,{method:'POST',headers:{'Content-Type':'application/json',...(origin?{Origin:origin}:{})},body:JSON.stringify(body)});
  const count=state.rows.size;
  assert.equal((await api.assign(request('/api/portal/ayf/customer-access',{customerEmail:a.email,staffEmails:[]}))).status,403);
  assert.equal((await api.postMessages(request('/api/portal/final-bricks',{kind:'messaging',action:'create',key:'forged',title:'Blocked',body:'Synthetic',customerEmail:a.email}))).status,403);
  assert.equal((await api.postContent(request('/api/portal/content',{kind:'documents',action:'save',...doc()}))).status,403);
  assert.equal(state.rows.size,count);
 }
});
test('Reusing an email with a different customer or staff membership cannot inherit prior access',async()=>{
 await api.saveContent(tenant,'documents',doc(),'staff',admin);
 state.members.get(tenant.organizationId+'/'+a.email).id='recREPLACEMENT';state.session=a;
 assert.equal((await api.download(req('/api/portal/content/download?kind=documents&key=a-doc'))).status,404);
 await api.saveContent(tenant,'reports',{key:'replacement-report',title:'Synthetic replacement',visibility:'staff',customerEmail:a.email},'staff',admin);
 assert.deepEqual(JSON.parse((await api.generateReport(tenant,'replacement-report','documents','staff',admin)).body).sourceKeys,[]);
 state.session=staff;assert.equal((await api.download(req('/api/portal/content/download?kind=documents&key=a-doc'))).status,404);
 state.members.get(tenant.organizationId+'/'+a.email).id='reca';state.members.get(tenant.organizationId+'/'+staff.email).id='recNEWSTAFF';
 assert.equal((await api.download(req('/api/portal/content/download?kind=documents&key=a-doc'))).status,404);
 state.session=admin;assert.equal((await api.download(req('/api/portal/content/download?kind=documents&key=a-doc'))).status,200);
});

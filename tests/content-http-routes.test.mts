import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { writeFileSync,unlinkSync } from 'node:fs';
import { NextRequest } from 'next/server.js';
import { File } from 'node:buffer';

(globalThis as any).File=File;
const state={role:'staff',slug:'tenant-content',rows:new Map<string,any>(),writes:new Map<string,number>()};
(globalThis as any).__contentHttp=state;
const durable=`import {createHash} from 'node:crypto';
 export const brickHash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
 export async function readBrickRecord(t,id){const s=globalThis.__contentHttp,row=s.rows.get(id);
 if(row&&(row.organizationId!==t.organizationId||row.portalSlug!==t.portalSlug))throw Error('Tenant mismatch');
 return row?structuredClone(row):null;}
 export async function writeBrickRecord(t,id,row){const s=globalThis.__contentHttp;
 if(row.organizationId!==t.organizationId||row.portalSlug!==t.portalSlug)throw Error('Tenant mismatch');
 s.rows.set(id,structuredClone(row));s.writes.set(id,(s.writes.get(id)||0)+1);return row;}`;
const mocks:Record<string,string>={
 '@/lib/bricks/durable':durable,'./durable':durable,
 '@/lib/modules/tenant-install':"export async function loadTenantInstall(org){return {organizationId:org,portalSlug:org==='recONE123'?'tenant-content':'another',state:'installed',admitted:['documents','resources','dashboard','reports']};}",
 '@/lib/api/portal-route':"export async function guardPortalApi(){const s=globalThis.__contentHttp;return {ok:true,session:{role:s.role,slug:s.slug}};}export function portalTenant(s){return {portalSlug:s.slug};}export function portalApiUnauthorized(){return Response.json({error:'No access'},{status:401});}",
 '@/lib/bricks/content-portal':"export async function portalContentDefault(slug,kind){return {organizationId:slug==='tenant-content'?'recONE123':'recTWO456',portalSlug:slug,key:kind==='reports'?'operational-report':'getting-started',title:'Tenant content'};}"
};
const b=await build({stdin:{contents:
 "export {POST as upload} from './app/api/portal/content/upload/route';"+
 "export {GET as download} from './app/api/portal/content/download/route';"+
 "export {GET as getContent,POST as postContent} from './app/api/portal/content/route';"+
 "export {saveContent,readContent,listContent} from './lib/bricks/content-family';",
 resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'esm',packages:'external',
 plugins:[{name:'ports',setup(p){
 p.onResolve({filter:/.*/},a=>Object.hasOwn(mocks,a.path)?{path:a.path,namespace:'fixture'}:undefined);
 p.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js',resolveDir:process.cwd()}));
 }}]});
const artifact='tests/.content-http-bundle.mjs';writeFileSync(artifact,b.outputFiles[0].text);
const api=await import('../'+artifact);unlinkSync(artifact);
const base='https://ea.example';
const tenant={organizationId:'recONE123',portalSlug:'tenant-content'};
const reset=()=>{state.role='staff';state.slug='tenant-content';state.rows.clear();state.writes.clear()};
test('Documents upload MIME policy, durable identity, authorized download and tenant isolation',async()=>{
 reset();
 const form=new FormData();form.set('kind','documents');form.set('visibility','staff');
 form.set('file',new File(['Hello document'],'notes.txt',{type:'text/plain'}));
 const req=()=>new NextRequest(base+'/api/portal/content/upload',{method:'POST',body:form});
 const first=await api.upload(req());assert.equal(first.status,200);
 const uploaded=await first.json();assert.equal(uploaded.ok,true);
 const second=await api.upload(req());assert.equal(second.status,200);
 assert.equal((await second.json()).key,uploaded.key);
 const row=await api.readContent(tenant,'documents',uploaded.key,'staff');
 assert.equal(state.writes.get(row.id),1);
 const url=base+'/api/portal/content/download?kind=documents&key='+uploaded.key;
 const ok=await api.download(new NextRequest(url));assert.equal(ok.status,200);
 assert.equal(await ok.text(),'Hello document');
 assert.equal(ok.headers.get('X-Content-Type-Options'),'nosniff');
 state.role='member';
 assert.equal((await api.download(new NextRequest(url))).status,404);
 state.role='staff';state.slug='another';
 assert.equal((await api.download(new NextRequest(url))).status,404);
 state.slug='tenant-content';
 const bad=new FormData();bad.set('file',new File(['<html>unsafe</html>'],'bad.html',{type:'text/html'}));
 assert.equal((await api.upload(new NextRequest(base+'/api/portal/content/upload',{method:'POST',body:bad}))).status,400);
});
test('Resources staff upload and member-protected delivery with authorized list',async()=>{
 reset();const form=new FormData();form.set('kind','resources');form.set('visibility','member');
 form.set('file',new File(['Resource guide'],'guide.md',{type:'text/markdown'}));
 const result=await api.upload(new NextRequest(base+'/api/portal/content/upload',{method:'POST',body:form}));
 assert.equal(result.status,200);const {key}=await result.json();state.role='member';
 const url=base+'/api/portal/content/download?kind=resources&key='+key;
 assert.equal((await api.download(new NextRequest(url))).status,200);
 const list=await api.getContent(new NextRequest(base+'/api/portal/content?kind=resources&list=1'));
 assert.equal(list.status,200);assert.ok((await list.json()).items.some((x:any)=>x.key===key));
 const denied=await api.postContent(new NextRequest(base+'/api/portal/content',{method:'POST',
  headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'resources',action:'save',key:'evil',title:'x',visibility:'member'})}));
 assert.equal(denied.status,403);
});
test('Reports source-backed generation, artifact readback, ACL and deterministic replay',async()=>{
 reset();await api.saveContent(tenant,'documents',{key:'source-1',title:'Input',visibility:'staff'},'staff');
 await api.saveContent(tenant,'reports',{key:'operational-report',title:'Report',visibility:'staff'},'staff');
 const generate=()=>new NextRequest(base+'/api/portal/content',{method:'POST',
 headers:{'Content-Type':'application/json'},
 body:JSON.stringify({kind:'reports',action:'generate',key:'operational-report',sourceKind:'documents'})});
 const a=await api.postContent(generate());assert.equal(a.status,200);
 const b=await api.postContent(generate());assert.equal(b.status,200);
 assert.deepEqual((await a.json()).content,(await b.json()).content);
 const url=base+'/api/portal/content/download?kind=reports&key=operational-report';
 const data=await api.download(new NextRequest(url));assert.equal(data.status,200);
 const report=JSON.parse(await data.text());assert.equal(report.source,'documents');assert.ok(report.sourceKeys.includes('source-1'));
 state.role='member';assert.equal((await api.download(new NextRequest(url))).status,404);
});

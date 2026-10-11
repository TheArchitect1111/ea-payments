import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {writeFileSync,unlinkSync} from 'node:fs';
import {NextRequest} from 'next/server.js';
const db={role:'staff',slug:'tenant-test',records:new Map<string,any>()};
(globalThis as any).__finalRoute=db;
const mock:Record<string,string>={
 '@/lib/api/portal-route':"export async function guardPortalApi(){const s=globalThis.__finalRoute;return {ok:true,session:{slug:s.slug,role:s.role}};}export function portalTenant(s){return {portalSlug:s.slug};}export function portalApiUnauthorized(){return Response.json({error:'No session'},{status:401});}",
 '@/lib/bricks/final-portal':"export async function portalFinalDefault(slug,kind){if(slug!=='tenant-test')return null;return {organizationId:'recTENANT01',portalSlug:slug,kind,key:'welcome'};}",
 '@/lib/bricks/final-family':`import {createHash} from 'node:crypto';
 export const FinalKind={safeParse:x=>({success:['pulse','amplifi','update-hub','messaging','training','landing','ask','settings','ctp'].includes(x),data:x})};
 const key=(t,k,id)=>t.organizationId+':'+k+':'+id;
 export async function saveFinal(t,k,input,role){if(role!=='staff'&&['pulse','amplifi','landing','settings','ctp'].includes(k))throw Error('Staff permission required');
 const s=globalThis.__finalRoute,x=key(t,k,input.key),prior=s.records.get(x);
 if(prior){if(prior.body!==input.body)throw Error('Replay conflict');return prior;}
 const row={...t,...input,kind:k,id:x};s.records.set(x,row);return row;}
 export async function listFinal(t,k,role){return [...globalThis.__finalRoute.records.values()].filter(x=>x.organizationId===t.organizationId&&x.kind===k&&(role==='staff'||x.visibility==='member'));}
 export async function readFinal(t,k,id,role){const row=globalThis.__finalRoute.records.get(key(t,k,id));if(!row||(row.visibility==='staff'&&role!=='staff'))throw Error('Access denied');return row;}
 export async function transitionFinal(t,k,id,action,role){const row=await readFinal(t,k,id,role);if(role!=='staff'&&k!=='training')throw Error('Staff only');
 if(k==='training'&&action.state==='completed'&&action.progress!==100)throw Error('Completion needs 100%');
 const next={...row,...action};globalThis.__finalRoute.records.set(key(t,k,id),next);return next;}`
};
const buildResult=await build({stdin:{contents:"export {GET,POST} from './app/api/portal/final-bricks/route';",resolveDir:process.cwd()},
 bundle:true,write:false,platform:'node',format:'esm',packages:'external',plugins:[{name:'final-route-ports',setup(b){
 b.onResolve({filter:/.*/},a=>Object.hasOwn(mock,a.path)?{path:a.path,namespace:'ports'}:undefined);
 b.onLoad({filter:/.*/,namespace:'ports'},a=>({contents:mock[a.path],loader:'js',resolveDir:process.cwd()}));
 }}]});
const file='tests/.final-nine-http-bundle.mjs';writeFileSync(file,buildResult.outputFiles[0].text);
const api=await import('../'+file);unlinkSync(file);
const base='https://example.org/api/portal/final-bricks';
const post=(body:any)=>new NextRequest(base,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const get=(kind:string)=>new NextRequest(base+'?kind='+kind);
for(const kind of ['pulse','amplifi','update-hub','messaging','training','landing','ask','settings','ctp']){
 test(`${kind}: real authenticated portal HTTP record create/list/replay/permission/transition`,async()=>{
  db.records.clear();db.role='staff';db.slug='tenant-test';
  const input={kind,action:'create',key:'request-1',title:'New item',body:'Content',visibility:'staff',state:'draft'};
  const created=await api.POST(post(input));assert.equal(created.status,200);
  const replay=await api.POST(post(input));assert.equal(replay.status,200);
  const data=await replay.json();assert.equal(data.record.id,'recTENANT01:'+kind+':request-1');
  assert.equal(db.records.size,1);
  const list=await api.GET(get(kind));assert.equal(list.status,200);
  assert.equal((await list.json()).records.length,1);
  db.role='member';assert.equal((await api.GET(get(kind))).status,200);
  assert.equal((await (await api.GET(get(kind))).json()).records.length,0);
  db.slug='other-tenant';assert.equal((await api.GET(get(kind))).status,404);
  db.slug='tenant-test';db.role='staff';
  const change=await api.POST(post({...input,action:'transition',state:kind==='training'?'completed':'delivered',
    progress:kind==='training'?100:undefined}));
  assert.equal(change.status,200);
 });
}

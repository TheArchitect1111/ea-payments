import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { writeFileSync,unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
const db={rows:new Map<string,any>(),writes:new Map<string,number>(),failId:''};
(globalThis as any).__contentTest=db;
const mocks:Record<string,string>={
 '@/lib/modules/tenant-install':"export async function loadTenantInstall(org){return {organizationId:org,portalSlug:'tenant-content',state:'installed',admitted:['documents','resources','dashboard','reports']};}",
 '@/lib/bricks/durable': `import {createHash} from 'node:crypto';
 export const brickHash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
 export async function readBrickRecord(t,id){const row=globalThis.__contentTest.rows.get(id);if(row&&(row.organizationId!==t.organizationId||row.portalSlug!==t.portalSlug))throw Error('Brick tenant mismatch');return row?structuredClone(row):null;}
 export async function writeBrickRecord(t,id,row){const d=globalThis.__contentTest;if(d.failId===id)throw Error('Brick durable write failed');if(row.organizationId!==t.organizationId||row.portalSlug!==t.portalSlug)throw Error('Brick tenant mismatch');d.rows.set(id,structuredClone(row));d.writes.set(id,(d.writes.get(id)||0)+1);return row;}`,
};
mocks['./durable']=mocks['@/lib/bricks/durable'];
const b=await build({stdin:{contents:"export * from './lib/bricks/content-family';",resolveDir:process.cwd()},
 bundle:true,write:false,platform:'node',format:'esm',packages:'external',plugins:[{name:'ports',setup(p){
 p.onResolve({filter:/.*/},a=>Object.hasOwn(mocks,a.path)?{path:a.path,namespace:'fixture'}:undefined);
 p.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js',resolveDir:process.cwd()}));
 }}]});
const name='tests/.content-family-bundle.mjs';writeFileSync(name,b.outputFiles[0].text);
const api=await import('../'+name);unlinkSync(name);
const tenant={organizationId:'recONE123',portalSlug:'tenant-content'};
for(const kind of ['documents','resources','dashboard','reports'] as const){
 test(`${kind}: defaults, durable storage, ACL, replay, tenant partition, report completion`,async()=>{
  db.rows.clear();db.writes.clear();db.failId='';
  const def=await api.contentDefaults(tenant,kind),again=await api.contentDefaults(tenant,kind);
  assert.equal(def.id,again.id);assert.equal(db.writes.get(def.id),1);
  const input={key:'artifact-1',title:'Private file',visibility:'staff',
   ...(['documents','resources'].includes(kind)?{source:'/portal/tenant-content/documents/artifact-1'}:{})};
  const item=await api.saveContent(tenant,kind,input,'staff');
  await api.saveContent(tenant,kind,input,'staff');
  assert.equal(db.writes.get(item.id),1);
  await assert.rejects(api.readContent(tenant,kind,'artifact-1','member'),/denied/);
  assert.equal((await api.readContent(tenant,kind,'artifact-1','staff')).id,item.id);
  assert.ok((await api.listContent(tenant,kind,'staff')).some((row:any)=>row.id===item.id));
  assert.ok(!(await api.listContent(tenant,kind,'member')).some((row:any)=>row.id===item.id));
  await assert.rejects(api.readContent({...tenant,organizationId:'recTWO456'},kind,'artifact-1','staff'),/not found|mismatch/i);
  await assert.rejects(api.saveContent(tenant,kind,{...input,title:'Tampered'},'staff'),/conflict/);
  await assert.rejects(api.saveContent(tenant,kind,{...input,key:'unauthorized'},'member'),/permission/);
  if(kind==='reports'){
    const artifact='/portal/tenant-content/reports/artifact-1';
    await api.contentDefaults(tenant,'documents');
    const generated=await api.generateReport(tenant,'artifact-1','documents','staff');
    assert.equal(generated.artifact,artifact);
    assert.equal(JSON.parse(generated.body).source,'documents');
    const completed=await api.finishReport(tenant,'artifact-1',artifact,'staff');
    assert.equal(completed.state,'complete');
    const replay=await api.finishReport(tenant,'artifact-1',artifact,'staff');
    assert.deepEqual(completed,replay);
    await assert.rejects(api.finishReport(tenant,'artifact-1','/portal/other/reports/artifact-1','staff'),/mismatch/);
  }
  db.failId='content-'+createHash('sha256').update(JSON.stringify([tenant.organizationId,kind,'offline'])).digest('hex');
  const failedWrite=await api.saveContent(tenant,kind,{...input,key:'offline'},'staff').then(()=>null,(error:Error)=>error);
  assert.match(failedWrite?.message ?? '',/durable/);
 });
}

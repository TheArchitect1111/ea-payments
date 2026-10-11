import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { writeFileSync,unlinkSync } from 'node:fs';
const memory={records:new Map<string,any>(),writes:new Map<string,number>(),durable:true};
(globalThis as any).__captureTest=memory;
const mocks:Record<string,string>={
 '@/lib/modules/tenant-install':"export async function loadTenantInstall(org){return {organizationId:org,portalSlug:'tenant-capture',state:'installed',admitted:['simplifi','connect','intake','applications']};}",
 '@/lib/bricks/durable':`import {createHash} from 'node:crypto';
  export const brickHash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
  export async function readBrickRecord(t,id){const r=globalThis.__captureTest.records.get(id);if(r&&(r.organizationId!==t.organizationId||r.portalSlug!==t.portalSlug))throw Error('tenant mismatch');return r?structuredClone(r):null;}
  export async function writeBrickRecord(t,id,row){const db=globalThis.__captureTest;if(!db.durable)throw Error('durable failure');if(row.organizationId!==t.organizationId||row.portalSlug!==t.portalSlug)throw Error('tenant mismatch');db.records.set(id,structuredClone(row));db.writes.set(id,(db.writes.get(id)||0)+1);return row;}`,
};
const b=await build({stdin:{contents:"export * from './lib/bricks/capture-family';",resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'esm',packages:'external',plugins:[{name:'ports',setup(x){x.onResolve({filter:/.*/},a=>Object.hasOwn(mocks,a.path)?{path:a.path,namespace:'fixture'}:undefined);x.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js',resolveDir:process.cwd()}));}}]});
const file='tests/.capture-family-bundle.mjs';writeFileSync(file,b.outputFiles[0].text);
const api=await import('../'+file);unlinkSync(file);
const tenant={organizationId:'recTENANT123',portalSlug:'tenant-capture'};
for(const kind of ['simplifi','connect','intake','applications'] as const){
 test(`${kind}: business identity, durable capture, route, replay, tracking, isolation`,async()=>{
  memory.records.clear();memory.writes.clear();memory.durable=true;
  const input={identity:'customer-1',requestId:'request-abc',email:'PERSON@example.com',name:'A <B>',payload:{reason:'New'}};
  const a=await api.submitCapture(tenant,kind,input);
  const b=await api.submitCapture(tenant,kind,input);
  assert.deepEqual(a,b);
  assert.equal(memory.writes.get(a.id),1);
  await assert.rejects(api.submitCapture(tenant,kind,{...input,requestId:'request-other'}),/Conflicting/);
  await assert.rejects(api.readCapture({...tenant,organizationId:'recOTHER'},kind,input.identity),/tenant mismatch/);
  let confirmations=0;
  const ports={confirm:async()=>{confirmations++}};
  const first=await api.progressCapture(tenant,kind,input.identity,ports);
  const second=await api.progressCapture(tenant,kind,input.identity,ports);
  assert.deepEqual(first,second);
  assert.notEqual(first.state,a.state);
  assert.equal(confirmations,kind==='applications'?1:0);
  assert.equal(memory.records.size,3);
  memory.durable=false;
  await assert.rejects(api.submitCapture(tenant,kind,{...input,identity:'new',requestId:'request-new'}),/durable failure/);
 });
}

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {writeFileSync,unlinkSync} from 'node:fs';
const db={rows:new Map<string,any>(),writes:new Map<string,number>(),enabled:true};
(globalThis as any).__finalNine=db;
const mocks:Record<string,string>={
 '@/lib/modules/tenant-install':"export async function loadTenantInstall(org){return {organizationId:org,portalSlug:'final-tenant',state:'installed',admitted:['pulse','amplifi','update-hub','messaging','training','landing','ask','settings','ctp']};}",
 './durable':`import {createHash} from 'node:crypto';
 export const brickHash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
 export async function readBrickRecord(t,id){const r=globalThis.__finalNine.rows.get(id);if(r&&(r.organizationId!==t.organizationId||r.portalSlug!==t.portalSlug))throw Error('Tenant mismatch');return r?structuredClone(r):null;}
 export async function writeBrickRecord(t,id,row){const db=globalThis.__finalNine;if(!db.enabled)throw Error('Durable failure');if(row.organizationId!==t.organizationId||row.portalSlug!==t.portalSlug)throw Error('Tenant mismatch');db.rows.set(id,structuredClone(row));db.writes.set(id,(db.writes.get(id)||0)+1);return row;}`
};
const b=await build({stdin:{contents:"export * from './lib/bricks/final-family';",resolveDir:process.cwd()},
 bundle:true,write:false,platform:'node',format:'esm',packages:'external',plugins:[{name:'ports',setup(x){
 x.onResolve({filter:/.*/},a=>Object.hasOwn(mocks,a.path)?{path:a.path,namespace:'fixtures'}:undefined);
 x.onLoad({filter:/.*/,namespace:'fixtures'},a=>({contents:mocks[a.path],loader:'js',resolveDir:process.cwd()}));
 }}]});
const file='tests/.final-nine-bundle.mjs';writeFileSync(file,b.outputFiles[0].text);
const api=await import('../'+file);unlinkSync(file);
const tenant={organizationId:'recFINAL123',portalSlug:'final-tenant'};
const states:any={pulse:{state:'delivered'},amplifi:{state:'published'},
 'update-hub':{state:'responded',reply:'Responded'},messaging:{state:'responded',reply:'Responded'},
 training:{state:'completed',progress:100},landing:{state:'published'},
 ask:{state:'responded',reply:'Responded'},settings:{state:'ready'},ctp:{state:'completed'}};
for(const kind of Object.keys(states)){
 test(`${kind}: durable installed defaults, identity, lifecycle, ACL, replay, tenant isolation`,async()=>{
  db.rows.clear();db.writes.clear();db.enabled=true;
  const def=await api.finalDefaults(tenant,kind),def2=await api.finalDefaults(tenant,kind);
  assert.equal(def.id,def2.id);
  const item={key:'business-1',title:'Workflow',body:'Original',visibility:'staff',state:'draft'};
  const a=await api.saveFinal(tenant,kind,item,'staff');
  const b=await api.saveFinal(tenant,kind,item,'staff');
  assert.equal(a.id,b.id);assert.equal(db.writes.get(a.id),1);
  await assert.rejects(api.saveFinal(tenant,kind,{...item,body:'changed'},'staff'),/conflict/);
  await assert.rejects(api.readFinal(tenant,kind,item.key,'member'),/denied/);
  await assert.rejects(api.readFinal({...tenant,organizationId:'recOTHER456'},kind,item.key,'staff'),/not found|mismatch/i);
  const action=states[kind];
  const final=await api.transitionFinal(tenant,kind,item.key,action,'staff');
  const again=await api.transitionFinal(tenant,kind,item.key,action,'staff');
  assert.deepEqual(final,again);assert.equal(final.state,action.state);
  assert.ok((await api.listFinal(tenant,kind,'staff')).some((x:any)=>x.id===a.id));
  assert.ok(!(await api.listFinal(tenant,kind,'member')).some((x:any)=>x.id===a.id));
  if(kind==='training')await assert.rejects(api.transitionFinal(tenant,kind,item.key,{state:'completed',progress:75},'staff'),/100%/);
  if(kind==='amplifi'||kind==='landing')await assert.rejects(api.transitionFinal(tenant,kind,item.key,{state:'published'},'member'),/denied|permission/);
  db.enabled=false;
  await assert.rejects(api.saveFinal(tenant,kind,{...item,key:'offline'},'staff'),/Durable/);
 });
}

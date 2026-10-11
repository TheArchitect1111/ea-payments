import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { writeFileSync, unlinkSync } from 'node:fs';
import { MODULE_IDS } from '../lib/modules/registry';

const store = new Map<string, unknown>();
let durable = true;
const mock: Record<string,string> = {
  '@/lib/calendar/nylas': 'export async function listPortalNylasEvents(){return [];}',
  '@/lib/calendar/storage': "import {z} from 'zod'; export const CalendarConfig=z.object({}).passthrough(); export async function installCalendar(){}",
  '@/lib/discovery/storage': "import {z} from 'zod'; export const DiscoveryConfig=z.object({}).passthrough(); export async function installDiscovery(){}",
  '@/lib/people/adapter': 'export function getPeopleRepository(){return {kind:"postgres", listPersonsByOrg:async()=>[]};}',
  '@/lib/people/flags': 'export function isPeopleRuntimeAllowed(){return true;} export function isUniversalPeoplePersistEnabled(){return true;}',
  '@/lib/creative-studio/persistence': `export async function loadStudioRecordFromAirtable(type,id){return structuredClone(globalThis.__remainingBrickPort.store.get(type+':'+id)||null);}
  export async function saveStudioRecord(row){const s=globalThis.__remainingBrickPort;if(s.durable)s.store.set(row.recordType+':'+row.id,structuredClone(row.payload));return {ok:true,persistedToAirtable:s.durable};}`,
  '@/lib/portal-universal/bricks/amanda': 'export function assertBrickTenant(tenant){if(!tenant.organizationId||!tenant.portalSlug)throw Error("Invalid tenant");}',
};
(globalThis as any).__remainingBrickPort = {store, durable:true};
const bundle = await build({stdin:{contents:"export {installAdmittedModules} from './lib/bricks/module-install'; export {readBrickRecord,brickHash} from './lib/bricks/durable';",resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'esm',packages:'external',plugins:[{name:'isolate-ports',setup(b){b.onResolve({filter:/.*/},a=>Object.hasOwn(mock,a.path)?{path:a.path,namespace:'ports'}:undefined);b.onLoad({filter:/.*/,namespace:'ports'},a=>({contents:mock[a.path],loader:'js'}));}}]});
const tmp='tests/.remaining-replay-bundle.mjs';writeFileSync(tmp,bundle.outputFiles[0].text);
const api=await import('../'+tmp);unlinkSync(tmp);
const ids=MODULE_IDS.filter(id=>!['calendar','people','discovery'].includes(id));
for(const id of ids){
  test(`durable receipt lifecycle: ${id} install + idempotent replay + tenant partition`,async()=>{
    store.clear();(globalThis as any).__remainingBrickPort.durable=true;
    const tenant={organizationId:'recONE',portalSlug:'cert-one'};
    const receiptId='module-install-'+id+'-'+api.brickHash(tenant.organizationId);
    await api.installAdmittedModules(tenant,[id]);
    const first=await api.readBrickRecord(tenant,receiptId);
    assert.equal(first?.moduleId,id);assert.equal(first?.version,1);
    assert.equal(store.size,1);
    await api.installAdmittedModules(tenant,[id]);
    assert.deepEqual(await api.readBrickRecord(tenant,receiptId),first);
    assert.equal(store.size,1);
    const another={organizationId:'recTWO',portalSlug:'cert-two'};
    assert.equal(await api.readBrickRecord(another,receiptId),null);
    await api.installAdmittedModules(another,[id]);
    assert.equal(store.size,2);
    (globalThis as any).__remainingBrickPort.durable=false;
    await assert.rejects(api.installAdmittedModules({organizationId:'recTHREE',portalSlug:'cert-three'},[id]),/durable write failed/);
  });
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { writeFileSync, unlinkSync } from 'node:fs';

const data={ rows:new Map<string,any>(), writes:new Map<string,number>(), allow:true };
(globalThis as any).__commercePort=data;
const mocks: Record<string,string> = {
  '@/lib/modules/tenant-install': `export async function loadTenantInstall(org){return {organizationId:org,portalSlug:'tenant-one',state:'installed',admitted:['billing','events','member']};}`,
  '@/lib/bricks/durable': `
    import {createHash} from 'node:crypto';
    export const brickHash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
    export async function readBrickRecord(tenant,id){const db=globalThis.__commercePort;const row=db.rows.get(id)||null;if(row&&(row.organizationId!==tenant.organizationId||row.portalSlug!==tenant.portalSlug))throw Error('Brick record tenant mismatch');return row?structuredClone(row):null;}
    export async function writeBrickRecord(tenant,id,row){const db=globalThis.__commercePort;if(!db.allow)throw Error('Brick durable write failed');if(row.organizationId!==tenant.organizationId||row.portalSlug!==tenant.portalSlug)throw Error('Tenant mismatch');db.rows.set(id,structuredClone(row));db.writes.set(id,(db.writes.get(id)||0)+1);return structuredClone(row);}
  `,
};
const result=await build({stdin:{contents:"export * from './lib/bricks/commerce-family';",resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'esm',packages:'external',plugins:[{name:'commerce-ports',setup(b){b.onResolve({filter:/.*/},a=>Object.hasOwn(mocks,a.path)?{path:a.path,namespace:'ports'}:undefined);b.onLoad({filter:/.*/,namespace:'ports'},a=>({contents:mocks[a.path],loader:'js',resolveDir:process.cwd()}));}}]});
const file='tests/.commerce-family-bundle.mjs';writeFileSync(file,result.outputFiles[0].text);
const api=await import('../'+file);unlinkSync(file);
const tenant={organizationId:'recTEST123',portalSlug:'tenant-one'};
const config={offers:[{id:'event-1',title:'Launch Event',amount:100,currency:'usd'}],confirmationSubject:'Confirmed',confirmationHtml:'Hello {{name}} for {{offer}}'};
const reset=()=>{data.rows.clear();data.writes.clear();data.allow=true};
for(const kind of ['billing','events'] as const){
 test(`${kind}: durable registration/payment/confirmation, tenant isolation, replay and tracking`,async()=>{
  reset();await api.installCommerce(tenant,kind,config);await api.installCommerce(tenant,kind,config);
  const input={email:'PERSON@example.com',name:'Alice <Test>',offerId:'event-1'};
  const a=await api.registerCommerce(tenant,kind,input);
  const b=await api.registerCommerce(tenant,kind,input);
  assert.equal(a.id,b.id);assert.equal(data.writes.get('commerce-order-'+a.id),1);
  await assert.rejects(api.readCommerceOrder({...tenant,organizationId:'recOTHER'},a.id),/tenant mismatch/i);
  let confirmed=0;const reference='pi_test_abc';
  const proof={reference,organizationId:tenant.organizationId,enrollmentId:a.id,offerId:'event-1',amount:100,currency:'usd',paid:true};
  const ports={verify:async()=>proof,confirm:async ({html}:any)=>{confirmed++;assert.match(html,/&lt;Test&gt;/)}};
  await api.payCommerce(tenant,kind,a.id,reference,ports);
  await api.payCommerce(tenant,kind,a.id,reference,ports);
  const final=await api.readCommerceOrder(tenant,a.id);
  assert.equal(final.payment_status,'paid');assert.equal(final.payment_reference,reference);assert.equal(confirmed,1);
  assert.equal(data.writes.get('commerce-track-payment-'+a.id),1);
  await assert.rejects(api.payCommerce(tenant,kind,a.id,'pi_conflict',{...ports,verify:async()=>({...proof,reference:'pi_conflict'})}),/conflict/);
  await assert.rejects(api.payCommerce(tenant,kind,a.id,reference,{...ports,verify:async()=>({...proof,amount:101})}),/matching payment/);
  assert.equal(data.rows.size,4);
 });
}
test('member: durable grant, repeat, revoke, conflict, one confirmation each',async()=>{
 reset();let emails=0;const confirm=async()=>{emails++};
 const request={email:'member@example.com',memberId:'m-1',enabled:true,requestId:'request-123'};
 const a=await api.changeMemberGrant(tenant,request,confirm);
 const b=await api.changeMemberGrant(tenant,request,confirm);
 assert.equal(a.enabled,true);assert.deepEqual(a,b);assert.equal(emails,1);
 await assert.rejects(api.changeMemberGrant(tenant,{...request,enabled:false},confirm),/Conflicting member replay/);
 const revoked=await api.changeMemberGrant(tenant,{...request,enabled:false,requestId:'revoke-123'},confirm);
 assert.equal(revoked.enabled,false);assert.equal(emails,2);
});
test('fail-closed: durable storage and absent tenant entitlement reject',async()=>{
 reset();data.allow=false;
 await assert.rejects(api.changeMemberGrant(tenant,{email:'x@example.com',memberId:'m',enabled:true,requestId:'request-123'},async()=>{}),/durable/);
 await assert.rejects(api.installCommerce({...tenant,portalSlug:'wrong'},'billing',config),/entitlement/);
});

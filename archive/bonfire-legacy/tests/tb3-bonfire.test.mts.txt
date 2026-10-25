import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {writeFileSync,unlinkSync} from 'node:fs';
import {createHmac} from 'node:crypto';
const state={rows:new Map<string,any>(),writes:new Map<string,number>(),entitlements:new Map<string,any>(),persist:true};
(globalThis as any).__bonfireTest=state;
const mocks:Record<string,string>={
 '@/lib/modules/tenant-install':"export async function loadTenantInstall(org){return {organizationId:org,portalSlug:'tarris',state:'installed',admitted:['billing','member','dashboard','reports']};}",
 '@/lib/entitlements':"export async function setModuleEnabled(org,kind){const s=globalThis.__bonfireTest,row={organizationId:org,moduleId:kind,status:'active'};s.entitlements.set(org+':'+kind,row);return row;}export async function listEntitlementsForOrg(org){return [...globalThis.__bonfireTest.entitlements.values()].filter(x=>x.organizationId===org);}",
 '@/lib/bricks/durable':`import {createHash} from 'node:crypto';
 export const brickHash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
 export async function readBrickRecord(t,id){const r=globalThis.__bonfireTest.rows.get(id);if(r&&(r.organizationId!==t.organizationId||r.portalSlug!==t.portalSlug))throw Error('tenant mismatch');return r?structuredClone(r):null;}
 export async function writeBrickRecord(t,id,row){const s=globalThis.__bonfireTest;if(!s.persist)throw Error('durable unavailable');if(row.organizationId!==t.organizationId||row.portalSlug!==t.portalSlug)throw Error('tenant mismatch');s.rows.set(id,structuredClone(row));s.writes.set(id,(s.writes.get(id)||0)+1);return row;}`
};
const built=await build({stdin:{contents:"export * from './lib/tb3/bonfire-ledger';export * from './lib/tb3/bonfire-csv';export {installCommerce} from './lib/bricks/commerce-family';",resolveDir:process.cwd()},
 bundle:true,platform:'node',format:'esm',packages:'external',write:false,plugins:[{name:'mock-durable',setup(p){
 p.onResolve({filter:/.*/},a=>Object.hasOwn(mocks,a.path)?{path:a.path,namespace:'mock'}:undefined);
 p.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:mocks[a.path],loader:'js',resolveDir:process.cwd()}));
 }}]});
const file='tests/.tb3-bonfire-bundle.mjs';writeFileSync(file,built.outputFiles[0].text);const api=await import('../'+file);unlinkSync(file);
const tenant={organizationId:'recxUohHc16hPk1T3',portalSlug:'tarris'};
const order=(order_id:string)=>({order_id,product_id:'tb3-tee',product_name:'TB3 T-Shirt',
 amount_cents:100,currency:'usd',customer:{name:'Test Buyer',email:'buyer@example.com'},status:'paid'});
test('valid HMAC only, rejects malformed, wrong secret and unsigned input',()=>{
 const raw=JSON.stringify(order('order-1'));
 const secret='some-long-preview-secret';
 const sign=createHmac('sha256',secret).update(raw).digest('hex');
 assert.equal(api.bonfireSignatureValid(raw,sign,secret),true);
 assert.equal(api.bonfireSignatureValid(raw,sign+'00',secret),false);
 assert.equal(api.bonfireSignatureValid(raw,sign,'wrong'),false);
 assert.equal(api.bonfireSignatureValid(raw,null,secret),false);
});
test('TB3 $1: same-row canonical Billing paid order, tracking, Member entitlement, dashboard/report and replay',async()=>{
 state.rows.clear();state.writes.clear();state.entitlements.clear();state.persist=true;
 await api.installCommerce(tenant,'billing',{offers:[{id:'tb3-tee',title:'TB3 T-Shirt',amount:100,currency:'usd'}],
  confirmationSubject:'Merch order',confirmationHtml:'Thank you'});
 const first=await api.ingestVerifiedBonfireOrder(order('order-1'));
 const twice=await api.ingestVerifiedBonfireOrder(order('order-1'));
 assert.equal(first.replay,false);assert.equal(twice.replay,true);
 assert.equal(first.sale.payment_reference,'order-1');
 assert.equal(first.sale.payment_status,'paid');
 assert.equal(state.writes.get(first.sale.id),1);
 const canonical=[...state.rows.entries()].find(([key,row])=>key.startsWith('commerce-order-')&&row.payment_reference==='order-1');
 assert.ok(canonical,'real Billing order missing');
 assert.equal(canonical![1].payment_status,'paid');
 assert.equal(state.writes.get(canonical![0]),1);
 assert.ok([...state.rows.values()].some(x=>x.event==='payment_confirmed'&&x.source==='bonfire'));
 assert.equal(state.entitlements.get(tenant.organizationId+':member')?.status,'active');
 const second=await api.ingestVerifiedBonfireOrder(order('order-2'));
 assert.equal(second.replay,false);
 const report=await api.tb3BonfireReport();assert.equal(report.count,2);
 assert.equal(report.gross_cents,200);assert.equal(report.memberEnabled,true);
 assert.equal(report.orders.every(x=>x.organizationId===tenant.organizationId),true);
 await assert.rejects(api.ingestVerifiedBonfireOrder({...order('order-1'),amount_cents:200}),/conflict/i);
 assert.equal((await api.listTb3BonfireSales()).length,2);
});
test('fail-closed storage and offer matching',async()=>{
 await assert.rejects(api.ingestVerifiedBonfireOrder({...order('order-new-unknown-offer'),product_id:'unknown'}),/configured Billing offer/);
 state.persist=false;
 await assert.rejects(api.ingestVerifiedBonfireOrder(order('order-3')),/durable unavailable/);
 state.persist=true;
});

test('Bonfire seller CSV: 2 x $1 paid records, Member, Dashboard/Reports readback and duplicate reimport',async()=>{
 state.rows.clear();state.writes.clear();state.entitlements.clear();state.persist=true;
 await api.installCommerce(tenant,'billing',{offers:[{id:'tb3-tee',title:'TB3 T-Shirt',amount:100,currency:'usd'}],
  confirmationSubject:'Merch sale',confirmationHtml:'Thank you'});
 const csv='Order ID,Product ID,Product,Amount,Customer,Email,Date\n'+
  'csv-order-1,tb3-tee,TB3 T-Shirt,1.00,Buyer One,one@example.com,2026-10-11\n'+
  'csv-order-2,tb3-tee,TB3 T-Shirt,1.00,Buyer Two,two@example.com,2026-10-11\n';
 const a=await api.importBonfireCsv(csv);assert.deepEqual(a,{imported:2,replayed:0,total:2});
 const b=await api.importBonfireCsv(csv);assert.deepEqual(b,{imported:0,replayed:2,total:2});
 const orders=[...state.rows.entries()].filter(([k,v])=>k.startsWith('commerce-order-')&&v.source==='bonfire-csv');
 assert.equal(orders.length,2);
 assert.ok(orders.every(([k,v])=>v.payment_status==='paid'&&v.payment_reference.startsWith('csv-order-')));
 assert.ok(orders.every(([k,v])=>state.writes.get(k)===1));
 const report=await api.tb3BonfireReport();
 assert.equal(report.count,2);assert.equal(report.gross_cents,200);assert.equal(report.memberEnabled,true);
 assert.ok(report.orders.every(x=>x.tracking==='Bonfire CSV'&&x.order_date==='2026-10-11'&&x.organizationId===tenant.organizationId));
 assert.equal(state.entitlements.get(tenant.organizationId+':member')?.status,'active');
 await assert.rejects(api.importBonfireCsv(csv.replace('csv-order-1,tb3-tee,TB3 T-Shirt,1.00','csv-order-1,tb3-tee,TB3 T-Shirt,2.00')),/conflict|matching/i);
});
test('seller CSV parser rejects malformed dates, unregistered amounts and quote escapes',()=>{
 assert.throws(()=>api.parseBonfireCsv('Order ID,Product\n1,test'),/Missing required/);
 const header='Order ID,Product ID,Product,Amount,Customer,Email,Date\n';
 assert.throws(()=>api.parseBonfireCsv(header+'bad,tb3-tee,Tee,-1.00,Buyer,b@example.com,2026-10-11'),/Amount/);
 assert.throws(()=>api.parseBonfireCsv(header+'bad,tb3-tee,Tee,1.00,Buyer,b@example.com,2026-99-11'),/Date/);
 const quote=api.parseBonfireCsv(header+'quoted,tb3-tee,"TB3, Red Tee",1.00,Buyer,b@example.com,2026-10-11');
 assert.equal(quote[0].order.product_name,'TB3, Red Tee');
});

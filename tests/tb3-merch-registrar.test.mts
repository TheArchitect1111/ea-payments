import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {writeFileSync,unlinkSync,readFileSync} from 'node:fs';
const events:any[]=[];
(globalThis as any).__tb3MerchRegistrar=events;
const mock:Record<string,string>={
 '@/lib/services/brickRegistrar':`export async function registerBrickEvent(e,proof){
 globalThis.__tb3MerchRegistrar.push({e,proof});
 if(e.payment_status==='paid'&&(!proof||proof.payment_provider!=='bonfire'||proof.payment_reference!==e.payment_reference))
  return {ok:false,error:'Provider verification required'};
 return {ok:true,id:'tracked-'+e.registration_id};
 }`
};
const result=await build({stdin:{contents:"export * from './lib/tb3/brick-events';",resolveDir:process.cwd()},
 bundle:true,write:false,format:'esm',platform:'node',packages:'external',
 plugins:[{name:'registrar-port',setup(b){
 b.onResolve({filter:/.*/},a=>Object.hasOwn(mock,a.path)?{path:a.path,namespace:'stub'}:undefined);
 b.onLoad({filter:/.*/,namespace:'stub'},a=>({contents:mock[a.path],loader:'js',resolveDir:process.cwd()}));
 }}]});
const tmp='tests/.tb3-merch-registrar-bundle.mjs';
writeFileSync(tmp,result.outputFiles[0].text);
const api=await import('../'+tmp);unlinkSync(tmp);
const sale={order_id:'bonfire-id-234',offerId:'tb3-tee',customer:'TB3 Buyer',
 customer_email:'buyer@example.org',payment_reference:'bonfire-id-234'};
test('Bonfire seller CSV auto-wire registers unpaid checkout, never falsely verifies purchase',async()=>{
 events.length=0;
 await api.trackTb3MerchSale(sale,false);
 assert.equal(events.length,1);
 assert.equal(events[0].e.brick_type,'checkout');
 assert.equal(events[0].e.payment_status,'unpaid');
 assert.equal(events[0].e.status,'seller_attested_paid');
 assert.equal(events[0].e.client_id,'tarris');
 assert.equal(events[0].proof,undefined);
});
test('signed Bonfire paid callback produces matching trusted proof before payment event',async()=>{
 events.length=0;
 await api.trackTb3MerchSale(sale,true);
 assert.equal(events.length,2);
 assert.equal(events[0].e.brick_type,'checkout');
 assert.equal(events[1].e.brick_type,'payments');
 assert.equal(events[1].e.payment_status,'paid');
 assert.equal(events[1].proof.payment_provider,'bonfire');
 assert.equal(events[1].proof.payment_reference,sale.order_id);
 assert.equal(events[1].proof.registration_id,events[0].e.registration_id);
 assert.equal(events[1].proof.client_id,'tarris');
});
test('signed webhooks and seller CSV only reach tracker through TB3 helper and universal registrar',()=>{
 const webhook=readFileSync('app/api/tb3/bonfire/webhook/route.ts','utf8');
 const csv=readFileSync('app/api/bricks/bonfire-csv-import/route.ts','utf8');
 for(const source of [webhook,csv]){
  assert.match(source,/trackTb3MerchSale\(/);
  assert.doesNotMatch(source,/pushToTrackingPortal\(|confirmTrackingPayment\(|storeTrackingPayment\(/);
 }
 const adapter=readFileSync('lib/tb3/brick-events.ts','utf8');
 assert.match(adapter,/registerBrickEvent\(/);
});

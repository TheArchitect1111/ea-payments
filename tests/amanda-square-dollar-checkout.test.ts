import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { getCTA } from '../lib/amanda-catherine/class-cta-policy';
const state = { signups: [] as any[], orders: [] as any[], requests: [] as any[], saved: true, host: 'sandbox.square.link' };
(globalThis as any).__squareTest = state;
async function loadRoute() {
  const mocks: Record<string,string> = {
    'next/server': `export const NextResponse={json:(data,options={})=>({data,status:options.status||200})};`,
    '@/lib/amanda-catherine/request-origin': `export function isAllowedAmandaOrigin(r){return r.allowed!==false}`,
    '@/lib/amanda-catherine/payments': `export async function registerAmandaCheckout(i){globalThis.__squareTest.signups.push(i)}`,
    '@/lib/creative-studio/persistence': `export async function saveStudioRecord(i){globalThis.__squareTest.orders.push(i);return {ok:globalThis.__squareTest.saved,persistedToAirtable:globalThis.__squareTest.saved}}`,
    '@/lib/platform-store': `export function syntheticOrgId(){return 'org_amanda-catherine'}`,
  };
  const output = await build({entryPoints:['app/api/public/amanda/square-test/checkout/route.ts'],bundle:true,platform:'node',format:'esm',write:false,
    plugins:[{name:'mock-transports',setup(b){b.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'test'}:undefined);b.onLoad({filter:/.*/,namespace:'test'},a=>({contents:mocks[a.path],loader:'js'}))}}]});
  return import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));
}
test('Square dollar checkout is fresh, per-user, sandbox-only and durably marked test',async()=>{
  const originalFetch=globalThis.fetch;
  const oldToken=process.env.SQUARE_SANDBOX_ACCESS_TOKEN, oldLocation=process.env.SQUARE_SANDBOX_LOCATION_ID;
  const route=await loadRoute();
  const request=(email='amanda@example.invalid')=>({allowed:true,nextUrl:{origin:'https://amandacatherine.ca'},json:async()=>({name:'Test Student',email})});
  try {
    delete process.env.SQUARE_SANDBOX_ACCESS_TOKEN;delete process.env.SQUARE_SANDBOX_LOCATION_ID;
    assert.equal((await route.POST(request())).status,503,'No fallback to live credentials');
    process.env.SQUARE_SANDBOX_ACCESS_TOKEN='sandbox-fixture';process.env.SQUARE_SANDBOX_LOCATION_ID='fixture-location';
    globalThis.fetch=(async(url:any,init:any)=>{
      state.requests.push({url,body:JSON.parse(init.body)});
      return {ok:true,json:async()=>({payment_link:{order_id:'order'+state.requests.length,url:'https://'+state.host+'/u/test'+state.requests.length}})} as any;
    }) as any;
    const first=await route.POST(request()),second=await route.POST(request('brick@example.invalid'));
    assert.equal(first.status,200);assert.equal(second.status,200);assert.notEqual(first.data.registrationId,second.data.registrationId);
    assert.notEqual(state.requests[0].body.idempotency_key,state.requests[1].body.idempotency_key);
    for(const r of state.requests){assert.equal(r.url,'https://connect.squareupsandbox.com/v2/online-checkout/payment-links');assert.deepEqual(r.body.quick_pay.price_money,{amount:100,currency:'CAD'})}
    assert.deepEqual(state.signups.map(s=>s.email),['amanda@example.invalid','brick@example.invalid']);
    assert.ok(state.signups.every(s=>s.isTest===true));assert.ok(state.orders.filter(o=>o.id.startsWith('amanda-square-test-order-')).every(o=>o.payload.is_test===true&&o.payload.payment_status==='unpaid'));
    assert.equal((await route.POST(request('invalid'))).status,400);
    assert.equal((await route.POST({...request(),allowed:false})).status,403);
    state.host='square.link';assert.equal((await route.POST(request())).status,503,'Reject production checkout URLs');
    state.host='sandbox.square.link';state.saved=false;assert.equal((await route.POST(request())).status,503,'No checkout returned without durable correlation');
  } finally {globalThis.fetch=originalFetch;if(oldToken===undefined)delete process.env.SQUARE_SANDBOX_ACCESS_TOKEN;else process.env.SQUARE_SANDBOX_ACCESS_TOKEN=oldToken;if(oldLocation===undefined)delete process.env.SQUARE_SANDBOX_LOCATION_ID;else process.env.SQUARE_SANDBOX_LOCATION_ID=oldLocation;}
});
test('Wood Therapy adds one test option alongside the regular registry-backed CTA',()=>{
  const grid=readFileSync('components/amanda/AmandaClassesGrid.tsx','utf8');
  assert.equal((grid.match(/TEST — \$1 Full Workflow<\/a>/g)||[]).length,1);
  assert.match(grid,/href=\{href\}/);assert.match(grid,/wood therapy/);
  const regular=getCTA({title:'Wood Therapy',key:'wood-therapy',status:'AVAILABLE',square_checkout_url:'https://checkout.square.site/existing'});
  assert.equal(regular.label,'Register');assert.equal(regular.action,'https://checkout.square.site/existing');assert.equal(Array.isArray(regular),false);
  assert.doesNotMatch(readFileSync('lib/amanda-catherine/class-cta-policy.ts','utf8'),/brickmail|TEST|Stripe/i);
  assert.doesNotMatch(readFileSync('app/api/public/amanda/square-test/checkout/route.ts','utf8'),/process\.env\.SQUARE_ACCESS_TOKEN\b|stripe/i);
});

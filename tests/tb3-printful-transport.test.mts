import {test} from 'node:test';
import assert from 'node:assert/strict';
import {requestTb3Printful,PrintfulError} from '../lib/tb3/printful-transport';
const storeId=18945233;
type Capture={url:string;headers:Headers;method:string;body:string|undefined};
function transport(result:unknown,status=200,code=200) {
 const called:Capture[]=[];
 const fetcher:typeof fetch=async (url,init)=>{
  const request=init||{};
  called.push({url:String(url),headers:new Headers(request.headers),
   method:String(request.method||'GET'),body:request.body?.toString()});
  return new Response(JSON.stringify({code,result}),{status,
    headers:{'Content-Type':'application/json'}});
 };
 return {called,fetcher};
}
test('Printful shipping quote goes to correct store without placing any orders',async()=>{
 const t=transport([{id:'STANDARD',rate:'8.00',currency:'USD'}]);
 const quote=await requestTb3Printful('/shipping/rates',{
  method:'POST',body:JSON.stringify({recipient:{country_code:'US'},items:[]})
 },{apiKey:'test-only-fake-key',storeId,fetcher:t.fetcher});
 assert.equal((quote as unknown[]).length,1);
 assert.equal(t.called.length,1);
 assert.equal(t.called[0].url,'https://api.printful.com/shipping/rates');
 assert.equal(t.called[0].headers.get('X-PF-Store-Id'),'18945233');
 assert.equal(t.called[0].headers.get('Authorization'),'Bearer test-only-fake-key');
 assert.equal(t.called[0].method,'POST');
});
test('Printful order create is explicitly draft and does not confirm',async()=>{
 const t=transport({id:123,external_id:'tb3-test-only',status:'draft'});
 const result=await requestTb3Printful<{status:string}>('/orders?confirm=false',{
  method:'POST',body:JSON.stringify({external_id:'tb3-test-only',items:[],recipient:{}})
 },{apiKey:'not-a-real-token',storeId,fetcher:t.fetcher});
 assert.equal(result.status,'draft');
 assert.equal(t.called[0].url,'https://api.printful.com/orders?confirm=false');
 assert.equal(t.called.filter(x=>x.url.includes('/confirm')).length,0);
});
test('Printful HTTP 409 leaves decision to idempotent caller',async()=>{
 const t=transport({},409,409);
 await assert.rejects(
  requestTb3Printful('/orders?confirm=false',{method:'POST'},
   {apiKey:'fake',storeId,fetcher:t.fetcher}),
  (e:unknown)=>e instanceof PrintfulError&&e.status===409);
});
test('Printful failed provider response cannot masquerade as success',async()=>{
 const t=transport({id:1},200,400);
 await assert.rejects(requestTb3Printful('/orders',{},
  {apiKey:'fake',storeId,fetcher:t.fetcher}),PrintfulError);
});
test('Printful transport fails closed without credential or with invalid URL',async()=>{
 const t=transport([]);
 await assert.rejects(requestTb3Printful('/orders',{},
  {apiKey:undefined,storeId,fetcher:t.fetcher}),PrintfulError);
 await assert.rejects(requestTb3Printful('//evil.test/orders',{},
  {apiKey:'fake',storeId,fetcher:t.fetcher}),PrintfulError);
 assert.equal(t.called.length,0);
});

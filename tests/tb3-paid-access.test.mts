import assert from 'node:assert/strict';
import { test } from 'node:test';
import { requirePaidSession, entitlementActive, validateAccessToken, fulfillPaidAccess, recordAccess, revokeRefundedAccess, TB3_ACCESS_EVENTS_TABLE } from '../lib/tb3/paid-access';

const session: any = { id:'cs_live_unit',livemode:true,payment_status:'paid',mode:'payment',currency:'usd',amount_total:24900,created:1700000000,customer_details:{email:'buyer@example.invalid'},metadata:{clientId:'tarris',commerceOfferId:'tb3_72h_access',courseId:'tb3'} };

test('Reject unpaid, test, wrong-client, wrong-offer, wrong-amount and missing-email sessions',()=>{
 for(const change of [{payment_status:'unpaid'},{livemode:false},{id:'cs_test_unit'},{metadata:{...session.metadata,clientId:'other'}},{metadata:{...session.metadata,commerceOfferId:'project-deposit'}},{amount_total:100},{customer_details:{email:''}}]) assert.throws(()=>requirePaidSession({...session,...change}));
 assert.equal(requirePaidSession(session),'buyer@example.invalid');
});
test('Expired, revoked and foreign records cannot grant access',()=>{
 const record:any={fields:{Status:'active',Course:'tb3',Entitlement:'tb3:72h:live','Session ID':'cs_live_unit','Expires At':new Date(Date.now()+100000).toISOString()}};
 assert.equal(entitlementActive(record),true);
 for(const change of [{Status:'revoked'},{Course:'other'},{'Session ID':'cs_test_unit'},{'Expires At':new Date(0).toISOString()}]) assert.equal(entitlementActive({...record,fields:{...record.fields,...change}}),false);
});
test('An entitlement label or email cannot act as an access token',async()=>{
 assert.equal(await validateAccessToken('tb3:72h:livebuyer@example.invalid'),null);
});
test('Fulfillment is persisted once, tracks real-shape delivery, keeps expiry and revokes refunds',async()=>{
 process.env.STRIPE_SECRET_KEY=['sk','live','unit','test','only'].join('_');process.env.AIRTABLE_API_KEY='unit-test-only';process.env.RESEND_API_KEY='unit-test-only';process.env.RESEND_FROM_EMAIL='test@example.invalid';
 const paid:any={...session,payment_intent:{id:'pi_unit',latest_charge:{id:'ch_unit',created:Math.floor(Date.now()/1000),receipt_url:'https://pay.stripe.com/receipts/unit',refunded:false,amount_refunded:0}}};
 const stripe:any={checkout:{sessions:{retrieve:async()=>paid}}};const originalFetch=globalThis.fetch;
 let record:any=null;const events:any[]=[];let emails=0;let writes=0;
 globalThis.fetch=(async(url:any,init:any={})=>{
  const target=String(url);
  if(target.startsWith('https://api.resend.com/')){emails++;return Response.json({id:'unit_email_delivery_id'});}
  assert(target.startsWith('https://api.airtable.com/'));
  if(target.includes('/'+TB3_ACCESS_EVENTS_TABLE)){const event={id:'recEvent'+events.length,fields:JSON.parse(init.body).records[0].fields};events.push(event);return Response.json({records:[event]});}
  if(!init.method||init.method==='GET')return Response.json({records:record?[record]:[]});
  writes++;const body=JSON.parse(init.body);
  if(body.performUpsert){assert.deepEqual(body.performUpsert.fieldsToMergeOn,['Session ID']);record={id:'recUnit',fields:{...(record?.fields||{}),...body.records[0].fields}};return Response.json({records:[record]});}
  record={id:'recUnit',fields:{...record.fields,...body.fields}};return Response.json(record);
 }) as any;
 try{
  paid.payment_status='unpaid';await assert.rejects(()=>fulfillPaidAccess('cs_live_unit','https://tb3.online',stripe));assert.equal(writes,0);paid.payment_status='paid';
  const first=await fulfillPaidAccess('cs_live_unit','https://tb3.online',stripe);const expiry=record.fields['Expires At'];const second=await fulfillPaidAccess('cs_live_unit','https://tb3.online',stripe);
  assert.equal(first.accessLink,second.accessLink);assert.equal(record.fields['Expires At'],expiry);assert.equal(emails,1);assert.equal(record.fields.Email,'buyer@example.invalid');assert(!record.fields['Access Token Hash'].includes('buyer@'));
  const token=new URL(first.accessLink).searchParams.get('entitlement')!;assert.equal((await validateAccessToken(token))?.id,'recUnit');await recordAccess(record,'learning-opened');assert(record.fields['Last Access']);assert(record.fields.Activity.includes('learning-opened'));
  await Promise.all(Array.from({length:5},()=>recordAccess(record,'learning-opened')));assert.equal(events.length,6);
  await revokeRefundedAccess({livemode:true,payment_intent:'pi_unit',metadata:{clientId:'tarris',commerceOfferId:'tb3_72h_access'}} as any);assert.equal(await validateAccessToken(token),null);await assert.rejects(()=>fulfillPaidAccess('cs_live_unit','https://tb3.online',stripe));
 }finally{globalThis.fetch=originalFetch;}
});

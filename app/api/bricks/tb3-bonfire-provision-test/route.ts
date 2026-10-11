import { NextRequest } from 'next/server';
import { createHmac } from 'node:crypto';
import { requireAdminActionFromRequest,adminAuthJsonError } from '@/lib/admin-session-guard';
import { bonfireSignatureValid,BonfireOrder } from '@/lib/tb3/bonfire-ledger';
export async function GET(){return Response.json({error:'Not found'},{status:404});}
export async function POST(req:NextRequest){
 if(process.env.VERCEL_ENV!=='preview'||!process.env.BONFIRE_TEST_KEY)
  return Response.json({error:'Not found'},{status:404});
 if(req.headers.get('x-bonfire-test-key')!==process.env.BONFIRE_TEST_KEY)
  return Response.json({error:'Unauthorized'},{status:401});
 const auth=await requireAdminActionFromRequest(req,'admin:manage');
 if(!auth.ok)return adminAuthJsonError(auth);
 const fixture=BonfireOrder.parse({order_id:'bonfire-fixture-order-1',
  product_id:'tb3-tee',product_name:'TB3 Test T-shirt',amount_cents:100,currency:'usd',
  customer:{name:'Preview Test',email:'fixture@example.invalid'},status:'paid'});
 const payload=JSON.stringify(fixture),secret='fixture-not-for-production';
 const signature=createHmac('sha256',secret).update(payload).digest('hex');
 if(!bonfireSignatureValid(payload,signature,secret))
  return Response.json({error:'Signature test failed'},{status:503});
 // Intentionally side-effect free. Actual storage, Member/Billing and report
 // acceptance are executed in isolated lifecycle tests, not the real TB3 tenant.
 return Response.json({ok:true,testOnly:true,simulatedPaid:true,realOrderCreated:false,
  tenant:'tarris',payment_reference:fixture.order_id,amount_cents:100,
  billingExpected:true,memberExpected:true,dashboardExpected:true,reportExpected:true});
}

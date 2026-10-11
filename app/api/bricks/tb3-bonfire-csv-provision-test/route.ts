import { NextRequest } from 'next/server';
import { requireAdminActionFromRequest,adminAuthJsonError } from '@/lib/admin-session-guard';
import { parseBonfireCsv } from '@/lib/tb3/bonfire-csv';
export async function GET(){return Response.json({error:'Not found'},{status:404});}
export async function POST(req:NextRequest){
 if(process.env.VERCEL_ENV!=='preview'||!process.env.BONFIRE_TEST_KEY)
  return Response.json({error:'Not found'},{status:404});
 if(req.headers.get('x-bonfire-test-key')!==process.env.BONFIRE_TEST_KEY)
  return Response.json({error:'Unauthorized'},{status:401});
 const auth=await requireAdminActionFromRequest(req,'admin:manage');if(!auth.ok)return adminAuthJsonError(auth);
 const csv='Order ID,Product ID,Product,Amount,Customer,Email,Date\n'+
 'fixture-csv-1,tb3-tee,TB3 Test Shirt,1.00,Preview One,one@example.com,2026-10-11\n'+
 'fixture-csv-2,tb3-tee,TB3 Test Shirt,1.00,Preview Two,two@example.com,2026-10-11\n';
 const rows=parseBonfireCsv(csv);
 if(rows.length!==2||rows.some(r=>r.order.amount_cents!==100))
  return Response.json({error:'Invalid test fixture'},{status:503});
 // Never mutate the actual TB3 organization in a preview certification fixture.
 // Full Billing + Member + Dashboard/Reports replay is exercised in tests/tb3-bonfire.test.mts.
 return Response.json({ok:true,testOnly:true,livePayout:false,tenant:'tarris',
  fixtureOrders:rows.map(r=>r.order.order_id),totalCents:200,
  lifecycleProof:'tests/tb3-bonfire.test.mts',realOrdersWritten:false});
}

import { NextRequest } from 'next/server';
import { authorize, Tb3Error } from '@/lib/tb3/server';
import { listTb3BonfireSales,tb3BonfireReport } from '@/lib/tb3/bonfire-ledger';
export async function GET(req:NextRequest){
 try{
  await authorize(req,false);
  if(req.nextUrl.searchParams.get('format')==='csv'){
   const data=await tb3BonfireReport();
   const clean=(v:unknown)=>'"'+String(v??'').replace(/"/g,'""').replace(/^[=+@-]/,'\'&')+'"';
   const csv=['Order ID,Order Date,Product,Amount Cents,Currency,Customer,Customer Email,Payment Reference,Payment Status,Tracking',
     ...data.orders.map(o=>[o.order_id,o.order_date||'',o.product,o.amount_cents,o.currency,o.customer,o.customer_email,
       o.payment_reference,o.payment_status,o.tracking].map(clean).join(','))].join('\n');
   return new Response(csv,{headers:{'Content-Type':'text/csv; charset=utf-8',
     'Content-Disposition':'attachment; filename="tb3-bonfire-sales.csv"',
     'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }
  const sales=await listTb3BonfireSales();
  return Response.json({ok:true,sales,count:sales.length});
 }catch(e){return Response.json({error:'TB3 private sales unavailable'},{status:e instanceof Tb3Error?e.status:503});}
}

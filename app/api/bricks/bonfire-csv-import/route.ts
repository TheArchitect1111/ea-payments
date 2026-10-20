import { NextRequest } from 'next/server';
import { authorize, Tb3Error } from '@/lib/tb3/server';
import {trackTb3MerchSale} from '@/lib/tb3/brick-events';
import {listTb3BonfireSales} from '@/lib/tb3/bonfire-ledger';
import { parseBonfireCsv, importBonfireCsv, MAX_BONFIRE_CSV_BYTES } from '@/lib/tb3/bonfire-csv';
export const runtime='nodejs';
export async function GET(){return Response.json({error:'Not found'},{status:404});}
export async function POST(request:NextRequest){
 try{
  await authorize(request,true);
  const form=await request.formData(),file=form.get('file'),confirm=form.get('confirm');
  if(confirm!=='seller-attested-paid')return Response.json({error:'Seller confirmation that rows are paid is required'},{status:400});
  if(!(file instanceof File)||file.size===0||file.size>MAX_BONFIRE_CSV_BYTES)
   return Response.json({error:'CSV upload must be 1 to 120000 bytes'},{status:400});
  if(!/\.(csv|txt|md)$/i.test(file.name)||!['text/csv','application/csv','application/vnd.ms-excel','text/plain','text/markdown','application/octet-stream',''].includes(file.type))
   return Response.json({error:'Only CSV/plain-text seller export can be parsed; PDF and images belong in Documents, not payment ingestion'},{status:415});
  const csv=await file.text();
  const rows=parseBonfireCsv(csv);
  const result=await importBonfireCsv(csv);
  // Staff-attested seller exports create checkout activity, never a verified
  // payment event or paid confirmation. Only signed provider proof may do that.
  const saleIndex=await listTb3BonfireSales();
  for(const {order} of rows){
   const sale=saleIndex.find(x=>x.order_id===order.order_id);
   if(!sale)throw new Error('Imported sale missing tenant ledger read-back');
   await trackTb3MerchSale(sale,false);
  }
  return Response.json({ok:true,...result,source:'Bonfire CSV',moneyMoved:false});
 }catch(e){
  if(e instanceof Tb3Error)return Response.json({error:'Not authorized'},{status:e.status});
  console.error('[tb3 bonfire CSV] rejected',e);
  return Response.json({error:e instanceof Error?e.message:'Import failed'},{status:422});
 }
}

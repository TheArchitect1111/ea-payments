import { z } from 'zod';
import { ingestVerifiedBonfireOrder, BonfireOrder } from './bonfire-ledger';

export const MAX_BONFIRE_CSV_BYTES=120_000;
const columns=['order id','product id','product','amount','customer','email','date'] as const;
export function parseBonfireCsv(csv:string){
 if(Buffer.byteLength(csv,'utf8')>MAX_BONFIRE_CSV_BYTES)throw Error('CSV exceeds 120KB');
 const records:string[][]=[];let row:string[]=[],field='',quoted=false;
 const source=csv.replace(/^\uFEFF/,'');
 for(let i=0;i<source.length;i++){
  const c=source[i];
  if(c==='"'){if(quoted&&source[i+1]==='"'){field+='"';i++;}else if(!quoted&&!field)quoted=true;else if(quoted)quoted=false;else throw Error('Invalid CSV quoting');}
  else if(c===','&&!quoted){row.push(field);field='';}
  else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&source[i+1]==='\n')i++;row.push(field);field='';if(row.some(x=>x.trim()))records.push(row);row=[];}
  else field+=c;
 }
 if(quoted)throw Error('Unclosed CSV quote');
 row.push(field);if(row.some(x=>x.trim()))records.push(row);
 if(records.length<2||records.length>501)throw Error('CSV must contain 1 to 500 order rows');
 const headings=records.shift()!.map(x=>x.trim().toLowerCase().replace(/[_-]/g,' '));
 const indices=columns.map(x=>headings.indexOf(x));if(indices.some(x=>x<0))throw Error('Missing required Bonfire CSV columns: '+columns.filter((_,i)=>indices[i]<0).join(', '));
 const result:{order:z.infer<typeof BonfireOrder>;date:string}[]=[];
 const orders=new Map<string,string>();
 for(const row of records){
  if(row.length!==headings.length)throw Error('CSV column count mismatch');
  const [orderId,productId,product,amount,customer,email,date]=indices.map(i=>row[i].trim());
  if(!/^\d+(\.\d{1,2})?$/.test(amount))throw Error('Amount must be a nonnegative USD decimal');
  const cents=Math.round(Number(amount)*100);
  if(cents<=0||!Number.isSafeInteger(cents))throw Error('Invalid paid amount');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date+'T00:00:00Z')))throw Error('Date must be YYYY-MM-DD');
  const order=BonfireOrder.parse({order_id:orderId,product_id:productId,product_name:product,amount_cents:cents,currency:'usd',customer:{name:customer,email},status:'paid'});
  const signature=JSON.stringify(order);
  if(orders.has(order.order_id)&&orders.get(order.order_id)!==signature)throw Error('Conflicting duplicate order ID in CSV');
  if(orders.has(order.order_id))continue;
  orders.set(order.order_id,signature);result.push({order,date});
 }
 return result;
}
export async function importBonfireCsv(csv:string){
 const parsed=parseBonfireCsv(csv);
 let imported=0,replayed=0;
 for(const item of parsed){
  const result=await ingestVerifiedBonfireOrder(item.order,'bonfire-csv',item.date);
  if(result.replay)replayed++;else imported++;
 }
 return {imported,replayed,total:parsed.length};
}

import { NextRequest } from 'next/server';
import { bonfireSignatureValid,ingestVerifiedBonfireOrder } from '@/lib/tb3/bonfire-ledger';
export const runtime='nodejs';
export async function GET(){return Response.json({error:'Not found'},{status:404});}
export async function POST(req:NextRequest){
 // No verified public Bonfire order-webhook contract is documented.
 // Never accept production commerce as authenticated merely from a guessed HMAC header.
 if(process.env.VERCEL_ENV==='production'&&process.env.BONFIRE_WEBHOOK_PROTOCOL_VERIFIED!=='true')
  return Response.json({error:'Not found'},{status:404});
 const secret=process.env.BONFIRE_WEBHOOK_SECRET||'';
 if(!secret)return Response.json({error:'Not found'},{status:404});
 const body=await req.text();
 if(body.length>32000)return Response.json({error:'Payload too large'},{status:413});
 if(!bonfireSignatureValid(body,req.headers.get('x-bonfire-signature'),secret))
  return Response.json({error:'Unauthorized'},{status:401});
 try{
  const result=await ingestVerifiedBonfireOrder(JSON.parse(body));
  return Response.json({ok:true,id:result.sale.id,replay:result.replay});
 }catch(e){
  console.error('[tb3 bonfire] verified ingestion failed',e);
  return Response.json({error:'Order could not be reconciled'},{status:503});
 }
}

import {createHmac,timingSafeEqual} from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
import {subportalDb,type DeliveryRow} from '@/lib/subportal/db';
export const dynamic='force-dynamic';
type ResendEvent={type?:string;created_at?:string;data?:{email_id?:string}};
function verifySvix(body:string,id:string,ts:string,signature:string,secret:string){
  if(!/^whsec_[a-zA-Z0-9+/=_-]+$/.test(secret))return false;
  const seconds=Number(ts);
  if(!Number.isSafeInteger(seconds)||Math.abs(Math.floor(Date.now()/1000)-seconds)>300)return false;
  if(!id || !signature)return false;
  try{
    const key=Buffer.from(secret.slice(6).replace(/-/g,'+').replace(/_/g,'/'),'base64');
    if(key.length<24)return false;
    const digest=createHmac('sha256',key).update(id+'.'+ts+'.'+body).digest('base64');
    const actual=Buffer.from(digest,'utf8');
    return signature.split(/\s+/).some(part=>{
      if(!part.startsWith('v1,'))return false;
      const given=Buffer.from(part.slice(3),'utf8');
      return given.length===actual.length && timingSafeEqual(given,actual);
    });
  }catch{return false;}
}
const statuses:Record<string,'sent'|'delivered'|'bounced'|'complained'|'failed'>={
  'email.sent':'sent','email.delivered':'delivered','email.bounced':'bounced',
  'email.complained':'complained','email.delivery_delayed':'sent','email.failed':'failed',
};
export async function POST(req:NextRequest){
  const secret=process.env.RESEND_WEBHOOK_SIGNING_SECRET||'';
  if(!secret)return NextResponse.json({error:'Resend delivery tracking not configured'},{status:503});
  const raw=await req.text();
  const id=req.headers.get('svix-id')||'';
  const ts=req.headers.get('svix-timestamp')||'';
  const signature=req.headers.get('svix-signature')||'';
  if(!verifySvix(raw,id,ts,signature,secret))
    return NextResponse.json({error:'Invalid delivery webhook signature'},{status:403});
  try{
    const event=JSON.parse(raw) as ResendEvent;
    const status=event.type?statuses[event.type]:undefined;
    if(!status)return NextResponse.json({received:true,ignored:true});
    const emailId=String(event.data?.email_id||'');
    if(!/^[a-zA-Z0-9_-]{12,128}$/.test(emailId))return NextResponse.json({error:'Missing message ID'},{status:400});
    const existing=await subportalDb<DeliveryRow>('subportal_deliveries',{
      query:{email_id:'eq.'+emailId,select:'*',limit:'1'},
    });
    if(!existing[0])return NextResponse.json({received:false,retry:true},{status:503});
    const delivered=existing[0].delivery_status==='delivered';
    // Out-of-order "sent" events never overwrite previously verified delivery.
    if(delivered&&status==='sent')return NextResponse.json({received:true,replayed:true});
    const updated=await subportalDb('subportal_deliveries',{
      method:'PATCH',query:{email_id:'eq.'+emailId},
      payload:{
        delivery_status:status,delivery_event_id:id,
        ...(status==='delivered'?{delivered_at:new Date().toISOString()}:{}),
      },
    });
    if(updated.length!==1)throw new Error('Delivery event was not durably persisted');
    return NextResponse.json({received:true,delivery_status:status});
  }catch(err){
    console.error('[subportal] Resend delivery tracking failed',err);
    return NextResponse.json({error:'Delivery event persistence failed'},{status:503});
  }
}

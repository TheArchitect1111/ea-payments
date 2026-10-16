import {NextRequest,NextResponse} from 'next/server';
import {createHmac,timingSafeEqual} from 'node:crypto';
import {fulfillSubportalSquare} from '@/lib/subportal/fulfillment';
export const dynamic='force-dynamic';
function validSquareSignature(body:string,signature:string,secret:string,url:string){
  const expected=createHmac('sha256',secret).update(url+body).digest('base64');
  const a=Buffer.from(expected);const b=Buffer.from(signature);
  return a.length===b.length && timingSafeEqual(a,b);
}
export async function POST(req:NextRequest){
  const secret=process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  const url=process.env.SUBPORTAL_SQUARE_WEBHOOK_URL;
  if(!secret || !url)return NextResponse.json({error:'Square webhook not configured'},{status:503});
  const raw=await req.text();
  if(!validSquareSignature(raw,req.headers.get('x-square-hmacsha256-signature')||'',secret,url))
    return NextResponse.json({error:'Invalid Square signature'},{status:403});
  try{
    const event=JSON.parse(raw) as {type?:string;data?:{object?:{payment?:{id?:string}}}};
    if(event.type!=='payment.created' && event.type!=='payment.updated')
      return NextResponse.json({received:true,ignored:true});
    const id=event.data?.object?.payment?.id;
    if(!id)return NextResponse.json({error:'Square payment ID missing'},{status:400});
    const result=await fulfillSubportalSquare(id);
    if(result.unmapped)return NextResponse.json({received:true,ignored:true});
    return NextResponse.json({received:true,...result});
  }catch(error){
    console.error('[subportal] Square fulfillment error',error);
    return NextResponse.json({error:'Subportal Square fulfillment failed; retry required'},{status:503});
  }
}

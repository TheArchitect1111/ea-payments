import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {loadSubportalBySlug,requireSubportalOffer} from '@/lib/subportal/manifest';
import {createSubportalCheckout} from '@/lib/subportal/commerce';
export const dynamic='force-dynamic';
const Request=z.object({
  orgSlug:z.string().regex(/^[a-z0-9-]+$/),
  offerId:z.string().min(1),
  email:z.string().email(),
  name:z.string().trim().min(1).max(200),
}).strict();
export async function POST(req:NextRequest){
  try{
    const request=Request.parse(await req.json());
    const manifest=await loadSubportalBySlug(request.orgSlug);
    const offer=requireSubportalOffer(manifest,request.offerId);
    const result=await createSubportalCheckout({
      organizationId:manifest.organizationId,offerId:offer.id,
      email:request.email,name:request.name,
    });
    return NextResponse.json({ok:true,checkoutUrl:result.checkoutUrl,sessionId:result.sessionId},{
      headers:{'Cache-Control':'no-store'},
    });
  }catch(err){
    console.error('[subportal] checkout rejected',err);
    return NextResponse.json({ok:false,error:'Unable to start an authorized checkout.'},{status:400});
  }
}

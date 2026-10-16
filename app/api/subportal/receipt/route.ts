import {NextRequest,NextResponse} from 'next/server';
import {auth} from '@clerk/nextjs/server';
import {subportalDb,type DeliveryRow} from '@/lib/subportal/db';
import {loadSubportalManifest} from '@/lib/subportal/manifest';
import {subportalViewer} from '@/lib/subportal/identity';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){
  const sessionId=new URL(req.url).searchParams.get('sessionId')||'';
  if(!/^[a-zA-Z0-9_-]{5,180}$/.test(sessionId))return new Response('Not found',{status:404});
  try{
    const session=await auth();
    if(!session.userId)return new Response('Unauthorized',{status:401});
    const rows=await subportalDb<DeliveryRow>('subportal_deliveries',{
      query:{session_id:'eq.'+sessionId,select:'*',limit:'1'},
    });
    const receipt=rows[0];
    if(!receipt?.receipt_pdf_base64)return new Response('Not found',{status:404});
    const manifest=await loadSubportalManifest((receipt as DeliveryRow & {organization_id:string}).organization_id);
    const viewer=await subportalViewer(manifest);
    if(!viewer || !(viewer.studentId===receipt.student_id || viewer.owner))
      return new Response('Forbidden',{status:403});
    const file=Buffer.from(receipt.receipt_pdf_base64,'base64');
    if(!file.toString('ascii',0,5).startsWith('%PDF-'))throw new Error('Invalid stored receipt');
    return new NextResponse(new Uint8Array(file),{
      headers:{'Content-Type':'application/pdf','Content-Disposition':'inline; filename="payment-receipt.pdf"',
        'Cache-Control':'private, no-store'},
    });
  }catch(error){
    console.error('[subportal] receipt access error',error);
    return new Response('Receipt unavailable',{status:503});
  }
}

import {NextRequest,NextResponse} from 'next/server';
import {POST as submit} from '@/app/api/cigar-ctp/submit/route';
export const runtime='nodejs';
export const dynamic='force-dynamic';
/** Uses the real save and email chain, with Preview and admin guards in the shared handler. */
export async function POST(req:NextRequest){
 if(process.env.VERCEL_ENV!=='preview')return NextResponse.json({ok:false,error:'Not found.'},{status:404});
 return submit(req);
}

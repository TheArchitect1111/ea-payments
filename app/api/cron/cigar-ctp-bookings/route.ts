import {NextRequest,NextResponse} from 'next/server';
import {timingSafeEqual} from 'node:crypto';
import {pollCigarBookings} from '@/lib/cigar-ctp/booking-sync';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=300;
export async function GET(req:NextRequest){
 const secret=process.env.CRON_SECRET?.trim();
 const actual=Buffer.from(req.headers.get('authorization')??'');
 const expected=Buffer.from('Bearer '+(secret??''));
 if(!secret||actual.length!==expected.length||!timingSafeEqual(actual,expected))return NextResponse.json({ok:false},{status:401});
 if(process.env.VERCEL_ENV!=='production'||process.env.CIGAR_CTP_LIVE_SUBMISSIONS_ENABLED!=='true')return NextResponse.json({ok:true,enabled:false,checked:0});
 try{const result=await pollCigarBookings();return NextResponse.json(result,{status:result.ok?200:503,headers:{'Cache-Control':'no-store'}});}
 catch{return NextResponse.json({ok:false,error:'Cigar booking polling unavailable.'},{status:503});}
}

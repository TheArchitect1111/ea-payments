import {NextRequest,NextResponse} from 'next/server';
import {checkRateLimit} from '@/lib/ai/rate-limit';
import {extractCigarReport} from '@/lib/cigar-ctp/report-analyzer';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const send=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function POST(req:NextRequest){
 if(process.env.NODE_ENV==='production'&&process.env.VERCEL_ENV!=='preview')return send({ok:false,error:'Not available in production.'},404);
 const origin=req.headers.get('origin');
 if(origin){try{if(new URL(origin).host!==req.headers.get('host'))return send({ok:false,error:'Invalid origin.'},403);}catch{return send({ok:false,error:'Invalid origin.'},403);}}
 const key=(req.headers.get('x-forwarded-for')??'unknown').split(',')[0].slice(0,80);
 if(!checkRateLimit('cigar:upload:'+key,8,60*60*1000).ok)return send({ok:false,error:'Too many reports. Try later.'},429);
 if(Number(req.headers.get('content-length')??0)>5*1024*1024)return send({ok:false,error:'Upload too large.'},413);
 let file:FormDataEntryValue|null=null;
 try{file=(await req.formData()).get('report');}catch{return send({ok:false,error:'Invalid report form.'},400);}
 if(!(file instanceof File)||file.size>4*1024*1024)return send({ok:false,error:'Choose a report under 4 MB.'},400);
 try{return send({ok:true,analysis:await extractCigarReport(file.name,Buffer.from(await file.arrayBuffer()))});}
 catch(error){return send({ok:false,error:error instanceof Error?error.message:'Report could not be read.'},422);}
}

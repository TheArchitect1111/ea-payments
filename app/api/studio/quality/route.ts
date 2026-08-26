import {NextResponse} from 'next/server';
import {evaluatePremiumGate,RenderEvidence,StudioBrief} from '@/lib/studio/production';

export async function POST(req:Request){
 try{
  const body=await req.json() as {brief:StudioBrief;evidence:RenderEvidence};
  if(!body?.brief||!body?.evidence) return NextResponse.json({error:'brief and evidence are required'},{status:400});
  return NextResponse.json({ok:true,result:evaluatePremiumGate(body.brief,body.evidence)});
 }catch{return NextResponse.json({error:'Invalid quality gate payload'},{status:400})}
}

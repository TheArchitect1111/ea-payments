import {NextResponse} from 'next/server';
import {buildStudioPlan,StudioBrief} from '@/lib/studio/production';

export async function POST(req:Request){
 try{
  const brief=await req.json() as StudioBrief;
  if(!brief?.title||!brief?.projectType) return NextResponse.json({error:'title and projectType are required'},{status:400});
  return NextResponse.json({ok:true,plan:buildStudioPlan(brief)});
 }catch{return NextResponse.json({error:'Invalid Studio brief'},{status:400})}
}

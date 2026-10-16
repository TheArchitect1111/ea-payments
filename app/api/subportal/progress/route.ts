import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {subportalViewer} from '@/lib/subportal/identity';
import {subportalDb,type EnrollmentRow} from '@/lib/subportal/db';
import {loadSubportalBySlug,requireSubportalOffer} from '@/lib/subportal/manifest';
export const dynamic='force-dynamic';
const Progress=z.object({
  orgSlug:z.string().regex(/^[a-z0-9-]+$/),
  enrollmentId:z.string().uuid(),
  currentModule:z.string().min(1).max(100).nullable(),
  completedModules:z.array(z.string().min(1).max(100)).max(100),
}).strict();
export async function POST(req:NextRequest){
  try{
    const data=Progress.parse(await req.json());
    const manifest=await loadSubportalBySlug(data.orgSlug);
    const viewer=await subportalViewer(manifest);
    if(!viewer?.studentId)return NextResponse.json({error:'Sign in as your student identity'},{status:401});
    const enrolled=await subportalDb<EnrollmentRow>('subportal_enrollments',{
      jwt:viewer.token,
      query:{id:'eq.'+data.enrollmentId,organization_id:'eq.'+manifest.organizationId,
        student_id:'eq.'+viewer.studentId,status:'eq.active',select:'*',limit:'1'},
    });
    if(!enrolled[0])return NextResponse.json({error:'Enrollment not found'},{status:403});
    const offer=requireSubportalOffer(manifest,enrolled[0].offer_id);
    const allowed=new Set(offer.modules.map(x=>x.id));
    if((data.currentModule && !allowed.has(data.currentModule)) ||
      data.completedModules.some(x=>!allowed.has(x)))
      return NextResponse.json({error:'Module not included in this program'},{status:400});
    const rows=await subportalDb('subportal_progress',{
      jwt:viewer.token,method:'PATCH',query:{enrollment_id:'eq.'+data.enrollmentId,
        student_id:'eq.'+viewer.studentId,organization_id:'eq.'+manifest.organizationId},
      payload:{current_module:data.currentModule,completed_modules:[...new Set(data.completedModules)]},
    });
    if(rows.length!==1)return NextResponse.json({error:'Progress update not authorized'},{status:403});
    return NextResponse.json({ok:true,progress:rows[0]});
  }catch(error){
    console.error('[subportal] progress failed',error);
    return NextResponse.json({error:'Unable to save private progress'},{status:503});
  }
}

import Link from 'next/link';
import {notFound,redirect} from 'next/navigation';
import {loadSubportalBySlug} from '@/lib/subportal/manifest';
import {subportalViewer} from '@/lib/subportal/identity';
import {subportalDb,type EnrollmentRow} from '@/lib/subportal/db';
export const dynamic='force-dynamic';
type OwnerEnrollment=EnrollmentRow&{student_name:string;student_email:string};
export default async function StudentRoster({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const manifest=await loadSubportalBySlug(slug).catch(()=>null);
  if(!manifest)notFound();
  const viewer=await subportalViewer(manifest);
  if(!viewer)redirect('/portal/subportal-auth?next='+encodeURIComponent('/portal/'+slug+'/students'));
  if(!viewer.owner){
    if(viewer.studentId)redirect('/portal/'+slug+'/students/'+viewer.studentId);
    notFound();
  }
  const rows=await subportalDb<OwnerEnrollment>('subportal_enrollments',{
    jwt:viewer.token,query:{organization_id:'eq.'+manifest.organizationId,select:'*',order:'created_at.desc'},
  });
  return <main style={{maxWidth:1000,margin:'auto',padding:'32px 18px'}}>
    <p style={{color:manifest.brand.color}}>{manifest.brand.name}</p>
    <h1>Student enrollment roster</h1>
    <p>Only verified organization administrators can view this list.</p>
    <table style={{width:'100%',borderCollapse:'collapse'}}>
      <thead><tr><th align="left">Student</th><th align="left">Program</th><th align="left">Status</th><th align="left">Portal</th></tr></thead>
      <tbody>{rows.map(row=><tr key={row.id}>
        <td style={{padding:'9px 4px'}}>{row.student_name}<div style={{fontSize:12}}>{row.student_email}</div></td>
        <td>{row.program_title}</td><td>{row.status}</td>
        <td><Link href={'/portal/'+slug+'/students/'+row.student_id}>Open</Link></td>
      </tr>)}</tbody>
    </table>
  </main>;
}
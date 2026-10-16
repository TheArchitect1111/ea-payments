import Link from 'next/link';
import {notFound,redirect} from 'next/navigation';
import {loadSubportalBySlug,requireSubportalOffer} from '@/lib/subportal/manifest';
import {subportalViewer} from '@/lib/subportal/identity';
import {subportalDb,type EnrollmentRow} from '@/lib/subportal/db';
export const dynamic='force-dynamic';
type ProgressRow={enrollment_id:string;current_module:string|null;completed_modules:string[]};
export default async function StudentPortal({params}:{
  params:Promise<{slug:string;studentId:string}>;
}){
  const {slug,studentId}=await params;
  if(!/^[0-9a-f-]{36}$/.test(studentId))notFound();
  const manifest=await loadSubportalBySlug(slug).catch(()=>null);
  if(!manifest)notFound();
  const viewer=await subportalViewer(manifest);
  if(!viewer)redirect('/portal/subportal-auth?next='+encodeURIComponent('/portal/'+slug+'/students/'+studentId));
  const enrolled=await subportalDb<EnrollmentRow>('subportal_enrollments',{
    jwt:viewer.token,
    query:{organization_id:'eq.'+manifest.organizationId,student_id:'eq.'+studentId,
      status:'eq.active',select:'*',order:'created_at.asc'},
  });
  if(!enrolled.length || !(viewer.owner || viewer.studentId===studentId))notFound();
  const progress=await subportalDb<ProgressRow>('subportal_progress',{
    jwt:viewer.token,query:{organization_id:'eq.'+manifest.organizationId,
      student_id:'eq.'+studentId,select:'enrollment_id,current_module,completed_modules'},
  });
  const seen=new Map(progress.map(row=>[row.enrollment_id,row]));
  const identity=await subportalDb<{name:string}>('subportal_students',{
    query:{id:'eq.'+studentId,select:'name',limit:'1'},
  });
  const firstName=(identity[0]?.name||'Student').split(/\s+/)[0];
  const first=enrolled.some(row=>!row.first_seen_at);
  if(first){
    for(const row of enrolled.filter(e=>!e.first_seen_at)){
      await subportalDb('subportal_enrollments',{
        method:'PATCH',query:{id:'eq.'+row.id,first_seen_at:'is.null'},
        payload:{first_seen_at:new Date().toISOString()},
      });
    }
  }
  const tiles=enrolled.map(entry=>{
    const offer=requireSubportalOffer(manifest,entry.offer_id);
    const completed=new Set(seen.get(entry.id)?.completed_modules||[]);
    const next=offer.modules.find(module=>!completed.has(module.id));
    return {entry,offer,next,complete:completed.size,total:offer.modules.length};
  });
  const nextLearning=tiles.find(t=>t.next)?.next;
  return <main style={{minHeight:'100vh',background:'#f9f7f3',color:'#202521',padding:'30px 18px'}}>
    <div style={{maxWidth:990,margin:'auto'}}>
      <header style={{borderBottom:'1px solid #dedbd2',paddingBottom:24,marginBottom:28}}>
        <p style={{fontSize:13,letterSpacing:2,color:manifest.brand.color,fontWeight:700}}>{manifest.brand.name.toUpperCase()}</p>
        <h1 style={{fontFamily:'Georgia,serif',fontSize:38,margin:'12px 0'}}>Welcome, {firstName}</h1>
        <p>Your private learning experience. One clear next step at a time.</p>
      </header>
      {first?<section aria-label="Eva first login greeting" style={{background:'white',borderRadius:18,padding:24,marginBottom:22}}>
        <h2 style={{fontSize:19}}>Eva, your learning guide</h2>
        <p>Hello {firstName}! Welcome to {tiles[0].offer.title}. Your materials and progress are ready below.
          Start with Continue Learning, and return anytime to pick up where you left off.</p>
      </section>:null}
      {nextLearning?<section style={{background:manifest.brand.color,color:'white',borderRadius:16,padding:24,marginBottom:24}}>
        <p style={{fontSize:12,letterSpacing:1}}>YOUR NEXT STEP</p>
        <h2 style={{fontSize:23,margin:'8px 0 18px'}}>Continue Learning</h2>
        <Link href={nextLearning.href} style={{display:'inline-block',background:'white',color:'#202521',
          padding:'12px 18px',borderRadius:8,textDecoration:'none'}}>{nextLearning.title} →</Link>
      </section>:<p>All published lessons in your enrolled programs are complete.</p>}
      <h2 style={{fontFamily:'Georgia,serif',fontSize:27,margin:'22px 0'}}>My programs</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:15}}>
        {tiles.map(({entry,offer,next,complete,total})=><section key={entry.id}
          style={{border:'1px solid #dedbd2',borderRadius:15,background:'white',padding:23}}>
          <h3 style={{fontSize:19,margin:'0 0 12px'}}>{offer.title}</h3>
          <p>{complete} of {total} published modules complete</p>
          <progress value={complete} max={Math.max(total,1)} style={{width:'100%'}}/>
          <h4>Materials</h4>
          <ul style={{paddingLeft:18}}>{offer.modules.map(module=><li key={module.id} style={{marginBottom:9}}>
            <Link href={module.href}>{module.title}</Link>
            {(seen.get(entry.id)?.completed_modules||[]).includes(module.id)?' ✓':''}
          </li>)}</ul>
          <p style={{fontSize:14,color:'#555'}}>Next requirement: {next?.title||'All published modules completed'}</p>
        </section>)}
      </div>
      <footer style={{marginTop:35,paddingTop:20,borderTop:'1px solid #dedbd2'}}>
        Need assistance? <a href={'mailto:'+manifest.brand.supportEmail}>Contact support</a>
      </footer>
    </div>
  </main>;
}

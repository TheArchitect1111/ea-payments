import { AMANDA_OFFERS } from '@/lib/amanda-catherine/config';
export default function EnrollPage({ searchParams }: { searchParams: { course?: string }}){
  const courseId = searchParams?.course || '';
  const offer = (AMANDA_OFFERS as any[]).find((o:any)=>o.courseId===courseId);
  return (
    <div style={{maxWidth:640, margin:'0 auto', padding:'24px', fontFamily:'system-ui', color:'#111', background:'#fff', minHeight:'100vh'}}>
      <a href="/amanda-catherine">← Back</a>
      <h1 style={{marginTop:16}}>Enroll: {offer?.name || courseId}</h1>
      <p style={{color:'#555'}}>{offer ? `${offer.priceCad} CAD - Creative Studio + Client Records + Portal Form Submissions` : ''}</p>
      <form action="/api/amanda-catherine/submit" method="POST" style={{display:'grid', gap:12, marginTop:24}}>
        <input type="hidden" name="type" value="enroll" />
        <input type="hidden" name="courseId" value={courseId} />
        <label>Name<input name="name" required style={{width:'100%', padding:10, border:'1px solid #999'}}/></label>
        <label>Email<input name="email" type="email" required style={{width:'100%', padding:10, border:'1px solid #999'}}/></label>
        <label>Phone<input name="phone" style={{width:'100%', padding:10, border:'1px solid #999'}}/></label>
        <button type="submit" style={{padding:'12px', background:'#17221c', color:'#fff', border:'none'}}>Enroll - Creates Portal Records</button>
      </form>
      <p style={{marginTop:16, fontSize:12}}>This writes to Creative Studio, Client Records, and Portal Form Submissions - portal dashboard will show enrollment.</p>
    </div>
  );
}

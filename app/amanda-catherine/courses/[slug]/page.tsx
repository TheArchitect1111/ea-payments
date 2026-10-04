import { AMANDA_OFFERS } from '@/lib/amanda-catherine/config';
export default function CoursePage({ params }: { params: { slug: string }}){
  const slug = params.slug;
  const offer = (AMANDA_OFFERS as any[]).find((o:any)=>o.courseId===slug);
  return (
    <div style={{maxWidth:640, margin:'0 auto', padding:'24px', fontFamily:'system-ui'}}>
      <a href="/amanda-catherine">← Back</a>
      <h1>{offer?.name || slug}</h1>
      {!offer && <p style={{color:'orange'}}>This course is not READY - joining creates no payment</p>}
      <form action="/api/amanda-catherine/submit" method="POST" style={{display:'grid', gap:12, marginTop:24}}>
        <input type="hidden" name="type" value="waitlist" />
        <input type="hidden" name="courseId" value={slug} />
        <label>Name<input name="name" required style={{width:'100%', padding:10, border:'1px solid #999'}}/></label>
        <label>Email<input name="email" type="email" required style={{width:'100%', padding:10, border:'1px solid #999'}}/></label>
        <label>Phone<input name="phone" style={{width:'100%', padding:10, border:'1px solid #999'}}/></label>
        <label>Course interested in<input name="Course interested in" defaultValue={offer?.name || slug} style={{width:'100%', padding:10, border:'1px solid #999'}}/></label>
        <label>Message<textarea name="message" rows={3} style={{width:'100%', padding:10, border:'1px solid #999'}}/></label>
        <button type="submit" style={{padding:'12px', background:'#17221c', color:'#fff', border:'none'}}>Join Waitlist - amanda_waitlist table</button>
      </form>
    </div>
  );
}

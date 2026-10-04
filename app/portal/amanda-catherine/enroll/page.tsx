export default function EnrollPage({ searchParams }: { searchParams: { course?: string } }){
  const courseId = searchParams?.course || '';
  const pretty = courseId.replace(/-/g,' ').replace(/\b\w/g,(c:string)=>c.toUpperCase()) || 'Amanda Catherine Program';
  return (
    <div style={{maxWidth:640, margin:'0 auto', padding:'24px', fontFamily:'system-ui', color:'#111', background:'#fff'}}>
      <a href="/amanda-catherine" style={{color:'#17221c'}}>← Back to Amanda</a>
      <h1 style={{marginTop:16, fontSize:28}}>Enroll: {pretty}</h1>
      <p style={{color:'#444'}}>Complete enrollment - saves to <b>Creative Studio</b> + <b>Portal Form Submissions</b> + <b>Client Records</b></p>
      <p style={{fontSize:12, color:'#888'}}>Course ID: {courseId || 'not specified'}</p>
      
      <form action="/api/amanda-catherine/submit" method="POST" style={{marginTop:24, display:'grid', gap:12}}>
        <input type="hidden" name="type" value="enroll" />
        <input type="hidden" name="courseId" value={courseId} />
        <label>Name<input name="name" required style={{display:'block', width:'100%', padding:'10px', border:'1px solid #ccc', marginTop:4}} /></label>
        <label>Email<input name="email" type="email" required style={{display:'block', width:'100%', padding:'10px', border:'1px solid #ccc', marginTop:4}} /></label>
        <label>Phone<input name="phone" style={{display:'block', width:'100%', padding:'10px', border:'1px solid #ccc', marginTop:4}} /></label>
        <button type="submit" style={{padding:'12px 20px', background:'#17221c', color:'#fff', border:'none', cursor:'pointer', fontSize:16}}>Submit Enrollment - Goes to Creative Studio</button>
      </form>

      <div style={{marginTop:24, padding:12, background:'#f6f6f3', fontSize:12}}>
        <b>Debug:</b> <a href="/api/amanda-catherine/schema">/api/amanda-catherine/schema</a>
      </div>
    </div>
  );
}

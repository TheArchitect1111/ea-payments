export default function ApplyPage({ searchParams }: { searchParams: { form?: string } }){
  const formId = searchParams?.form || 'general-consultation';
  const pretty = formId.replace(/-/g,' ').replace(/\b\w/g,(c:string)=>c.toUpperCase());
  return (
    <div style={{maxWidth:640, margin:'0 auto', padding:'24px', fontFamily:'system-ui', color:'#111', background:'#fff', minHeight:'100vh'}}>
      <a href="/amanda-catherine" style={{color:'#17221c'}}>← Back to Amanda</a>
      <h1 style={{marginTop:16, fontSize:28, color:'#111'}}>Apply: {pretty}</h1>
      <p style={{color:'#333'}}>Submit your application — no account required. Saves to <b>Portal Form Submissions</b></p>
      <p style={{fontSize:12, color:'#666'}}>Form ID: {formId}</p>
      
      <form action="/api/amanda-catherine/submit" method="POST" style={{marginTop:24, display:'grid', gap:12}}>
        <input type="hidden" name="type" value="application" />
        <input type="hidden" name="formId" value={formId} />
        <label style={{color:'#111'}}>Name<input name="name" required style={{display:'block', width:'100%', padding:'10px', border:'1px solid #999', marginTop:4, color:'#111', background:'#fff'}} /></label>
        <label style={{color:'#111'}}>Email<input name="email" type="email" required style={{display:'block', width:'100%', padding:'10px', border:'1px solid #999', marginTop:4, color:'#111', background:'#fff'}} /></label>
        <label style={{color:'#111'}}>Phone<input name="phone" style={{display:'block', width:'100%', padding:'10px', border:'1px solid #999', marginTop:4, color:'#111', background:'#fff'}} /></label>
        <label style={{color:'#111'}}>Organization (if applicable)<input name="organization" style={{display:'block', width:'100%', padding:'10px', border:'1px solid #999', marginTop:4, color:'#111', background:'#fff'}} /></label>
        <label style={{color:'#111'}}>Message<textarea name="message" rows={5} style={{display:'block', width:'100%', padding:'10px', border:'1px solid #999', marginTop:4, color:'#111', background:'#fff'}}></textarea></label>
        <button type="submit" style={{padding:'12px 20px', background:'#17221c', color:'#fff', border:'none', cursor:'pointer', fontSize:16}}>Submit Application - Goes to Portal Form Submissions</button>
      </form>
    </div>
  );
}

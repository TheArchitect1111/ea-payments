import { AMANDA_PORTAL_FORMS } from '@/lib/amanda-catherine/config';
export default function ApplyPage({ searchParams }: { searchParams: { form?: string }}){
  const formId = searchParams?.form || 'general-consultation';
  const formDef = ([...AMANDA_PORTAL_FORMS]).find((f:any)=>f.id===formId);
  return (
    <div style={{maxWidth:640, margin:'0 auto', padding:'24px', fontFamily:'system-ui', color:'#111', background:'#fff', minHeight:'100vh'}}>
      <a href="/amanda-catherine">← Back</a>
      <h1>{formDef?.title || formId}</h1>
      <p style={{color:'#555'}}>Saves to Portal Form Submissions - portal tracks status</p>
      <form action="/api/amanda-catherine/submit" method="POST" style={{display:'grid', gap:12, marginTop:24}}>
        <input type="hidden" name="type" value="application" />
        <input type="hidden" name="formId" value={formId} />
        <label>Name<input name="name" required style={{width:'100%', padding:10, border:'1px solid #999'}}/></label>
        <label>Email<input name="email" type="email" required style={{width:'100%', padding:10, border:'1px solid #999'}}/></label>
        <label>Phone<input name="phone" style={{width:'100%', padding:10, border:'1px solid #999'}}/></label>
        <label>Organization<input name="organization" style={{width:'100%', padding:10, border:'1px solid #999'}}/></label>
        <label>Message<textarea name="message" rows={5} style={{width:'100%', padding:10, border:'1px solid #999'}}/></label>
        <button type="submit" style={{padding:'12px', background:'#17221c', color:'#fff', border:'none'}}>Submit Application - Portal Form Submissions</button>
      </form>
    </div>
  );
}

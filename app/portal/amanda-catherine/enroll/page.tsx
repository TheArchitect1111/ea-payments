import { AMANDA_OFFERS } from '@/lib/amanda-catherine/config';
export default function EnrollPage({ searchParams }: { searchParams: { course?: string, type?: string }}){
  const courseId = searchParams?.course || 'body-sculpt-certification';
  const type = searchParams?.type || 'enroll';
  const offer = ([...AMANDA_OFFERS]).find((o:any)=>o.courseId===courseId);
  const isKit = type==='kit' || courseId.includes('kit');
  return (
    <div style={{background:'#fcfaf7', minHeight:'100vh', fontFamily:'-apple-system, system-ui'}}>
      <div style={{maxWidth:560, margin:'0 auto', padding:'48px 24px'}}>
        <a href="/amanda-catherine" style={{fontSize:12, letterSpacing:'0.1em', textDecoration:'none', color:'#111', opacity:0.6}}>← RETURN</a>
        <div style={{marginTop:48, background:'#fff', border:'1px solid #e8e2d9', padding:'40px'}}>
          <div style={{fontSize:10, letterSpacing:'0.3em', opacity:0.5, marginBottom:12}}>{isKit ? 'PRACTITIONER KIT' : 'CERTIFICATION ENROLLMENT'}</div>
          <h1 style={{fontSize:28, fontWeight:300, margin:0}}>{isKit ? 'Practitioner Kit — $499 CAD' : (offer?.name || 'Body Sculpt Certification')}</h1>
          <p style={{marginTop:12, fontSize:14, lineHeight:1.6, opacity:0.6}}>You are one step away. Complete your details below to secure your place.</p>
          <div style={{marginTop:24, height:1, background:'#e8e2d9'}} />
          <form action="/api/amanda-catherine/submit" method="POST" style={{marginTop:32, display:'grid', gap:20}}>
            <input type="hidden" name="type" value={isKit ? 'kit' : 'enroll'} />
            <input type="hidden" name="courseId" value={courseId} />
            <div><label style={{display:'block', fontSize:11, letterSpacing:'0.15em', marginBottom:8, opacity:0.7}}>FULL NAME</label><input name="name" required style={{width:'100%', padding:'14px 16px', border:'1px solid #d8d2c9', background:'#fcfaf7', fontSize:15}} placeholder="Jane Doe" /></div>
            <div><label style={{display:'block', fontSize:11, letterSpacing:'0.15em', marginBottom:8, opacity:0.7}}>EMAIL</label><input name="email" type="email" required style={{width:'100%', padding:'14px 16px', border:'1px solid #d8d2c9', background:'#fcfaf7', fontSize:15}} placeholder="jane@email.com" /></div>
            <div><label style={{display:'block', fontSize:11, letterSpacing:'0.15em', marginBottom:8, opacity:0.7}}>PHONE</label><input name="phone" style={{width:'100%', padding:'14px 16px', border:'1px solid #d8d2c9', background:'#fcfaf7', fontSize:15}} /></div>
            <button type="submit" style={{marginTop:12, width:'100%', padding:'18px', background:'#111', color:'#fff', border:'none', fontSize:12, letterSpacing:'0.15em'}}>{isKit ? 'COMPLETE PURCHASE' : 'COMPLETE ENROLLMENT'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}

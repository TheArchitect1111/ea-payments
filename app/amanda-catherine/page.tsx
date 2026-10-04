import { AMANDA_OFFERS, AMANDA_PORTAL_FORMS, AMANDA_PRACTITIONER } from '@/lib/amanda-catherine/config';

export default function AmandaPage(){
  return (
    <div style={{maxWidth:1080, margin:'0 auto', padding:'24px'}}>
      <header style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <a href="/amanda-catherine"><h1>AMANDA CATHERINE BODY SCULPT</h1></a>
        <nav style={{display:'flex', gap:12}}>
          <a href="/portal/amanda-catherine/apply?form=general-consultation">Apply</a>
          <a href="/amanda-catherine/courses/body-sculpt-certification">Courses</a>
          <a href="/amanda-catherine/private/practitioner-kit">Kit $499</a>
        </nav>
      </header>

      <section style={{marginTop:48}}>
        <h2>Practitioner Trainings - Certified Practitioner Audience</h2>
        <p>Storage: Creative Studio + Portal Form Submissions + Client Records</p>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16, marginTop:16}}>
          {AMANDA_OFFERS.filter((o:any)=>o.audience==='certified-practitioner').map((offer:any)=>(
            <div key={offer.courseId} style={{border:'1px solid #ddd', padding:16}}>
              <h3>{offer.name}</h3>
              <p>{offer.priceCad} CAD</p>
              <a href={`/portal/amanda-catherine/enroll?course=${offer.courseId}`} style={{display:'inline-block', padding:'10px 16px', background:'#17221c', color:'#fff', textDecoration:'none'}}>Enroll Now - Goes to Creative Studio</a>
              <div style={{marginTop:8}}><a href={`/amanda-catherine/courses/${offer.courseId}`}>Waitlist - amanda_waitlist</a></div>
            </div>
          ))}
        </div>
      </section>

      <section style={{marginTop:48}}>
        <h2>Student / Trainee Courses</h2>
        <p>Storage: Creative Studio + Portal Form Submissions + Client Records (training) + amanda_waitlist (waitlist)</p>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16, marginTop:16}}>
          {AMANDA_OFFERS.filter((o:any)=>o.audience==='student-trainee').map((offer:any)=>(
            <div key={offer.courseId} style={{border:'1px solid #ddd', padding:16}}>
              <h3>{offer.name}</h3>
              <p>{offer.priceCad} CAD</p>
              <a href={`/portal/amanda-catherine/enroll?course=${offer.courseId}`} style={{display:'inline-block', padding:'10px 16px', background:'#17221c', color:'#fff', textDecoration:'none'}}>Enroll - Creative Studio</a>
              <div style={{marginTop:8}}><a href={`/amanda-catherine/courses/${offer.courseId}`}>Join Waitlist - amanda_waitlist</a></div>
            </div>
          ))}
        </div>
      </section>

      <section style={{marginTop:48}}>
        <h2>Practitioner Application Forms - Portal Form Submissions</h2>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16, marginTop:16}}>
          {AMANDA_PORTAL_FORMS.filter((f:any)=>f.audience==='certified-practitioner').map((form:any)=>(
            <div key={form.id} style={{border:'1px solid #ddd', padding:16}}>
              <h4>{form.title}</h4>
              <p style={{fontSize:12, color:'#666'}}>{form.id}</p>
              <a href={`/portal/amanda-catherine/apply?form=${form.id}`} style={{display:'inline-block', padding:'8px 12px', background:'#333', color:'#fff', textDecoration:'none'}}>Apply - Portal Form Submissions</a>
            </div>
          ))}
        </div>
      </section>

      <section style={{marginTop:48}}>
        <h2>Student Application Forms</h2>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16, marginTop:16}}>
          {AMANDA_PORTAL_FORMS.filter((f:any)=>f.audience==='student-trainee').map((form:any)=>(
            <div key={form.id} style={{border:'1px solid #ddd', padding:16}}>
              <h4>{form.title}</h4>
              <p style={{fontSize:12, color:'#666'}}>{form.id}</p>
              <a href={`/portal/amanda-catherine/apply?form=${form.id}`} style={{display:'inline-block', padding:'8px 12px', background:'#333', color:'#fff', textDecoration:'none'}}>Apply - Portal Form Submissions</a>
            </div>
          ))}
        </div>
      </section>

      <section style={{marginTop:48, padding:24, background:'#f5f5f0'}}>
        <h2>BODY SCULPT Practitioner Kit - $499 CAD</h2>
        <p>Creative Studio + Client Records</p>
        <a href="/amanda-catherine/private/practitioner-kit" style={{display:'inline-block', padding:'12px 20px', background:'#17221c', color:'#fff', textDecoration:'none'}}>Buy Kit $499</a>
      </section>

      <section style={{marginTop:48}}>
        <h3>Debug</h3>
        <p><a href="/api/amanda-catherine/schema">Check /api/amanda-catherine/schema - verifies 4 tables exist</a></p>
      </section>
    </div>
  );
}

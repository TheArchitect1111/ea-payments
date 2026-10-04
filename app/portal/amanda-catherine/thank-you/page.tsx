export default function ThankYou({ searchParams }: { searchParams: { type?: string, course?: string }}){
  return (
    <div style={{maxWidth:640, margin:'0 auto', padding:'48px 24px', textAlign:'center', fontFamily:'system-ui'}}>
      <h1>Thank you!</h1>
      <p>Your {searchParams?.type || 'submission'} {searchParams?.course ? `for ${searchParams.course}` : ''} was saved to Airtable.</p>
      <p style={{fontSize:12, color:'#666'}}>Check tables: Creative Studio, Client Records, Portal Form Submissions, amanda_waitlist</p>
      <a href="/portal" style={{display:'inline-block', marginTop:16, padding:'10px 16px', background:'#17221c', color:'#fff', textDecoration:'none'}}>Go to Portal - Should show updated enrollment</a>
      <div style={{marginTop:8}}><a href="/amanda-catherine">Back to Amanda</a></div>
    </div>
  );
}

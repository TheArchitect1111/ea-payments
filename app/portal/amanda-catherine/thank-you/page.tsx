export default function ThankYou({ searchParams }: { searchParams: { type?: string }}){
  return (
    <div style={{maxWidth:640, margin:'0 auto', padding:'48px 24px', fontFamily:'system-ui', textAlign:'center'}}>
      <h1>Thank you!</h1>
      <p>Your {searchParams?.type || 'submission'} was received.</p>
      <p style={{fontSize:12, color:'#666'}}>Stored in correct Airtable table per type.</p>
      <a href="/amanda-catherine" style={{display:'inline-block', marginTop:24, padding:'12px 20px', background:'#17221c', color:'#fff', textDecoration:'none'}}>Back to Amanda</a>
    </div>
  );
}

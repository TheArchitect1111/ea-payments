export default async function ThankYou({ searchParams }: { searchParams: Promise<{ audience?: string; type?: string; form?: string; course?: string }> }) {
  const { audience, type, form, course } = await searchParams;
  return (
    <div style={{ maxWidth: 720, margin: '80px auto', padding: 24, textAlign: 'center', fontFamily: 'system-ui' }}>
      <h1>Thank you!</h1>
      <p>Your submission is tracked in Amanda's portal.</p>
      <div style={{ background: '#f5f5f5', padding: 16, marginTop: 16, textAlign: 'left', fontSize: 13 }}>
        <div>Audience: {audience}</div>
        <div>Type: {type}</div>
        <div>Form: {form}</div>
        <div>Course: {course}</div>
        <div style={{ marginTop: 8 }}>Storage mapping:</div>
        <div>- {type === 'waitlist' ? 'amanda_waitlist' : type === 'payment' ? 'Creative Studio' : 'Portal Form Submissions'} (primary)</div>
        <div>- Client Records (identity/access preserved)</div>
      </div>
      <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
        <a href="/amanda-catherine" style={{ padding: '10px 16px', background: '#17221c', color: '#fff', textDecoration: 'none' }}>Back to site</a>
        <a href="/portal/login" style={{ padding: '10px 16px', border: '1px solid #17221c', textDecoration: 'none' }}>Portal Login</a>
      </div>
    </div>
  );
}

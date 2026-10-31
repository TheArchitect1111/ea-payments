export const dynamic = 'force-dynamic';
export default function Page() {
  return <div style={{ padding: 24 }}><h1>Firm Foundation - TEST $1 - Same as student</h1><p>Letter from Amanda - Thank you for registering</p><form action="/api/portal/amanda/checkout" method="POST"><input type="hidden" name="courseId" value="firm-foundation" /><button type="submit" style={{ background: '#1a2a4a', color: 'white', padding: '14px 32px' }}>Pay $1 - Square 4111</button></form></div>;
}

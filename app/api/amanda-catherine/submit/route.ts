import { NextRequest, NextResponse } from 'next/server';
import { createAmandaLead } from '@/lib/amanda-catherine/airtable';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await createAmandaLead(body);
  // Also log for Amanda admin dashboard
  console.log('AMANDA_LEAD', body.audience, body.formId, body.email);
  return NextResponse.json({ success: true, result, next: `/portal/amanda-catherine/thank-you?audience=${body.audience}` });
}


cd "C:/Users/brick/OneDrive/Documents/GitHub/ea-payments"

# 4. Academy Enroll
mkdir -p app/portal/amanda-catherine/enroll
cat > app/portal/amanda-catherine/enroll/page.tsx << 'TS'
import { AMANDA_OFFERS, AMANDA_PORTAL_FORMS } from '@/lib/amanda-catherine/config';
export default async function EnrollPage({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  const { course } = await searchParams;
  const offer = AMANDA_OFFERS.find(o => (o as any).courseId === course) as any || { name: course, priceCad: 997, delivery: ['in-person','virtual'] };
  return (
    <div style={{maxWidth: 700, margin: '40px auto', padding: 20, fontFamily: 'Inter'}}>
      <h1>Enroll: {offer.name || course}</h1>
      <p>Price: ${offer.priceCad} CAD</p>
      <form id="enrollForm" style={{display: 'grid', gap: 12}}>
        <input name="name" placeholder="Full name" required style={{padding:12}}/>
        <input name="email" type="email" placeholder="Email" required style={{padding:12}}/>
        <input name="phone" placeholder="Phone" style={{padding:12}}/>
        <textarea name="experience" placeholder="Your experience" style={{padding:12}}/>
        <select name="training-format" style={{padding:12}}><option>in-person</option><option>virtual</option></select>
        <input name="preferred-dates" placeholder="Preferred dates" style={{padding:12}}/>
        <label><input type="checkbox" name="policy-agreement" required/> I agree to policies</label>
        <button type="submit" style={{padding:14, background:'#17221c', color:'#fff'}}>Submit Application & Pay</button>
      </form>
      <script dangerouslySetInnerHTML={{__html: `
        document.getElementById('enrollForm').onsubmit = async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const res = await fetch('/api/amanda-catherine/submit', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({
            audience:'student-trainee', formId:'training-application', courseId:'${course}', source:'enroll-page',
            name: fd.get('name'), email: fd.get('email'), fields: Object.fromEntries(fd.entries())
          })});
          const j = await res.json();
          window.location.href = j.next || '/portal/login';
        }
      `}}/>
    </div>
  );
}

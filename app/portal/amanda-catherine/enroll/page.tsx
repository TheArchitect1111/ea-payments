import { AMANDA_OFFERS, AMANDA_PORTAL_FORMS } from '@/lib/amanda-catherine/config';

export default async function EnrollPage({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  const { course } = await searchParams;
  const offer: any = AMANDA_OFFERS.find((o: any) => (o as any).courseId === course) || { name: course || 'AesthetiKine Training', priceCad: 997, id: course };
  const formDef = AMANDA_PORTAL_FORMS.find(f => f.id === 'training-application');

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: 24, fontFamily: 'system-ui' }}>
      <a href="/amanda-catherine">← Back to Amanda Catherine</a>
      <h1 style={{ marginTop: 16 }}>Enroll: {offer.name}</h1>
      <p>Course ID: {course} | Price: ${offer.priceCad} CAD | Audience: student-trainee</p>
      <p style={{ fontSize: 13, color: '#666' }}>Storage: Creative Studio (payment + assignment) + Portal Form Submissions (application) + Client Records (access). Schema validated via /api/amanda-catherine/schema</p>
      
      <form data-form="enroll" data-course={course} style={{ display: 'grid', gap: 12, marginTop: 24 }}>
        <input name="name" placeholder="Full name" required style={{ padding: 12, border: '1px solid #ccc' }} />
        <input name="email" type="email" placeholder="Email" required style={{ padding: 12, border: '1px solid #ccc' }} />
        <input name="phone" placeholder="Phone" style={{ padding: 12, border: '1px solid #ccc' }} />
        <textarea name="experience" placeholder="Experience / background" style={{ padding: 12, border: '1px solid #ccc' }} />
        <select name="training-format" style={{ padding: 12, border: '1px solid #ccc' }}><option>in-person</option><option>virtual</option></select>
        <input name="preferred-dates" placeholder="Preferred dates" style={{ padding: 12, border: '1px solid #ccc' }} />
        <label style={{ display: 'flex', gap: 8 }}><input type="checkbox" name="policy-agreement" required /> I agree to policies</label>
        <button type="submit" style={{ padding: 14, background: '#17221c', color: '#fff', cursor: 'pointer' }}>Submit Application & Continue to Payment</button>
      </form>
      <div id="status" style={{ marginTop: 16 }}></div>
      <script dangerouslySetInnerHTML={{ __html: `
        const form = document.querySelector('form[data-form="enroll"]');
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(form);
          const status = document.getElementById('status');
          status.textContent = 'Submitting...';
          try {
            const res = await fetch('/api/amanda-catherine/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'payment',
                audience: 'student-trainee',
                formId: 'training-application',
                courseId: form.dataset.course,
                source: 'enroll-page',
                name: fd.get('name'),
                email: fd.get('email'),
                phone: fd.get('phone'),
                fields: Object.fromEntries(fd.entries())
              })
            });
            const json = await res.json();
            if (json.success) window.location.href = json.next;
            else { status.textContent = 'Error: ' + JSON.stringify(json); console.log(json); }
          } catch (err) { status.textContent = 'Error: ' + err.message; }
        });
      `}} />
    </div>
  );
}

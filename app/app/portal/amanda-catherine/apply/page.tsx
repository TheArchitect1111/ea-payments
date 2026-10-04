import { AMANDA_PORTAL_FORMS } from '@/lib/amanda-catherine/config';

export default async function ApplyPage({ searchParams }: { searchParams: Promise<{ form?: string; program?: string }> }) {
  const { form, program } = await searchParams;
  const formDef: any = AMANDA_PORTAL_FORMS.find(f => f.id === form) || AMANDA_PORTAL_FORMS.find(f => f.id === 'partner-vendor-application');

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: 24, fontFamily: 'system-ui' }}>
      <a href="/amanda-catherine">← Back</a>
      <h1 style={{ marginTop: 16 }}>{formDef.title}</h1>
      <p>Audience: {formDef.audience} | Kind: {formDef.kind} | Form: {formDef.id}</p>
      <p style={{ fontSize: 13, color: '#666' }}>Storage: Portal Form Submissions + Client Records (if client access). Verify schema at /api/amanda-catherine/schema</p>

      <form data-form="apply" data-formid={formDef.id} data-audience={formDef.audience} style={{ display: 'grid', gap: 12, marginTop: 24 }}>
        <input name="name" placeholder="Full name" required style={{ padding: 12, border: '1px solid #ccc' }} />
        <input name="email" type="email" placeholder="Email" required style={{ padding: 12, border: '1px solid #ccc' }} />
        <input name="phone" placeholder="Phone" style={{ padding: 12, border: '1px solid #ccc' }} />
        {formDef.fields.map((f: string) => (
          <input key={f} name={f} placeholder={f.replace(/-/g, ' ')} style={{ padding: 12, border: '1px solid #ccc' }} />
        ))}
        <textarea name="message" placeholder="Tell Amanda about your work" style={{ padding: 12, border: '1px solid #ccc' }} />
        <button type="submit" style={{ padding: 14, background: '#17221c', color: '#fff' }}>Submit Application</button>
      </form>
      <div id="status"></div>
      <script dangerouslySetInnerHTML={{ __html: `
        const form = document.querySelector('form[data-form="apply"]');
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(form);
          document.getElementById('status').textContent = 'Submitting...';
          const res = await fetch('/api/amanda-catherine/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'application',
              audience: form.dataset.audience,
              formId: form.dataset.formid,
              source: 'apply-page',
              program: '${program || ''}',
              name: fd.get('name'),
              email: fd.get('email'),
              fields: Object.fromEntries(fd.entries())
            })
          });
          const json = await res.json();
          if (json.success) { alert('Application submitted! Tracked in portal.'); window.location.href = '/amanda-catherine#contact'; }
          else { document.getElementById('status').textContent = JSON.stringify(json); }
        });
      `}} />
    </div>
  );
}

export default function KitPage() {
  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: 24, fontFamily: 'system-ui' }}>
      <a href="/amanda-catherine">← Back</a>
      <h1>BODY SCULPT Practitioner Starter Kit - $499 CAD</h1>
      <p>7-piece Colombian Wood Therapy Collection | Storage: Creative Studio (payment) + Client Records (access)</p>
      <form data-form="kit" style={{ display: 'grid', gap: 12, marginTop: 24 }}>
        <input name="name" placeholder="Full name" required style={{ padding: 12, border: '1px solid #ccc' }} />
        <input name="email" type="email" placeholder="Email" required style={{ padding: 12, border: '1px solid #ccc' }} />
        <input name="address" placeholder="Shipping address" required style={{ padding: 12, border: '1px solid #ccc' }} />
        <input name="phone" placeholder="Phone" style={{ padding: 12, border: '1px solid #ccc' }} />
        <button type="submit" style={{ padding: 14, background: '#17221c', color: '#fff' }}>Purchase Kit $499</button>
      </form>
      <div id="status"></div>
      <p style={{ marginTop: 24 }}><a href="https://riman.com/amandacatherine/en-CA/home" target="_blank" rel="noopener">Shop RIMAN Canada ↗</a></p>
      <script dangerouslySetInnerHTML={{ __html: `
        const form = document.querySelector('form[data-form="kit"]');
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(form);
          document.getElementById('status').textContent = 'Processing...';
          const res = await fetch('/api/amanda-catherine/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'payment',
              audience: 'certified-practitioner',
              formId: 'practitioner-kit-purchase',
              source: 'kit-page',
              name: fd.get('name'),
              email: fd.get('email'),
              amount: 499,
              fields: Object.fromEntries(fd.entries())
            })
          });
          const json = await res.json();
          if (json.success) { alert('Order received! Amanda will fulfill.'); window.location.href = '/amanda-catherine'; }
          else document.getElementById('status').textContent = JSON.stringify(json);
        });
      `}} />
    </div>
  );
}

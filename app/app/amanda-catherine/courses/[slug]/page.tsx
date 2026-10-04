export default async function WaitlistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: 24, fontFamily: 'system-ui' }}>
      <a href="/amanda-catherine">← Back</a>
      <h1 style={{ marginTop: 16, textTransform: 'capitalize' }}>{slug.replace(/-/g, ' ')}</h1>
      <p>Join waitlist - Stored in amanda_waitlist + Portal Form Submissions</p>
      <form data-course={slug} style={{ display: 'grid', gap: 12, marginTop: 24 }}>
        <input name="name" placeholder="Full name" required style={{ padding: 12, border: '1px solid #ccc' }} />
        <input name="email" type="email" placeholder="Email" required style={{ padding: 12, border: '1px solid #ccc' }} />
        <input name="phone" placeholder="Phone" style={{ padding: 12, border: '1px solid #ccc' }} />
        <textarea name="why" placeholder="Why interested?" style={{ padding: 12, border: '1px solid #ccc' }} />
        <button type="submit" style={{ padding: 14, background: '#17221c', color: '#fff' }}>Join Waitlist</button>
      </form>
      <div id="status"></div>
      <script dangerouslySetInnerHTML={{ __html: `
        const form = document.querySelector('form');
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(form);
          document.getElementById('status').textContent = 'Adding...';
          const res = await fetch('/api/amanda-catherine/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'waitlist',
              audience: 'student-trainee',
              formId: 'waitlist',
              courseId: form.dataset.course,
              source: 'waitlist-page',
              name: fd.get('name'),
              email: fd.get('email'),
              fields: Object.fromEntries(fd.entries())
            })
          });
          const json = await res.json();
          if (json.success) { alert('Added to waitlist!'); window.location.href = '/amanda-catherine'; }
          else document.getElementById('status').textContent = JSON.stringify(json);
        });
      `}} />
    </div>
  );
}

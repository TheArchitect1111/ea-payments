'use client';
import { useState, type FormEvent } from 'react';
export default function WaitlistForm({ courseId }: { courseId: string }) {
  const [status, setStatus] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); const fields = new FormData(event.currentTarget);
    try { const res = await fetch('/api/public/amanda/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId, name: fields.get('name'), email: fields.get('email') }) }); const data = await res.json(); setStatus(res.ok ? 'You have joined the waitlist. No payment or course access has been created.' : data.error); } catch { setStatus('The waitlist could not be saved. Please try again.'); } finally { setBusy(false); }
  }
  return <form onSubmit={submit}><label>Name<input name="name" required minLength={2} maxLength={120} /></label><label>Email<input name="email" type="email" required maxLength={254} /></label><button disabled={busy}>Join Waitlist</button><p role="status">{status}</p></form>;
}

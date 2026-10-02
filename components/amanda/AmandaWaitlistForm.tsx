'use client';
import { useId, useState, type FormEvent } from 'react';
export default function AmandaWaitlistForm({ courseId, courseName }: { courseId: string; courseName: string }) {
  const id = useId();
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setStatus('');
    const fields = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/public/amanda/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId, name: fields.get('name'), email: fields.get('email'), phone: fields.get('phone'), message: fields.get('message') }) });
      const result = await response.json();
      setStatus(response.ok ? "You're on the waitlist - Amanda will notify you when READY" : result.error || 'Please try again.');
    } catch { setStatus('The waitlist could not be saved. Please try again.'); } finally { setBusy(false); }
  }
  return <form onSubmit={submit} aria-busy={busy}>
    <label htmlFor={`${id}-name`}>Name</label><input id={`${id}-name`} name="name" autoComplete="name" required minLength={2} maxLength={120} />
    <label htmlFor={`${id}-email`}>Email</label><input id={`${id}-email`} name="email" type="email" autoComplete="email" required maxLength={254} />
    <label htmlFor={`${id}-phone`}>Phone</label><input id={`${id}-phone`} name="phone" type="tel" autoComplete="tel" maxLength={40} />
    <label htmlFor={`${id}-course`}>Course interested in</label><input id={`${id}-course`} value={courseName} readOnly />
    <label htmlFor={`${id}-message`}>Message</label><textarea id={`${id}-message`} name="message" maxLength={2000} />
    <button disabled={busy} type="submit">{busy ? 'Joining…' : 'Join Waitlist'}</button><p role="status">{status}</p>
  </form>;
}

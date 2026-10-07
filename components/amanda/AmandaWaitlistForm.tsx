'use client';
import { useId, useState, type FormEvent } from 'react';
import '../../app/portal/amanda-catherine/(engagement)/portal.css';

type AmandaWaitlistFormProps = {
  courseId: string;
  courseName: string;
  variant?: 'waitlist' | 'registration';
};

export default function AmandaWaitlistForm({ courseId, courseName, variant = 'waitlist' }: AmandaWaitlistFormProps) {
  const id = useId();
  const [status, setStatus] = useState('');
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setStatus('');
    const fields = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/public/amanda/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId, name: fields.get('name'), email: fields.get('email'), phone: fields.get('phone'), message: fields.get('message') }) });
      const result = await response.json();
      if (!response.ok || !result.ok) { setStatus(result.error || 'Please try again.'); return; }
      setJoined(true);
    } catch { setStatus('The waitlist could not be saved. Please try again.'); } finally { setBusy(false); }
  }
  if (joined) return <section role="status" className="amanda-waitlist-success" style={{maxWidth:680,margin:'32px auto',padding:24,background:'#fffdf8',border:'1px solid #ddd7cb',borderRadius:8}}><p>WELCOME</p><h2>Thank you for your interest.</h2><p>You’re on Amanda’s waitlist for {courseName}. We’ll be in touch when enrollment information is available.</p><p>Warmly,</p><p><strong>Amanda Catherine</strong><br/>AesthetiKine Studio Lab</p></section>;
  return <div className="amanda-form"><form onSubmit={submit} aria-busy={busy}>
    <div className="amanda-field">
      <label htmlFor={`${id}-name`}>Name</label>
      <input className="amanda-input" id={`${id}-name`} name="name" autoComplete="name" required minLength={2} maxLength={120} />
    </div>
    <div className="amanda-field">
      <label htmlFor={`${id}-email`}>Email</label>
      <input className="amanda-input" id={`${id}-email`} name="email" type="email" autoComplete="email" required maxLength={254} />
    </div>
    <div className="amanda-field">
      <label htmlFor={`${id}-phone`}>Phone</label>
      <input className="amanda-input" id={`${id}-phone`} name="phone" type="tel" autoComplete="tel" maxLength={40} />
    </div>
    <div className="amanda-field">
      <label htmlFor={`${id}-course`}>Course interested in</label>
      <input className="amanda-input" id={`${id}-course`} value={courseName} readOnly />
    </div>
    <div className="amanda-field">
      <label htmlFor={`${id}-message`}>Message</label>
      <textarea className="amanda-textarea" id={`${id}-message`} name="message" maxLength={2000} />
    </div>
    <button className="amanda-button amanda-button-primary" disabled={busy} type="submit">
      {busy ? 'Joining...' : variant === 'registration' ? 'Secure My Spot' : 'Join Waitlist'}
    </button>
    <p role="status">{status}</p>
  </form></div>;
}

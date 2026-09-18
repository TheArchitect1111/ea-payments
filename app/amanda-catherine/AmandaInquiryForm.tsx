'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';

export const inquiryLabels = {
  speaking: 'Book Amanda to Speak',
  advisory: 'Founder Advisory application',
  interview: 'LIFELINE interview inquiry',
  partnership: 'Partnership or sponsorship',
  mentorship: 'Clinical Mentorship application',
  kit: 'Private Practitioner Kit purchase link',
} as const;

export function InquiryLink({ intent, children }: { intent: keyof typeof inquiryLabels; children: ReactNode }) {
  return <a className="ac-btn" href="#inquiries" onClick={() => window.dispatchEvent(new CustomEvent('amanda-inquiry', { detail: intent }))}>{children}</a>;
}

export default function AmandaInquiryForm({ email }: { email: string }) {
  const [intent, setIntent] = useState<keyof typeof inquiryLabels>('speaking');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  useEffect(() => {
    const select = (event: Event) => {
      const key = (event as CustomEvent).detail;
      if (Object.hasOwn(inquiryLabels, key)) { setIntent(key); setStatus(''); }
    };
    window.addEventListener('amanda-inquiry', select);
    return () => window.removeEventListener('amanda-inquiry', select);
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true); setStatus('');
    try {
      const response = await fetch('/api/public/amanda/inquiries', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, intent }),
      });
      const result = await response.json();
      setStatus(response.ok ? result.preview
        ? 'Preview checked successfully. No inquiry or email was sent.'
        : 'Thank you. Your inquiry has been sent to Amanda.'
        : result.error || 'Unable to send. Please email Amanda directly.');
    } catch { setStatus('Unable to send. Please email Amanda directly.'); }
    finally { setBusy(false); }
  }
  return <section id="inquiries" className="ac-inquiry" aria-labelledby="ac-inquiry-title">
    <p className="ac-eyebrow">Your next conversation</p>
    <h2 id="ac-inquiry-title">{inquiryLabels[intent]}</h2>
    <p>Tell Amanda what you are planning. For advisory, interviews, partnerships or clinical mentorship, choose the conversation that fits.</p>
    <form onSubmit={submit} className="ac-form-grid">
      <label className="ac-form-wide">I’m interested in<select name="intent" value={intent} onChange={e => { setIntent(e.target.value as keyof typeof inquiryLabels); setStatus(''); }}>
        {Object.entries(inquiryLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}
      </select></label>
      <label>Full name<input name="name" autoComplete="name" required minLength={2} maxLength={120}/></label>
      <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254}/></label>
      <label>Organization or practice<input name="organization" autoComplete="organization" maxLength={200}/></label>
      <label>Phone number<input name="phone" type="tel" autoComplete="tel" maxLength={50}/></label>
      {intent==='speaking' && <><label>Event name<input name="event" maxLength={200}/></label><label>Proposed event date<input name="date" type="date"/></label><label className="ac-form-wide">Audience and location<input name="audience" maxLength={400}/></label></>}
      <label className="ac-form-wide">{intent==='mentorship' ? 'Training background and mentorship goals' : intent==='advisory' ? 'Your work, goals and the support you need' : intent==='interview' ? 'Your story, proposed theme and audience value' : 'Tell Amanda about your request'}<textarea name="message" required minLength={10} maxLength={4000}/></label>
      <div hidden aria-hidden="true"><label>Leave this field empty<input name="websiteCheck" tabIndex={-1} autoComplete="off"/></label></div>
      <div className="ac-form-wide"><button className="ac-btn ac-btn-fill" disabled={busy} type="submit">{busy ? 'Checking…' : 'Send inquiry'}</button><p role="status" aria-live="polite">{status}</p><p>Prefer email? <a href={`mailto:${email}`}>{email}</a>. Please do not include confidential health information.</p></div>
    </form>
  </section>;
}

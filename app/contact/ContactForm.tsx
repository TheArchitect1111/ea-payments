'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { SUPPORT_EMAIL } from '@/lib/landing-visuals';

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    setError('');

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      organization: String(form.get('organization') ?? ''),
      intent: String(form.get('intent') ?? 'discovery'),
      message: String(form.get('message') ?? ''),
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setStatus('error');
        setError(data.error ?? 'Unable to send your message.');
        return;
      }
      setStatus('sent');
      event.currentTarget.reset();
    } catch {
      setStatus('error');
      setError('Unable to send your message. Please email us directly.');
    }
  }

  if (status === 'sent') {
    return (
      <div className="pl-contact-success" role="status">
        <p>Thank you. We received your message and will respond within one business day.</p>
        <Link href="/assessment" className="pl-cta-solid">
          Take the Operational MRI&trade;
        </Link>
      </div>
    );
  }

  return (
    <form className="pl-contact-form" onSubmit={onSubmit} noValidate>
      <label>
        Name
        <input name="name" type="text" required autoComplete="name" />
      </label>
      <label>
        Email
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label>
        Organization
        <input name="organization" type="text" autoComplete="organization" />
      </label>
      <label>
        How can we help?
        <select name="intent" defaultValue="discovery">
          <option value="discovery">Book a discovery conversation</option>
          <option value="assessment">Discuss my Operational MRI results</option>
          <option value="partnership">Explore a partnership</option>
          <option value="general">General question</option>
        </select>
      </label>
      <label>
        Message
        <textarea name="message" rows={5} required />
      </label>
      {error ? <p className="pl-contact-error" role="alert">{error}</p> : null}
      <button type="submit" className="pl-cta-solid pl-cta-solid-block" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
      <p className="pl-contact-alt">
        Prefer email?{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </p>
    </form>
  );
}

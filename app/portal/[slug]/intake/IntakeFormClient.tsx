'use client';

import { useState, type FormEvent } from 'react';

type Props = {
  slug: string;
  kind: 'intake' | 'application';
  title: string;
  submitLabel: string;
};

export default function PortalFormClient({ slug, kind, title, submitLabel }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/portal/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, kind, name, email, phone, notes }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || 'Could not submit — try again.');
        return;
      }
      setDone(true);
    } catch {
      setError('Network error — try again.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="ep-module-card">
        <p className="ep-module-card-title">{title} received</p>
        <p className="ep-module-card-note">
          Thank you — your team will follow up at {email || 'the email you provided'}.
        </p>
      </div>
    );
  }

  return (
    <form className="ep-module-card" onSubmit={onSubmit}>
      <p className="ep-module-card-title">{title}</p>
      <label className="ep-form-field">
        <span>Name</span>
        <input
          className="ep-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
      </label>
      <label className="ep-form-field">
        <span>Email</span>
        <input
          className="ep-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </label>
      <label className="ep-form-field">
        <span>Phone (optional)</span>
        <input
          className="ep-input"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
        />
      </label>
      <label className="ep-form-field">
        <span>{kind === 'application' ? 'Why you are applying' : 'Goals or notes'}</span>
        <textarea
          className="ep-input"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      {error ? <p className="ep-module-card-note" style={{ color: '#b42318' }}>{error}</p> : null}
      <p style={{ marginTop: 16 }}>
        <button type="submit" className="ep-btn" disabled={busy}>
          {busy ? 'Sending…' : submitLabel}
        </button>
      </p>
    </form>
  );
}

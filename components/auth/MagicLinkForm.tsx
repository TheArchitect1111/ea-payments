'use client';

import { FormEvent, useState } from 'react';
import type { MagicLinkRealm } from '@/lib/magic-link';

type Props = {
  realm: MagicLinkRealm;
  next?: string;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
};

export default function MagicLinkForm({
  realm,
  next,
  title = 'Sign in with email',
  subtitle = 'Enter your email and we will send you a one-tap login link. No password needed.',
  buttonLabel = 'Email me a login link',
}: Props) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), realm, next }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; error?: string };

      if (!res.ok) {
        setError(data.error ?? 'Could not send login link. Try again.');
        setLoading(false);
        return;
      }

      setSent(true);
      setLoading(false);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="pl-sent" role="status">
        <h3 className="pl-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{title}</h3>
        <p className="pl-success">Check your email — your login link is on the way.</p>
        <p className="pl-lede">Open the email on this device and tap <strong>Sign in</strong>. The link expires in 15 minutes.</p>
        <button type="button" className="pl-btn pl-btn-secondary" onClick={() => setSent(false)}>
          Send another link
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="pl-form pl-magic-form">
      <h3 className="pl-title" style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>{title}</h3>
      <p className="pl-lede" style={{ marginBottom: '1rem' }}>{subtitle}</p>

      <label className="pl-label" htmlFor="magic-email">
        Email
      </label>
      <input
        id="magic-email"
        type="email"
        className="pl-input"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="you@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoFocus
      />

      <button type="submit" className="pl-btn" disabled={loading}>
        {loading ? 'Sending…' : buttonLabel}
      </button>

      {error ? (
        <p className="pl-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

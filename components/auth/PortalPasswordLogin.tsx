'use client';

import { FormEvent, useState } from 'react';

type Props = {
  next?: string;
};

/**
 * Emergency / backup portal sign-in when emailed codes/links fail.
 * Uses /api/portal/login (Airtable Temp Password or demo credentials).
 */
export default function PortalPasswordLogin({ next }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          next: next || undefined,
        }),
      });
      const data = (await res.json()) as {
        slug?: string;
        error?: string;
        requires2fa?: boolean;
      };

      if (!res.ok) {
        setError(data.error ?? 'Sign in failed.');
        setLoading(false);
        return;
      }

      if (data.requires2fa) {
        setError(
          'This account still requires an email code. Use the code form above, or use demo credentials.',
        );
        setLoading(false);
        return;
      }

      if (!data.slug) {
        setError('Sign in failed — no portal slug returned.');
        setLoading(false);
        return;
      }

      const destination =
        (data as { next?: string }).next || next || `/portal/${data.slug}/ctp`;
      window.location.assign(destination);
    } catch {
      setError('Network error. Try again.');
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <p className="pl-footer-text" style={{ marginTop: '1.25rem', textAlign: 'center' }}>
        <button
          type="button"
          className="pl-footer-link"
          style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', font: 'inherit' }}
          onClick={() => setOpen(true)}
        >
          Sign in with password instead
        </button>
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="pl-form pl-magic-form" style={{ marginTop: '1.25rem' }}>
      <h3 className="pl-title" style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>
        Password sign in
      </h3>
      <p className="pl-lede" style={{ marginBottom: '1rem' }}>
        Use the email and temporary password from your Client Record (or the demo credentials).
      </p>

      <label className="pl-label" htmlFor="portal-pw-email">
        Email
      </label>
      <input
        id="portal-pw-email"
        type="email"
        className="pl-input"
        autoComplete="username"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <label className="pl-label" htmlFor="portal-pw-password" style={{ marginTop: '0.75rem' }}>
        Password
      </label>
      <input
        id="portal-pw-password"
        type="password"
        className="pl-input"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button type="submit" className="pl-btn" disabled={loading} style={{ marginTop: '1rem' }}>
        {loading ? 'Signing in…' : 'Sign in with password'}
      </button>

      {error ? (
        <p className="pl-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

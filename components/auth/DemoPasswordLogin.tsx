'use client';

import { FormEvent, useState } from 'react';

const DEMO_EMAIL = 'demo@efficiencyarchitects.online';
const DEMO_PASSWORD = 'DemoPulse2026!';

type Props = {
  next?: string;
  /** Compact layout for login cards */
  compact?: boolean;
  onSuccess?: (slug: string) => void;
};

/** Shared demo credentials — one sign-in works across /simplifi/* and /portal/* pages. */
export default function DemoPasswordLogin({ next, compact = false, onSuccess }: Props) {
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          next,
        }),
      });
      const data = (await res.json()) as { slug?: string; error?: string; requires2fa?: boolean };

      if (!res.ok || data.requires2fa) {
        setError(data.error ?? 'Sign in failed. Try again.');
        setLoading(false);
        return;
      }

      if (onSuccess && data.slug) {
        onSuccess(data.slug);
        setLoading(false);
        return;
      }

      const target =
        next && next.startsWith('/') && !next.startsWith('//')
          ? next
          : data.slug
            ? `/portal/${data.slug}/simplifi`
            : '/simplifi/capture';
      window.location.href = target;
    } catch {
      setError('Network error. Check your connection and try again.');
      setLoading(false);
    }
  }

  return (
    <div className={compact ? 'pl-demo-compact' : 'pl-demo-block'}>
      {!compact ? (
        <>
          <p className="pl-demo-eyebrow">Testing the platform?</p>
          <p className="pl-demo-lede">
            Use the shared demo account once — then open any page below without signing in again.
          </p>
        </>
      ) : (
        <p className="pl-demo-lede" style={{ marginBottom: '0.75rem' }}>
          Or use the shared demo account (works on every page):
        </p>
      )}

      <form onSubmit={handleSubmit} className="pl-form">
        <label className="pl-label" htmlFor="demo-email">
          Email
        </label>
        <input
          id="demo-email"
          type="email"
          className="pl-input"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="pl-label" htmlFor="demo-password">
          Password
        </label>
        <input
          id="demo-password"
          type="password"
          className="pl-input"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" className="pl-btn pl-btn-secondary" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in with demo account'}
        </button>

        {error ? (
          <p className="pl-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}

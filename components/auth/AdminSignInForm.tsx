'use client';

import { FormEvent, useState } from 'react';
import AuthNav from '@/components/auth/AuthNav';
import TwoFactorForm from '@/components/auth/TwoFactorForm';

export default function AdminSignInForm({
  nextPath = '/admin/master',
  showNav = true,
}: {
  nextPath?: string;
  showNav?: boolean;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingToken, setPendingToken] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, next: nextPath }),
      });
      const data = (await res.json()) as {
        requires2fa?: boolean;
        pendingToken?: string;
        maskedEmail?: string;
        next?: string;
        error?: string;
      };

      if (!res.ok) {
        setError(data.error ?? 'Invalid email or password.');
        setLoading(false);
        return;
      }

      if (data.requires2fa && data.pendingToken) {
        setPendingToken(data.pendingToken);
        setMaskedEmail(data.maskedEmail ?? 'your email');
        setLoading(false);
        return;
      }

      window.location.href = data.next ?? nextPath;
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  if (pendingToken) {
    return (
      <>
        {showNav ? <AuthNav realm="admin" active="sign-in" /> : null}
        <TwoFactorForm
          pendingToken={pendingToken}
          maskedEmail={maskedEmail}
          verifyUrl="/api/auth/verify-2fa"
          onSuccess={(data) => {
            window.location.href = String(data.next ?? nextPath);
          }}
        />
      </>
    );
  }

  return (
    <>
      {showNav ? <AuthNav realm="admin" active="sign-in" /> : null}
      <form onSubmit={handleSubmit} className="pl-form">
        <label className="pl-label" htmlFor="admin-email">
          Email
        </label>
        <input
          id="admin-email"
          type="email"
          className="pl-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
          autoFocus
        />

        <label className="pl-label" htmlFor="admin-password">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          className="pl-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        <button type="submit" className="pl-btn" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        {error ? (
          <p className="pl-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </>
  );
}

'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AuthNav from '@/components/auth/AuthNav';
import TwoFactorForm from '@/components/auth/TwoFactorForm';

function safeNextPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null;
  return raw;
}

function SimplifiLoginForm() {
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingToken, setPendingToken] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
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
          next: nextPath ?? undefined,
        }),
      });

      const data = (await res.json()) as {
        slug?: string;
        requires2fa?: boolean;
        pendingToken?: string;
        maskedEmail?: string;
        next?: string;
        error?: string;
      };

      if (!res.ok) {
        setError(data.error ?? 'Login failed. Please try again.');
        setLoading(false);
        return;
      }

      if (data.requires2fa && data.pendingToken) {
        setPendingToken(data.pendingToken);
        setMaskedEmail(data.maskedEmail ?? 'your email');
        setLoading(false);
        return;
      }

      if (!data.slug) {
        setError('Login failed. Please try again.');
        setLoading(false);
        return;
      }

      window.location.href = nextPath ?? `/portal/${data.slug}/simplifi`;
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }

  if (pendingToken) {
    return (
      <div className="pl-card">
        <AuthNav realm="simplifi" active="sign-in" />
        <TwoFactorForm
          pendingToken={pendingToken}
          maskedEmail={maskedEmail}
          verifyUrl="/api/auth/verify-2fa"
          onSuccess={(data) => {
            const slug = data.slug as string | undefined;
            const next = data.next as string | undefined;
            window.location.href = next ?? (slug ? `/portal/${slug}/simplifi` : '/simplifi/login');
          }}
        />
      </div>
    );
  }

  return (
    <div className="pl-card">
      <AuthNav realm="simplifi" active="sign-in" />
      <form onSubmit={handleSubmit} noValidate className="pl-form">
        <label className="pl-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="pl-input"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          autoFocus
        />

        <label className="pl-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          className="pl-input"
          placeholder="From your Simplifi welcome email"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        <button type="submit" className="pl-btn" disabled={loading}>
          {loading ? 'Opening Simplifi...' : 'Open Simplifi'}
        </button>

        {error && (
          <p className="pl-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}

export default function SimplifiLoginClient() {
  return (
    <div className="pl-page">
      <div className="pl-shell">
        <header className="pl-header">
          <Link href="/simplifi" className="simplifi-auth-brand">
            SIMPLIFI
          </Link>
          <p className="pl-eyebrow">Opportunity Workspace</p>
          <h1 className="pl-title">Sign in to Simplifi</h1>
          <p className="pl-lede">Capture your first opportunity, build a Magnifi story, and keep follow-up visible.</p>
        </header>

        <Suspense fallback={<div className="pl-card">Loading...</div>}>
          <SimplifiLoginForm />
        </Suspense>

        <footer className="pl-footer">
          <p className="pl-footer-text">
            Full EA client portal?{' '}
            <Link href="/portal/login" className="pl-footer-link">
              Sign in here
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}

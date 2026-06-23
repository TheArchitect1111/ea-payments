'use client';

import { Suspense, useState, FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AuthNav from '@/components/auth/AuthNav';
import TwoFactorForm from '@/components/auth/TwoFactorForm';
import './portal-login.css';

function safeNextPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null;
  return raw;
}

function PortalLoginForm() {
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

      window.location.href = nextPath ?? `/portal/${data.slug}`;
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }

  if (pendingToken) {
    return (
      <div className="pl-card">
        <AuthNav realm="portal" active="sign-in" />
        <TwoFactorForm
          pendingToken={pendingToken}
          maskedEmail={maskedEmail}
          verifyUrl="/api/auth/verify-2fa"
          onSuccess={(data) => {
            const slug = data.slug as string | undefined;
            const next = data.next as string | undefined;
            window.location.href = next ?? (slug ? `/portal/${slug}` : '/portal/login');
          }}
        />
      </div>
    );
  }

  return (
    <div className="pl-card">
      <AuthNav realm="portal" active="sign-in" />
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
          placeholder="From your welcome email"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        <button type="submit" className="pl-btn" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
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

export default function PortalLoginPage() {
  return (
    <div className="pl-page">
      <div className="pl-shell">
        <header className="pl-header">
          <Image
            src="/ea-logo.png"
            alt="Efficiency Architects"
            width={240}
            height={240}
            className="pl-logo"
            priority
          />
          <p className="pl-eyebrow">Client Portal</p>
          <h1 className="pl-title">Welcome in</h1>
          <p className="pl-lede">Sign in, register, or reset your password. Two-factor verification protects your account.</p>
        </header>

        <Suspense fallback={<div className="pl-card">Loading…</div>}>
          <PortalLoginForm />
        </Suspense>

        <footer className="pl-footer">
          <p className="pl-footer-text">
            Partner portal?{' '}
            <Link href="/partners/login" className="pl-footer-link">
              Sign in here
            </Link>
          </p>
          <p className="pl-tagline">Systems that transform businesses.</p>
        </footer>
      </div>
    </div>
  );
}

'use client';

import { Suspense, useState, FormEvent } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = (await res.json()) as { slug?: string; error?: string };

      if (!res.ok || !data.slug) {
        setError(data.error ?? 'Login failed. Please try again.');
        setLoading(false);
        return;
      }

      window.location.href = nextPath ?? `/portal/${data.slug}`;
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="pl-card">
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
          <p className="pl-lede">Sign in to Pulse™, Simplifi™, Magnifi™, and Amplifi™.</p>
        </header>

        <Suspense fallback={<div className="pl-card">Loading…</div>}>
          <PortalLoginForm />
        </Suspense>

        <footer className="pl-footer">
          <p className="pl-footer-text">
            Need access?{' '}
            <a href="mailto:freedom@efficiencyarchitects.online" className="pl-footer-link">
              Contact us
            </a>
          </p>
          <p className="pl-tagline">Systems that transform businesses.</p>
        </footer>
      </div>
    </div>
  );
}

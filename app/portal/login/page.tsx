'use client';

import { useState, FormEvent } from 'react';
import Image from 'next/image';
import './portal-login.css';

export default function PortalLoginPage() {
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

      window.location.href = `/portal/${data.slug}`;
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="pl-page">
      <div className="pl-bg-glow pl-bg-glow-a" aria-hidden />
      <div className="pl-bg-glow pl-bg-glow-b" aria-hidden />

      <div className="pl-shell">
        <header className="pl-header">
          <Image
            src="/ea-logo.png"
            alt="Efficiency Architects"
            width={280}
            height={280}
            className="pl-logo"
            priority
          />
          <p className="pl-eyebrow">Client Portal</p>
          <h1 className="pl-title">Welcome back</h1>
          <p className="pl-lede">Sign in to Pulse™, Simplifi™, Magnifi™, and Amplifi™.</p>
        </header>

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

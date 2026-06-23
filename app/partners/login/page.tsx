'use client';

import { useState, FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import AuthNav from '@/components/auth/AuthNav';
import TwoFactorForm from '@/components/auth/TwoFactorForm';
import '../../portal/login/portal-login.css';
import '../partners.css';

export default function PartnersLoginPage() {
  const [slug, setSlug] = useState('');
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
      const res = await fetch('/api/partners/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slug.trim().toLowerCase(), password }),
      });
      const data = (await res.json()) as {
        slug?: string;
        requires2fa?: boolean;
        pendingToken?: string;
        maskedEmail?: string;
        error?: string;
      };

      if (!res.ok) {
        setError(data.error ?? 'Invalid credentials.');
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
        setError('Invalid credentials.');
        setLoading(false);
        return;
      }

      window.location.href = `/partners/${data.slug}`;
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="pl-page">
      <div className="pl-shell">
        <header className="pl-header">
          <Image src="/ea-logo.png" alt="Efficiency Architects" width={200} height={200} className="pl-logo" priority />
          <p className="pl-eyebrow">Partner Portal</p>
          <h1 className="pl-title">Welcome in, Partner</h1>
          <p className="pl-lede">Sign in, register, or reset your password. Two-factor verification protects your account.</p>
        </header>

        <div className="pl-card">
          <AuthNav realm="partner" active="sign-in" />
          {pendingToken ? (
            <TwoFactorForm
              pendingToken={pendingToken}
              maskedEmail={maskedEmail}
              verifyUrl="/api/auth/verify-2fa"
              onSuccess={(data) => {
                const partnerSlug = data.slug as string | undefined;
                window.location.href = partnerSlug ? `/partners/${partnerSlug}` : '/partners/login';
              }}
            />
          ) : (
            <form onSubmit={handleSubmit} noValidate className="pl-form">
              <label className="pl-label" htmlFor="slug">
                Partner profile slug
              </label>
              <input
                id="slug"
                className="pl-input"
                placeholder="your-name"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
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
              />

              <button type="submit" className="pl-btn" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>

              {error && <p className="pl-error">{error}</p>}
            </form>
          )}
        </div>

        <footer className="pl-footer">
          <p className="pl-footer-text">
            Client portal?{' '}
            <Link href="/portal/login" className="pl-footer-link">
              Sign in here
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}

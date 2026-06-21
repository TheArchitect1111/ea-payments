'use client';

import { useState, FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import '../../portal/login/portal-login.css';
import '../partners.css';

export default function PartnersLoginPage() {
  const [slug, setSlug] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      const data = (await res.json()) as { slug?: string; error?: string };

      if (!res.ok || !data.slug) {
        setError(data.error ?? 'Invalid credentials.');
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
          <p className="pl-lede">Track referrals, commissions, and pipeline — linked to Command Center.</p>
        </header>

        <div className="pl-card">
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

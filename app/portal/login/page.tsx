'use client';

import { useState, FormEvent } from 'react';
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
      <div className="pl-brand">
        <span className="pl-brand-line">Client Portal</span>
        <span className="pl-brand-name">Efficiency Architects</span>
      </div>

      <div className="pl-card">
        <h1 className="pl-heading">Sign In</h1>
        <p className="pl-sub">Enter the credentials from your welcome email.</p>

        <form onSubmit={handleSubmit} noValidate>
          <label className="pl-label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="pl-input"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
          />

          <label className="pl-label" htmlFor="password">Temporary Password</label>
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
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          {error && <p className="pl-error">{error}</p>}
        </form>
      </div>

      <div className="pl-footer">
        <p className="pl-footer-text">
          Need access?{' '}
          <a
            href="mailto:freedom@efficiencyarchitects.online"
            className="pl-footer-link"
          >
            Contact us
          </a>
        </p>
      </div>
    </div>
  );
}

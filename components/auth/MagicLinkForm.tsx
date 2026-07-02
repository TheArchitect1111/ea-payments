'use client';

import { FormEvent, useState } from 'react';
import type { MagicLinkRealm } from '@/lib/magic-link';
import { getRealmLoginCopy } from '@/lib/auth/realm-login-copy';

type Props = {
  realm: MagicLinkRealm;
  next?: string;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  /** Set false when the page header already shows the title (avoids duplicate headings). */
  showTitle?: boolean;
};

export default function MagicLinkForm({
  realm,
  next,
  title,
  subtitle,
  buttonLabel,
  showTitle = true,
}: Props) {
  const copy = getRealmLoginCopy(realm);
  const resolvedTitle = title ?? copy.cardTitle;
  const resolvedSubtitle = subtitle ?? copy.cardSubtitle;
  const resolvedButton = buttonLabel ?? copy.buttonLabel;
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), realm, next }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; error?: string };

      if (!res.ok) {
        setError(data.error ?? 'Could not send login link. Try again.');
        setLoading(false);
        return;
      }

      setSent(true);
      setLoading(false);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="pl-sent" role="status">
        {showTitle ? (
          <h3 className="pl-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{resolvedTitle}</h3>
        ) : null}
        <p className="pl-success">{copy.sentMessage}</p>
        <p className="pl-lede">{copy.sentDetail}</p>
        <button type="button" className="pl-btn pl-btn-secondary" onClick={() => setSent(false)}>
          {copy.sendAnotherLabel}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="pl-form pl-magic-form">
      {showTitle ? (
        <h3 className="pl-title" style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>{resolvedTitle}</h3>
      ) : null}
      <p className="pl-lede" style={{ marginBottom: '1rem' }}>{resolvedSubtitle}</p>

      <label className="pl-label" htmlFor="magic-email">
        Email
      </label>
      <input
        id="magic-email"
        type="email"
        className="pl-input"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        placeholder={copy.emailPlaceholder}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoFocus
      />

      <button type="submit" className="pl-btn" disabled={loading}>
        {loading ? 'Sending…' : resolvedButton}
      </button>

      {error ? (
        <p className="pl-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

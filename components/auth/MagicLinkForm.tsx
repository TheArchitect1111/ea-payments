'use client';

import { FormEvent, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { MagicLinkRealm } from '@/lib/magic-link';
import { getRealmLoginCopy } from '@/lib/auth/realm-login-copy';

type Props = {
  realm: MagicLinkRealm;
  next?: string;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  showTitle?: boolean;
  onSent?: () => void;
};

export default function MagicLinkForm({
  realm,
  next,
  title,
  subtitle,
  buttonLabel,
  showTitle = true,
  onSent,
}: Props) {
  const copy = getRealmLoginCopy(realm);
  const resolvedTitle = title ?? copy.cardTitle;
  const resolvedSubtitle = subtitle ?? copy.cardSubtitle;
  const resolvedButton = buttonLabel ?? copy.buttonLabel;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pendingToken, setPendingToken] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [error, setError] = useState('');
  const [linkSent, setLinkSent] = useState(false);
  const [loading, setLoading] = useState(false);

  function clearStickyUrlError() {
    if (!searchParams.get('error')) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete('error');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    clearStickyUrlError();

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), realm, next }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        mode?: 'otp' | 'link';
        pendingToken?: string;
        maskedEmail?: string;
        message?: string;
        error?: string;
      };

      if (!res.ok) {
        setError(data.error ?? 'Could not send login code. Try again.');
        setLoading(false);
        return;
      }

      onSent?.();

      if (data.mode === 'otp' && data.pendingToken) {
        setPendingToken(data.pendingToken);
        setMaskedEmail(data.maskedEmail || email.trim());
        setLoading(false);
        return;
      }

      setLinkSent(true);
      setLoading(false);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  async function handleCodeSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingToken, code: code.trim() }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        slug?: string;
        next?: string;
        error?: string;
      };

      if (!res.ok) {
        setError(data.error ?? 'Invalid or expired code. Try again.');
        setLoading(false);
        return;
      }

      const destination =
        data.next ||
        (data.slug ? `/portal/${data.slug}/ctp` : null) ||
        (realm === 'admin' ? '/admin/master' : '/portal/login');
      window.location.assign(destination);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  if (pendingToken) {
    return (
      <form onSubmit={handleCodeSubmit} className="pl-form pl-magic-form">
        {showTitle ? (
          <h3 className="pl-title" style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>
            Enter your code
          </h3>
        ) : null}
        <p className="pl-lede" style={{ marginBottom: '1rem' }}>
          We sent a 6-digit code to <strong>{maskedEmail}</strong>. Type it below — no link to click.
        </p>

        <label className="pl-label" htmlFor="magic-code">
          Code
        </label>
        <input
          id="magic-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          className="pl-input"
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          required
          autoFocus
          pattern="\d{6}"
        />

        <button type="submit" className="pl-btn" disabled={loading || code.length !== 6}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <button
          type="button"
          className="pl-btn pl-btn-secondary"
          style={{ marginTop: '0.75rem' }}
          onClick={() => {
            setPendingToken('');
            setCode('');
            setError('');
          }}
        >
          Use a different email
        </button>

        {error ? (
          <p className="pl-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    );
  }

  if (linkSent) {
    return (
      <div className="pl-sent" role="status">
        {showTitle ? (
          <h3 className="pl-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{resolvedTitle}</h3>
        ) : null}
        <p className="pl-success">{copy.sentMessage}</p>
        <p className="pl-lede">{copy.sentDetail}</p>
        <button type="button" className="pl-btn pl-btn-secondary" onClick={() => setLinkSent(false)}>
          {copy.sendAnotherLabel}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleEmailSubmit} className="pl-form pl-magic-form">
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

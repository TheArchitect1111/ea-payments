'use client';

import { FormEvent, useState } from 'react';

export default function TwoFactorForm({
  pendingToken,
  maskedEmail,
  verifyUrl,
  onSuccess,
}: {
  pendingToken: string;
  maskedEmail: string;
  verifyUrl: string;
  onSuccess: (result: Record<string, unknown>) => void;
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingToken, code: code.trim() }),
      });
      const data = (await res.json()) as Record<string, unknown> & { error?: string };
      if (!res.ok) {
        setError((data.error as string) ?? 'Invalid verification code.');
        setLoading(false);
        return;
      }
      onSuccess(data);
    } catch {
      setError('Could not verify code. Please try again.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="pl-form">
      <p className="pl-2fa-note">
        We sent a 6-digit verification code to <strong>{maskedEmail}</strong>.
      </p>
      <label className="pl-label" htmlFor="otp">
        Verification code
      </label>
      <input
        id="otp"
        className="pl-input pl-input-otp"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        required
        autoFocus
      />
      <button type="submit" className="pl-btn" disabled={loading || code.length !== 6}>
        {loading ? 'Verifying…' : 'Verify & sign in'}
      </button>
      {error ? (
        <p className="pl-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

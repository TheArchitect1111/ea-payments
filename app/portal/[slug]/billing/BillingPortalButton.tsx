'use client';

import { useState } from 'react';

export function BillingPortalButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function openPortal() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Could not open billing portal.');
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="ep-btn ep-btn-primary"
        onClick={openPortal}
        disabled={loading}
      >
        {loading ? 'Opening…' : 'Open billing portal'}
      </button>
      {error ? (
        <p className="ep-error" role="alert" style={{ marginTop: '1rem' }}>
          {error}
        </p>
      ) : null}
    </>
  );
}

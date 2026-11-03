'use client';
import { useState } from 'react';
export default function WoodTestButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function start() {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/public/amanda/wood-test/checkout', { method: 'POST' });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || 'Test checkout could not be opened.');
      const url = new URL(data.url);
      if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com') throw new Error('Invalid checkout address.');
      window.location.assign(url.toString());
    } catch (err) { setError(err instanceof Error ? err.message : 'Please try again.'); setBusy(false); }
  }
  return <div><button type="button" className="amanda-button" disabled={busy} onClick={start}
    data-cta-name="TEST - $1 Full Workflow (Amanda + Brick)" data-cta-key="wood-therapy-reusable-test">
    {busy ? 'Opening test checkout…' : 'TEST - $1 Full Workflow (Amanda + Brick)'}</button>
    {error && <p role="alert">{error}</p>}</div>;
}

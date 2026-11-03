'use client';
import { useState, type FormEvent } from 'react';
export default function SquareTestForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/public/amanda/square-test/checkout', { method: 'POST',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: fields.get('name'), email: fields.get('email') }) });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || 'Checkout could not be opened.');
      const url = new URL(data.url);
      if (url.protocol !== 'https:' || !['sandbox.square.link', 'connect.squareupsandbox.com'].includes(url.hostname)) throw new Error('Invalid sandbox address.');
      window.location.assign(url.toString());
    } catch (err) { setError(err instanceof Error ? err.message : 'Please try again.'); setBusy(false); }
  }
  return <form onSubmit={submit} className="grid gap-4">
    <label>Your name<input className="block w-full rounded border p-3" name="name" required minLength={2} maxLength={120} autoComplete="name" /></label>
    <label>Your email<input className="block w-full rounded border p-3" name="email" type="email" required maxLength={254} autoComplete="email" /></label>
    <button className="amanda-button" type="submit" disabled={busy}>{busy ? 'Opening Square Sandbox…' : 'Continue to $1 test checkout'}</button>
    {error && <p role="alert">{error}</p>}
  </form>;
}

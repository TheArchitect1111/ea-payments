'use client';

import { useState } from 'react';

export default function TarrisBouieDepositPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function pay() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/checkout/tarris-bouie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'tarrisb73@yahoo.com' }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || data.detail || 'Unable to open secure payment.');
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to open secure payment.');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center px-6 py-12">
      <section className="w-full max-w-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Efficiency Architects</p>
        <h1 className="mt-3 text-3xl font-bold text-neutral-950">Project Deposit</h1>
        <p className="mt-3 text-neutral-600">Tarris Bouie Client Services Agreement</p>
        <div className="my-8 border-y border-neutral-200 py-7">
          <div className="text-sm text-neutral-500">Deposit due</div>
          <div className="mt-1 text-5xl font-bold text-neutral-950">$500</div>
        </div>
        <button onClick={pay} disabled={loading} className="w-full bg-neutral-950 px-6 py-4 text-sm font-bold text-white disabled:opacity-50">
          {loading ? 'Opening secure payment…' : 'Pay $500 Deposit'}
        </button>
        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
        <p className="mt-5 text-xs text-neutral-400">Secure payment processing by Stripe. Successful payment is verified server-side and recorded against this agreement.</p>
      </section>
    </main>
  );
}

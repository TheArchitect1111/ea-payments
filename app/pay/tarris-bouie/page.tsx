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
      <section className="w-full max-w-lg border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Efficiency Architects</p>
          <h1 className="mt-3 text-3xl font-bold text-neutral-950">Project Deposit</h1>
          <p className="mt-3 text-neutral-600">Tarris Bouie Client Services Agreement</p>
          <div className="my-8 border-y border-neutral-200 py-7">
            <div className="text-sm text-neutral-500">Deposit due</div>
            <div className="mt-1 text-5xl font-bold text-neutral-950">$500</div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-neutral-950 bg-neutral-50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-base font-bold text-neutral-950">US Bank Account</div>
              <div className="mt-1 text-sm font-semibold text-neutral-700">Preferred payment method</div>
            </div>
            <span className="rounded-full bg-neutral-950 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">Preferred</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-neutral-600">Securely connect a checking or savings account through Stripe. Recommended for contract deposits and balances.</p>
        </div>

        <div className="mt-3 rounded-2xl border border-neutral-200 p-5">
          <div className="text-base font-bold text-neutral-950">Credit / Debit Card</div>
          <p className="mt-2 text-sm leading-6 text-neutral-600">Available for convenience if you prefer to pay by card.</p>
        </div>

        <p className="mt-5 text-center text-sm font-medium text-neutral-700">On the next screen, choose <strong>US bank account</strong> for the preferred option.</p>

        <button onClick={pay} disabled={loading} className="mt-5 w-full rounded-full bg-neutral-950 px-6 py-4 text-sm font-bold text-white disabled:opacity-50">
          {loading ? 'Opening secure payment…' : 'Continue to Secure Payment'}
        </button>
        {error ? <p className="mt-4 text-center text-sm text-red-700">{error}</p> : null}
        <p className="mt-5 text-center text-xs leading-5 text-neutral-400">Secure payment processing by Stripe. Successful payment is verified server-side and recorded against this agreement.</p>
      </section>
    </main>
  );
}

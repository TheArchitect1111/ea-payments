'use client';

import { FormEvent, useState } from 'react';

export default function LaunchVerificationCheckoutPage() {
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Please enter your name and email.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/checkout/launch-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, organization, email }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0f1729] text-white">
      <div className="border-b border-[#C9A844]/30 bg-[#1B2B4D] px-6 py-10 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#C9A844]">Launch Verification</p>
        <h1 className="mt-3 text-3xl font-black">EA Launch Verification</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-neutral-300">
          One-time $1.00 payment to verify production checkout, Airtable, Resend email, Make webhooks,
          and Pulse — before accepting live customers.
        </p>
        <p className="mt-4 text-2xl font-bold text-[#C9A844]">$1.00 USD</p>
      </div>

      <div className="mx-auto max-w-md px-6 py-12">
        <form onSubmit={handleSubmit} noValidate className="space-y-5 border border-white/10 bg-[#1B2B4D] p-8">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-300">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              className="w-full border border-white/20 bg-[#0f1729] px-4 py-3 text-sm text-white outline-none focus:border-[#C9A844]"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-300">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              className="w-full border border-white/20 bg-[#0f1729] px-4 py-3 text-sm text-white outline-none focus:border-[#C9A844]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-300">
              Organization
            </label>
            <input
              type="text"
              className="w-full border border-white/20 bg-[#0f1729] px-4 py-3 text-sm text-white outline-none focus:border-[#C9A844]"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              autoComplete="organization"
              placeholder="Optional"
            />
          </div>

          {error && (
            <div className="border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-300">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C9A844] px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#0f1729] hover:bg-[#d4b85a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Redirecting to Stripe...' : 'Pay $1.00 — Verify Launch Flow'}
          </button>

          <p className="text-center text-xs text-neutral-500">
            Secured by Stripe. Use a real card in production or test card in Stripe test mode.
          </p>
        </form>

        <p className="mt-6 text-center text-xs text-neutral-500">
          After payment, check Airtable Client Records, your inbox, Make history, and{' '}
          <a href="/launch" className="text-[#C9A844] underline">
            Launch Command Center
          </a>
          .
        </p>
      </div>
    </main>
  );
}

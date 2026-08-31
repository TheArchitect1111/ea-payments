'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

export default function TarrisFutureSigningPage() {
  const [legalName, setLegalName] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!consent || legalName.trim().length < 2) return;
    setLoading(true);
    try {
      const response = await fetch('/api/tarris/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ legalName: legalName.trim(), consent: true }),
      });
      const data = await response.json();
      if (!response.ok || !data?.next) throw new Error(data?.error || 'Unable to record signature.');
      window.location.assign(data.next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to record signature.');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0d10] px-5 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="border-b border-white/15 pb-8">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#d5ab3c]">Efficiency Architects</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Client Services Agreement</h1>
          <p className="mt-3 text-lg text-white/60">Tarris Bouie Digital Experience</p>
        </header>

        <section className="py-9">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><p className="text-xs uppercase tracking-wider text-white/45">Project</p><p className="mt-2 text-2xl font-semibold">$2,997</p></div>
            <div className="rounded-2xl border border-[#d5ab3c]/35 bg-[#d5ab3c]/10 p-5"><p className="text-xs uppercase tracking-wider text-[#d5ab3c]">Deposit</p><p className="mt-2 text-2xl font-semibold">$500</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><p className="text-xs uppercase tracking-wider text-white/45">Balance</p><p className="mt-2 text-2xl font-semibold">$2,497</p></div>
          </div>

          <div className="mt-7 rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d5ab3c]">Official agreement</p>
            <h2 className="mt-3 text-2xl font-semibold">Review before signing</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">This signing page is bound to the approved Tarris Bouie Client Services Agreement, including the $500 initial deposit and the 20% paid-referral commission provision.</p>
            <Link href="/tarris/future/agreement" target="_blank" className="mt-5 inline-flex rounded-full border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/5">View the full agreement</Link>
          </div>
        </section>

        <form onSubmit={submit} className="rounded-3xl bg-white p-6 text-[#111318] shadow-2xl sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#aa8122]">Electronic acceptance</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em]">Signature & project activation</h2>
          <p className="mt-3 text-sm leading-6 text-neutral-600">Type your full legal name below. By submitting, you intend this typed name to serve as your electronic signature on the agreement.</p>

          <label className="mt-7 block text-xs font-bold uppercase tracking-wider text-neutral-500" htmlFor="legalName">Electronic signature / typed legal name</label>
          <input id="legalName" autoComplete="name" value={legalName} onChange={(e) => setLegalName(e.target.value)} className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-4 text-lg outline-none focus:border-neutral-900" placeholder="Full legal name" required />

          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl bg-neutral-50 p-4 text-sm leading-6 text-neutral-700">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-5 w-5 accent-neutral-950" required />
            <span>I have reviewed the Client Services Agreement, agree to its terms, consent to use electronic records and signatures, and intend my typed legal name to constitute my signature.</span>
          </label>

          <p className="mt-4 text-xs leading-5 text-neutral-500">Signing records the agreement version, date and time, network address, browser information, and signer identity in the Efficiency Architects audit trail.</p>

          <button disabled={loading || !consent || legalName.trim().length < 2} className="mt-6 w-full rounded-full bg-[#0b0d10] px-6 py-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
            {loading ? 'Recording signature…' : 'Sign Agreement & Continue to $500 Deposit'}
          </button>
          {error ? <p className="mt-4 text-center text-sm font-semibold text-red-700" role="alert">{error}</p> : null}
        </form>

        <footer className="py-8 text-center text-xs text-white/35">Secure agreement workflow · Efficiency Architects</footer>
      </div>
    </main>
  );
}

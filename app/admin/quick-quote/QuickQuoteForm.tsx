'use client';

import { FormEvent, useState } from 'react';

type QuoteResult = {
  proposalId: string;
  quoteUrl: string;
  commitmentUrl: string;
  totalFee: number;
  depositAmount: number;
};

export default function QuickQuoteForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<QuoteResult | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      businessName: form.get('businessName'),
      contactName: form.get('contactName'),
      email: form.get('email'),
      projectName: form.get('projectName'),
      scopeSummary: form.get('scopeSummary'),
      timeline: form.get('timeline'),
      totalFee: Number(form.get('totalFee')),
      depositAmount: Number(form.get('depositAmount')),
    };

    try {
      const response = await fetch('/api/admin/quick-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as QuoteResult & { error?: string };
      if (!response.ok) throw new Error(data.error || 'Could not create quote.');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create quote.');
    } finally {
      setLoading(false);
    }
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
  }

  async function share(url: string) {
    if (navigator.share) {
      await navigator.share({ title: 'Efficiency Architects Quote', url });
      return;
    }
    await copy(url);
  }

  const inputClass = 'mt-1 w-full rounded-2xl border border-[#DDD8CD] bg-white px-4 py-3.5 text-base text-[#17233B] outline-none focus:border-[#B58B20]';
  const labelClass = 'block text-sm font-bold text-[#17233B]';

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-4 rounded-[28px] border border-[#E5E0D5] bg-white p-4 shadow-[0_18px_50px_rgba(50,45,35,0.06)] sm:p-6">
        <label className={labelClass}>Client / organization
          <input name="businessName" required className={inputClass} placeholder="Acme Organization" />
        </label>
        <label className={labelClass}>Contact name
          <input name="contactName" required className={inputClass} placeholder="Client name" />
        </label>
        <label className={labelClass}>Client email
          <input name="email" type="email" required className={inputClass} placeholder="client@example.com" autoCapitalize="none" />
        </label>
        <label className={labelClass}>Project
          <input name="projectName" required className={inputClass} placeholder="Website + Digital Portal" />
        </label>
        <label className={labelClass}>What is included
          <textarea name="scopeSummary" required rows={6} className={inputClass} placeholder={'Website redesign\nClient portal\nEva digital assistant\nLaunch setup'} />
        </label>
        <label className={labelClass}>Estimated timeline
          <input name="timeline" className={inputClass} placeholder="2–4 weeks" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>Project price
            <input name="totalFee" type="number" min="1" step="0.01" required className={inputClass} placeholder="1497" inputMode="decimal" />
          </label>
          <label className={labelClass}>Deposit
            <input name="depositAmount" type="number" min="1" step="0.01" defaultValue="500" required className={inputClass} inputMode="decimal" />
          </label>
        </div>
        <button disabled={loading} className="w-full rounded-full bg-[#17233B] px-5 py-4 text-sm font-black uppercase tracking-[0.15em] text-white disabled:opacity-50">
          {loading ? 'Creating…' : 'Create Client Link'}
        </button>
        {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
      </form>

      {result ? (
        <section className="rounded-[28px] border border-[#D8C58F] bg-[#FFF9E9] p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8A6710]">Ready to send</p>
          <p className="mt-2 text-lg font-black text-[#17233B]">Quote {result.proposalId}</p>
          <p className="mt-1 text-sm text-neutral-600">The client reviews the quote, accepts the agreement, then pays the deposit.</p>
          <div className="mt-4 grid gap-2">
            <button type="button" onClick={() => void share(result.quoteUrl)} className="rounded-full bg-[#17233B] px-5 py-3.5 text-sm font-bold text-white">Share Client Link</button>
            <button type="button" onClick={() => void copy(result.quoteUrl)} className="rounded-full border border-[#C8B679] bg-white px-5 py-3.5 text-sm font-bold text-[#17233B]">Copy Link</button>
            <a href={result.quoteUrl} target="_blank" rel="noreferrer" className="rounded-full border border-[#D7D1C4] bg-white px-5 py-3.5 text-center text-sm font-bold text-[#17233B]">Preview Quote</a>
          </div>
        </section>
      ) : null}
    </div>
  );
}

'use client';

import { useState } from 'react';

const TYPES = [
  'New Website Section',
  'New Page',
  'New Form',
  'New Workflow',
  'New Automation',
  'New Dashboard',
  'New Integration',
  'New Portal Module',
  'Design Enhancement',
  'Branding Refresh',
  'Custom Feature',
  'Other',
];

export default function EnhancementRequestForm({ slug }: { slug: string }) {
  const [enhancementType, setEnhancementType] = useState('');
  const [description, setDescription] = useState('');
  const [businessGoal, setBusinessGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function submit() {
    setError('');
    if (!enhancementType || !description.trim() || !businessGoal.trim()) {
      setError('Please complete all fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/portal/enhancements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enhancementType, description, businessGoal }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Request could not be submitted.');
        return;
      }
      setDone(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="border border-neutral-200 bg-white p-8">
        <h2 className="text-2xl font-black text-[#1B2B4D]">Request Received</h2>
        <p className="mt-3 text-sm leading-7 text-neutral-600">
          Your enhancement request has been received. We will review it and send you an estimate within 24 hours.
        </p>
        <a href={`/portal/${slug}/updates`} className="mt-6 inline-block bg-[#C9A844] px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#1B2B4D]">Return To Dashboard</a>
      </div>
    );
  }

  return (
    <div className="border border-neutral-200 bg-white p-6">
      <div className="grid gap-5">
        <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          Enhancement Type
          <select value={enhancementType} onChange={(e) => setEnhancementType(e.target.value)} className="mt-1 block w-full border border-neutral-300 p-3 text-sm font-normal normal-case tracking-normal text-neutral-900">
            <option value="">Select one</option>
            {TYPES.map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
        <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          Description Of What You Want
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} className="mt-1 block w-full border border-neutral-300 p-3 text-sm font-normal normal-case tracking-normal text-neutral-900" />
        </label>
        <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          Business Goal
          <textarea value={businessGoal} onChange={(e) => setBusinessGoal(e.target.value)} rows={5} className="mt-1 block w-full border border-neutral-300 p-3 text-sm font-normal normal-case tracking-normal text-neutral-900" />
        </label>
      </div>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      <button type="button" onClick={submit} disabled={loading} className="mt-6 bg-[#C9A844] px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#1B2B4D]">
        {loading ? 'Submitting...' : 'Submit Enhancement Request'}
      </button>
    </div>
  );
}

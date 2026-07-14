'use client';

import { useState } from 'react';
import { GOLD, NAVY } from '@/lib/design-system';

type ProvisionResult = {
  ok?: boolean;
  siteUrl?: string;
  portalSlug?: string;
  pageId?: string;
  error?: string;
  forced?: boolean;
};

export default function WebsitePortalOpsPanel() {
  const [portalSlug, setPortalSlug] = useState('demo-client');
  const [businessName, setBusinessName] = useState('Demo Client');
  const [force, setForce] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ProvisionResult | null>(null);
  const [error, setError] = useState('');

  async function provision() {
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/admin/website-portal/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portalSlug: portalSlug.trim(),
          businessName: businessName.trim() || undefined,
          force,
        }),
      });
      const data = (await res.json()) as ProvisionResult;
      if (!res.ok || data.error) {
        setError(data.error || `Request failed (${res.status})`);
        return;
      }
      setResult(data);
    } catch {
      setError('Network error. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border border-neutral-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
            Website + Portal
          </p>
          <h2 className="mt-1 text-lg font-extrabold uppercase tracking-wide" style={{ color: NAVY }}>
            Launch proof desk
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
            Prove starter site generation without a Stripe purchase. Buy path stays at{' '}
            <a href="/buy" className="font-semibold underline" style={{ color: NAVY }}>
              /buy
            </a>
            .
          </p>
        </div>
        <a
          href="/buy"
          className="rounded-sm border border-neutral-300 px-3 py-2 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:border-neutral-800"
        >
          Open buy path
        </a>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="block text-left">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            Portal slug
          </span>
          <input
            value={portalSlug}
            onChange={(e) => setPortalSlug(e.target.value)}
            className="w-full border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-800"
            placeholder="demo-client"
          />
        </label>
        <label className="block text-left">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            Business name
          </span>
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-800"
            placeholder="Demo Client"
          />
        </label>
        <button
          type="button"
          disabled={busy || !portalSlug.trim()}
          onClick={() => void provision()}
          className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
          style={{ background: NAVY }}
        >
          {busy ? 'Provisioning…' : 'Provision site'}
        </button>
      </div>

      <label className="mt-3 flex items-center gap-2 text-xs text-neutral-600">
        <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} />
        Force refresh if a Home page already exists
      </label>

      {error ? (
        <p className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {result?.siteUrl ? (
        <div className="mt-4 border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-sm text-emerald-900">
          <p className="font-bold">Site ready{result.forced ? ' (refreshed)' : ''}.</p>
          <a href={result.siteUrl} className="mt-1 inline-block break-all underline" target="_blank" rel="noreferrer">
            {result.siteUrl}
          </a>
          {result.portalSlug ? (
            <p className="mt-2 text-xs text-emerald-800">
              Portal:{' '}
              <a href={`/portal/${result.portalSlug}`} className="underline">
                /portal/{result.portalSlug}
              </a>
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

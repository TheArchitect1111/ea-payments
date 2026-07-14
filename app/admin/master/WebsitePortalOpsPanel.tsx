'use client';

import { useEffect, useState } from 'react';
import { GOLD, NAVY } from '@/lib/design-system';

type ProvisionResult = {
  ok?: boolean;
  siteUrl?: string;
  portalSlug?: string;
  pageId?: string;
  error?: string;
  forced?: boolean;
};

type Readiness = {
  ready?: boolean;
  airtableConfigured?: boolean;
  creativeStudioSchemaOk?: boolean;
  offerPurchasable?: boolean;
  magicLinkConfigured?: boolean;
  blockers?: string[];
};

export default function WebsitePortalOpsPanel() {
  const [portalSlug, setPortalSlug] = useState('demo-client');
  const [businessName, setBusinessName] = useState('Demo Client');
  const [force, setForce] = useState(true);
  const [busy, setBusy] = useState(false);
  const [setupBusy, setSetupBusy] = useState(false);
  const [result, setResult] = useState<ProvisionResult | null>(null);
  const [error, setError] = useState('');
  const [setupMessage, setSetupMessage] = useState('');
  const [readiness, setReadiness] = useState<Readiness | null>(null);

  async function loadReadiness() {
    try {
      const res = await fetch('/api/admin/website-portal/readiness');
      const data = (await res.json()) as Readiness & { error?: string };
      if (!res.ok) {
        setReadiness({ ready: false, blockers: [data.error || 'Could not load readiness'] });
        return;
      }
      setReadiness(data);
    } catch {
      setReadiness({ ready: false, blockers: ['Network error loading readiness'] });
    }
  }

  useEffect(() => {
    void loadReadiness();
  }, []);

  async function fixSchema() {
    setSetupBusy(true);
    setError('');
    setSetupMessage('');
    try {
      const res = await fetch('/api/admin/website-portal/setup-schema', { method: 'POST' });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        setup?: { errors?: string[] };
        schema?: { creativeStudio?: { ok?: boolean; missingFields?: string[] } };
      };
      if (!res.ok || data.error) {
        setError(data.error || `Schema setup failed (${res.status})`);
        return;
      }
      const missing = data.schema?.creativeStudio?.missingFields?.join(', ');
      if (data.ok) {
        setSetupMessage('Creative Studio schema is ready.');
      } else {
        setError(
          data.setup?.errors?.join('; ') ||
            (missing
              ? `Creative Studio still incomplete: ${missing}`
              : 'Schema setup finished but Creative Studio is still incomplete.'),
        );
      }
      await loadReadiness();
    } catch {
      setError('Network error running schema setup.');
    } finally {
      setSetupBusy(false);
    }
  }

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
      void loadReadiness();
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
            Confirm durability, prove starter site generation without Stripe, then sell at{' '}
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

      <div
        className={`mt-4 border px-4 py-3 text-sm ${
          readiness?.ready
            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
            : 'border-amber-200 bg-amber-50 text-amber-950'
        }`}
      >
        <p className="font-bold">
          {readiness == null
            ? 'Checking readiness…'
            : readiness.ready
              ? 'Ready for durable Website + Portal sales'
              : 'Not fully ready — fix blockers before a live purchase'}
        </p>
        {readiness?.blockers && readiness.blockers.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5">
            {readiness.blockers.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-wider">
          <span>Airtable {readiness?.airtableConfigured ? '✓' : '✗'}</span>
          <span>Creative Studio {readiness?.creativeStudioSchemaOk ? '✓' : '✗'}</span>
          <span>Offer {readiness?.offerPurchasable ? '✓' : '✗'}</span>
          <span>Magic link {readiness?.magicLinkConfigured ? '✓' : '✗'}</span>
          {readiness && !readiness.creativeStudioSchemaOk ? (
            <button
              type="button"
              disabled={setupBusy || busy}
              onClick={() => void fixSchema()}
              className="rounded-sm border border-amber-400 bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-950 hover:border-amber-700 disabled:opacity-50"
            >
              {setupBusy ? 'Fixing schema…' : 'Fix schema'}
            </button>
          ) : null}
          <button
            type="button"
            disabled={setupBusy || busy}
            onClick={() => void loadReadiness()}
            className="rounded-sm border border-neutral-300 bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-neutral-700 hover:border-neutral-800 disabled:opacity-50"
          >
            Refresh status
          </button>
        </div>
        {setupMessage ? <p className="mt-2 text-xs font-semibold text-emerald-800">{setupMessage}</p> : null}
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

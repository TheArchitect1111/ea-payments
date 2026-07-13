'use client';

import { NAVY, GOLD } from '@/lib/design-system';
import { useMemo, useState } from 'react';

export type PaymentOfferRow = {
  id: string;
  kind: 'one_time' | 'subscription';
  displayName: string;
  airtablePackageName: string;
  priceCents: number;
  interval: 'month' | 'year' | null;
  moduleCount: number;
  capabilityCount: number;
  includesBilling: boolean;
  includesConnect: boolean;
  stripePriceEnvKey: string;
};

export type PaymentsHealth = {
  ok: boolean;
  errors: string[];
  offerCount: number;
  oneTimeCount: number;
  subscriptionCount: number;
};

function formatMoney(cents: number, interval: 'month' | 'year' | null): string {
  if (cents === 0) return 'Contact';
  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(cents / 100);
  if (!interval) return amount;
  return interval === 'month' ? `${amount}/mo` : `${amount}/yr`;
}

export default function PaymentsPanel({
  health,
  offers,
}: {
  health: PaymentsHealth;
  offers: PaymentOfferRow[];
}) {
  const [kind, setKind] = useState<'all' | 'one_time' | 'subscription'>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return offers.filter((o) => {
      if (kind !== 'all' && o.kind !== kind) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        o.displayName.toLowerCase().includes(q) ||
        o.airtablePackageName.toLowerCase().includes(q)
      );
    });
  }, [offers, kind, query]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 p-5 space-y-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: GOLD }}>
            Payments contract
          </p>
          <h3 className="text-lg font-bold mt-1" style={{ color: NAVY }}>
            Commerce offers ? entitlements
          </h3>
          <p className="text-sm text-neutral-500 mt-1">
            Canonical source: <code>@ea/payments-contract</code>. Checkout, webhooks, and package
            fallbacks resolve module grants from these offers.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          <span
            className={`px-2 py-1 rounded font-bold uppercase ${
              health.ok ? 'bg-green-50 text-green-800' : 'bg-rose-50 text-rose-800'
            }`}
          >
            Integrity {health.ok ? 'OK' : 'Issues'}
          </span>
          <span className="px-2 py-1 rounded font-bold uppercase bg-neutral-100 text-neutral-700">
            {health.offerCount} offers
          </span>
          <span className="px-2 py-1 rounded font-bold uppercase bg-neutral-100 text-neutral-700">
            {health.oneTimeCount} one-time
          </span>
          <span className="px-2 py-1 rounded font-bold uppercase bg-neutral-100 text-neutral-700">
            {health.subscriptionCount} subscription
          </span>
        </div>
        {!health.ok && health.errors.length > 0 && (
          <ul className="text-sm text-rose-700 list-disc pl-5">
            {health.errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        )}
        <p className="text-xs text-neutral-500">
          APIs: <code>/api/platform/payments</code> ? <code>/api/checkout/offers</code>
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold text-neutral-500 mb-1">Kind</label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
            className="border border-neutral-200 rounded px-3 py-2 text-sm bg-white"
          >
            <option value="all">All</option>
            <option value="one_time">One-time</option>
            <option value="subscription">Subscription</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-neutral-500 mb-1">Search</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="simplifi, platform, launch?"
            className="w-full border border-neutral-200 rounded px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((offer) => (
          <article key={offer.id} className="bg-white border border-neutral-200 p-4 space-y-2">
            <div className="flex justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: GOLD }}>
                  {offer.kind.replace('_', ' ')} ? {offer.airtablePackageName}
                </p>
                <h4 className="font-bold mt-1" style={{ color: NAVY }}>
                  {offer.displayName}
                </h4>
                <p className="text-xs font-mono text-neutral-400 mt-1">{offer.id}</p>
              </div>
              <p className="text-sm font-bold shrink-0" style={{ color: NAVY }}>
                {formatMoney(offer.priceCents, offer.interval)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="px-2 py-1 rounded bg-neutral-100 text-neutral-700">
                {offer.moduleCount} modules
              </span>
              <span className="px-2 py-1 rounded bg-neutral-100 text-neutral-700">
                {offer.capabilityCount} capabilities
              </span>
              {offer.includesBilling && (
                <span className="px-2 py-1 rounded bg-sky-50 text-sky-900">billing</span>
              )}
              {offer.includesConnect && (
                <span className="px-2 py-1 rounded bg-amber-50 text-amber-900">connect</span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 font-mono">{offer.stripePriceEnvKey}</p>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-neutral-400 text-sm py-8">No offers match.</p>
      )}
    </div>
  );
}

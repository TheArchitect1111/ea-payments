'use client';

import { useMemo, useState } from 'react';
import type { MarketplaceListing } from '@/lib/partner-marketplace';
import { MARKETPLACE_CATEGORIES } from '@/lib/partner-marketplace';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';

export default function PartnerMarketplaceClient({
  listings,
}: {
  listings: MarketplaceListing[];
}) {
  const [category, setCategory] = useState<string>('');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      const matchCat = !category || l.category === category;
      const q = query.toLowerCase();
      const matchQ =
        !q ||
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.tags.some((t) => t.includes(q));
      return matchCat && matchQ;
    });
  }, [listings, category, query]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: GOLD }}>
          Partner Marketplace™
        </p>
        <h2 className="text-2xl font-extrabold" style={{ color: NAVY }}>
          Referral programs, satellite hubs & co-sell
        </h2>
        <p className="text-sm text-neutral-500 mt-2 max-w-2xl">
          Discover EA packages, satellite products (CPR, BrotherHub, SisterHub), referral programs,
          and active partner listings from the Partner Network base.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold text-neutral-500 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-neutral-200 rounded px-3 py-2 text-sm"
          >
            <option value="">All categories</option>
            {MARKETPLACE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-neutral-500 mb-1">Search</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="CPR, referral, implementation…"
            className="w-full border border-neutral-200 rounded px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((listing) => (
          <MarketplaceCard key={listing.id} listing={listing} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-neutral-400 text-sm py-12">No listings match your filters.</p>
      )}
    </div>
  );
}

function MarketplaceCard({ listing }: { listing: MarketplaceListing }) {
  const external = listing.href.startsWith('http');

  return (
    <div className="bg-white border border-neutral-200 p-6 flex flex-col gap-3">
      <div className="flex justify-between items-start gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            {listing.category} · {listing.tier}
          </p>
          <h3 className="text-lg font-bold mt-1" style={{ color: NAVY }}>
            {listing.title}
          </h3>
        </div>
        {listing.live && (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-green-50 text-green-800">
            Live
          </span>
        )}
      </div>

      <p className="text-sm text-neutral-600 flex-1">{listing.description}</p>

      <div className="flex flex-wrap gap-1">
        {listing.products.map((p) => (
          <span key={p} className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 text-neutral-600">
            {p}
          </span>
        ))}
      </div>

      {listing.commission && (
        <p className="text-xs font-semibold" style={{ color: GOLD }}>
          Commission: {listing.commission}
        </p>
      )}

      {listing.partner && (
        <p className="text-xs text-neutral-500">Partner: {listing.partner}</p>
      )}

      <a
        href={listing.href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className="inline-block text-xs font-bold mt-auto"
        style={{ color: GOLD }}
      >
        {external ? 'Open hub →' : 'View in Mission Control →'}
      </a>
    </div>
  );
}

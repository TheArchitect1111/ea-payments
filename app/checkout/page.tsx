'use client';

import { useEffect, useMemo, useState, FormEvent } from 'react';

type CheckoutOfferOption = {
  id: string;
  kind: 'one_time' | 'subscription';
  displayName: string;
  description: string;
  priceCents: number;
  interval: 'month' | 'year' | null;
  trialDays: number;
  purchasable: boolean;
};

function formatMoney(priceCents: number): string {
  if (priceCents === 0) return 'Contact for pricing';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(priceCents / 100);
}

function formatOfferPrice(offer: CheckoutOfferOption): string {
  const amount = formatMoney(offer.priceCents);
  if (offer.kind !== 'subscription' || !offer.interval) return amount;
  return offer.interval === 'month' ? `${amount}/mo` : `${amount}/yr`;
}

export default function CheckoutPage() {
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [packageId, setPackageId] = useState('');
  const [referralSource, setReferralSource] = useState('');
  const [offers, setOffers] = useState<CheckoutOfferOption[]>([]);
  const [offersLoading, setOffersLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const subscriptionOffers = useMemo(
    () => offers.filter((o) => o.kind === 'subscription' && o.purchasable),
    [offers],
  );
  const oneTimeOffers = useMemo(
    () => offers.filter((o) => o.kind === 'one_time' && o.purchasable),
    [offers],
  );
  const contactOnlyCount = useMemo(
    () => offers.filter((o) => o.kind === 'one_time' && !o.purchasable).length,
    [offers],
  );

  const selected = offers.find((o) => o.id === packageId);
  const isSubscription = selected?.kind === 'subscription';
  const showAchNote =
    selected && selected.kind === 'one_time' && selected.priceCents > 50000;

  useEffect(() => {
    let cancelled = false;
    setOffersLoading(true);
    fetch('/api/checkout/offers?purchasable=0')
      .then((res) => res.json())
      .then((data: { offers?: CheckoutOfferOption[] }) => {
        if (cancelled) return;
        if (Array.isArray(data.offers)) setOffers(data.offers);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setOffersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (offersLoading || offers.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const pick = params.get('plan') || params.get('package');
    if (!pick) return;
    const match = offers.find((o) => o.id === pick && o.purchasable);
    if (!match) return;
    const timer = window.setTimeout(() => setPackageId(match.id), 0);
    return () => window.clearTimeout(timer);
  }, [offers, offersLoading]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !packageId) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setError('');

    const endpoint = isSubscription ? '/api/checkout/subscription' : '/api/checkout';
    const body = isSubscription
      ? { name, organization, email, phone, planId: packageId, referralSource }
      : { name, organization, email, phone, packageId, referralSource };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
    <main className="min-h-screen bg-neutral-50">
      <div className="bg-neutral-950 px-6 py-8 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
          Efficiency Architects
        </p>
        <h1 className="mt-2 text-2xl font-extrabold uppercase tracking-widest text-white">
          Get Started
        </h1>
      </div>

      <div className="mx-auto max-w-xl px-6 py-12">
        <form onSubmit={handleSubmit} noValidate className="space-y-5 border border-neutral-200 bg-white p-8">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-700">
              Full Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              className="w-full border border-neutral-300 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              placeholder="Jane Smith"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-700">
              Organization
            </label>
            <input
              type="text"
              className="w-full border border-neutral-300 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              autoComplete="organization"
              placeholder="Your company or organization"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-700">
              Email <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              className="w-full border border-neutral-300 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="jane@company.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-700">
              Phone
            </label>
            <input
              type="tel"
              className="w-full border border-neutral-300 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              placeholder="(555) 555-5555"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-700">
              Package <span className="text-red-600">*</span>
            </label>
            <select
              className="w-full border border-neutral-300 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800"
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              disabled={offersLoading}
            >
              <option value="">
                {offersLoading ? 'Loading packages?' : 'Select a package'}
              </option>
              {subscriptionOffers.length > 0 && (
                <optgroup label="Subscriptions">
                  {subscriptionOffers.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.displayName} ? {formatOfferPrice(plan)}
                      {plan.trialDays > 0 ? ` (${plan.trialDays}-day trial)` : ''}
                    </option>
                  ))}
                </optgroup>
              )}
              {oneTimeOffers.length > 0 && (
                <optgroup label="One-time">
                  {oneTimeOffers.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.displayName} ? {formatOfferPrice(product)}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            {contactOnlyCount > 0 && (
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                Capacity and implementation packages are scoped after your assessment. Email{' '}
                <a href="mailto:freedom@efficiencyarchitects.online" className="font-semibold underline">
                  freedom@efficiencyarchitects.online
                </a>{' '}
                for pricing on those tiers.
              </p>
            )}
            {selected && (
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                {selected.description}
                {selected.kind === 'subscription' && selected.trialDays > 0
                  ? ` Includes a ${selected.trialDays}-day free trial.`
                  : ''}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-700">
              Referral Source
            </label>
            <input
              type="text"
              className="w-full border border-neutral-300 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800"
              value={referralSource}
              onChange={(e) => setReferralSource(e.target.value)}
              placeholder="Were you referred by a partner? Enter their name or leave blank"
            />
          </div>

          {showAchNote && (
            <div className="border-l-4 border-blue-500 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              <strong>ACH bank transfer recommended.</strong> For this amount, paying by ACH (US
              bank account) significantly reduces processing fees. You will be offered this option
              at checkout.
            </div>
          )}

          {error && (
            <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || offersLoading}
            className="w-full bg-neutral-950 px-6 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Redirecting to payment...'
              : isSubscription
                ? 'Start Subscription'
                : 'Proceed to Payment'}
          </button>

          <p className="text-center text-xs text-neutral-400">
            Secured by Stripe. We accept card, ACH bank transfer, Apple Pay, and Google Pay.
          </p>
        </form>
      </div>
    </main>
  );
}

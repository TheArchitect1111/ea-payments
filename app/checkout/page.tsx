'use client';

import { useState, FormEvent } from 'react';
import { getEACatalog, formatPrice } from '@/lib/catalog';

const EA_PRODUCTS = getEACatalog();

export default function CheckoutPage() {
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [packageId, setPackageId] = useState('');
  const [referralSource, setReferralSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedItem = EA_PRODUCTS.find((p) => p.id === packageId);
  const showAchNote = selectedItem && selectedItem.priceCents > 50000;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !packageId) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, organization, email, phone, packageId, referralSource }),
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
            >
              <option value="">Select a package</option>
              {EA_PRODUCTS.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.displayName} - {formatPrice(product.priceCents)}
                </option>
              ))}
            </select>
            {selectedItem && (
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                {selectedItem.description}
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
            disabled={loading}
            className="w-full bg-neutral-950 px-6 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Redirecting to payment...' : 'Proceed to Payment'}
          </button>

          <p className="text-center text-xs text-neutral-400">
            Secured by Stripe. We accept card, ACH bank transfer, Apple Pay, and Google Pay.
          </p>
        </form>
      </div>
    </main>
  );
}

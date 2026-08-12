'use client';

import { useEffect, useState } from 'react';
import { AMANDA_OFFERS } from '@/lib/amanda-catherine/config';

export default function AmandaPayments({ email }: { email: string }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [options, setOptions] = useState<{
    deposits: Record<string, number>;
    memberships: Array<{ id: string; name: string; available: boolean }>;
    financingUrl?: string | null;
  }>({ deposits: {}, memberships: [] });

  useEffect(() => {
    void fetch('/api/portal/amanda/checkout').then((res) => res.json()).then((data) => {
      if (data.deposits) setOptions(data);
    });
  }, []);

  async function checkout(offerId: string, paymentOption: 'full' | 'deposit') {
    setBusy(`${offerId}:${paymentOption}`);
    setError('');
    try {
      const res = await fetch('/api/portal/amanda/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId, paymentOption }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error || 'Checkout could not be opened.');
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError('Checkout network error.');
    } finally {
      setBusy('');
    }
  }

  async function membershipCheckout(membershipId: string) {
    setBusy(membershipId);
    setError('');
    const res = await fetch('/api/portal/amanda/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ membershipId }),
    });
    const data = await res.json() as { url?: string; error?: string };
    if (!res.ok || !data.url) setError(data.error || 'Membership checkout could not be opened.');
    else window.location.assign(data.url);
    setBusy('');
  }

  return (
    <section>
      <p className="ep-module-card-note" style={{ marginBottom: 16 }}>Receipts are sent to {email} after successful payment.</p>
      {error ? <p className="ep-module-card-note" style={{ color: '#b42318' }}>{error}</p> : null}
      <ul className="ep-module-list">
        {AMANDA_OFFERS.map((offer) => (
          <li key={offer.id} className="ep-module-card">
            <p className="ep-module-card-title">{offer.name}</p>
            <p className="ep-module-card-note">CAD ${offer.priceCad.toLocaleString()}</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
              <button className="ep-btn" disabled={Boolean(busy)} onClick={() => void checkout(offer.id, 'full')}>
                {busy === `${offer.id}:full` ? 'Opening…' : 'Pay in full'}
              </button>
              {options.deposits[offer.id] > 0 ? (
                <button className="ep-btn ep-btn-secondary" disabled={Boolean(busy)} onClick={() => void checkout(offer.id, 'deposit')}>
                  {busy === `${offer.id}:deposit` ? 'Opening…' : `Pay CAD $${options.deposits[offer.id].toLocaleString()} deposit`}
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {options.memberships.length ? (
        <div className="ep-module-card" style={{ marginTop: 18 }}>
          <p className="ep-module-card-title">Memberships</p>
          <p className="ep-module-card-note">Preview the membership options below. Enrollment will open after Amanda confirms pricing.</p>
          {options.memberships.map((membership) => (
            <p key={membership.id} style={{ marginTop: 12 }}>
              <button className="ep-btn" disabled={Boolean(busy) || !membership.available} onClick={() => void membershipCheckout(membership.id)}>
                {busy === membership.id ? 'Opening…' : membership.available ? `Join ${membership.name}` : `${membership.name} — pricing to be confirmed`}
              </button>
            </p>
          ))}
        </div>
      ) : null}
      {options.financingUrl ? (
        <p style={{ marginTop: 18 }}><a className="ep-btn ep-btn-secondary" href={options.financingUrl} target="_blank" rel="noreferrer">View payment-plan options</a></p>
      ) : (
        <div className="ep-module-card" style={{ marginTop: 18 }}>
          <p className="ep-module-card-title">Payment-plan options</p>
          <p className="ep-module-card-note">Financing details will be added after Amanda selects her preferred provider.</p>
          <button className="ep-btn ep-btn-secondary" disabled style={{ marginTop: 12 }}>Available after preview approval</button>
        </div>
      )}
    </section>
  );
}

'use client';

import { useState, type FormEvent } from 'react';
import type { AmandaKitOrder } from '@/lib/amanda-catherine/practitioner-kit-orders';

export default function KitOrderActions({ order }: { order: AmandaKitOrder }) {
  const [carrier, setCarrier] = useState(order.carrier || '');
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [trackingUrl, setTrackingUrl] = useState(order.trackingUrl || '');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  function printPackingSheet() {
    const target = window.open('', '_blank');
    if (!target) { setStatus('Allow pop-ups to print the packing sheet.'); return; }
    const doc = target.document;
    doc.open();
    doc.write('<!doctype html><html><head><title>Amanda kit packing sheet</title><style>body{font:16px Arial,sans-serif;max-width:680px;margin:36px auto;padding:0 24px;color:#17130f}h1{font-size:24px}p{line-height:1.5}.note{border:1px solid #999;padding:12px;margin-top:24px}@media print{button{display:none}}</style></head><body></body></html>');
    doc.close();
    const heading = doc.createElement('h1'); heading.textContent = 'Amanda Catherine · Practitioner Kit packing sheet'; doc.body.append(heading);
    const rows = [order.name || 'Customer', order.email || '', order.phone || '', order.shippingAddress?.line1 || '', order.shippingAddress?.line2 || '', [order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.postal_code].filter(Boolean).join(', '), order.shippingAddress?.country || '', `Order ${order.id}`].filter(Boolean);
    for (const value of rows) { const row = doc.createElement('p'); row.textContent = value; doc.body.append(row); }
    const note = doc.createElement('p'); note.className = 'note'; note.textContent = 'Packing sheet only. This is not a prepaid carrier postage label. Purchase postage through the carrier and record the real tracking details in Amanda’s order queue.'; doc.body.append(note);
    target.focus(); target.print();
  }

  async function saveTracking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setStatus('Saving tracking…');
    try {
      const response = await fetch(`/api/portal/amanda/practitioner-kit/orders/${encodeURIComponent(order.id)}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ carrier, trackingNumber, trackingUrl }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Tracking could not be saved.');
      setStatus('Tracking saved to this order.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Tracking could not be saved.'); }
    finally { setBusy(false); }
  }

  return <section className="ac-card" aria-label="Shipping actions">
    <p>Free shipping is the launch fallback. Use the packing sheet, purchase carrier postage manually, then save the real tracking details here.</p>
    <button type="button" onClick={printPackingSheet}>Print packing sheet</button>
    <form onSubmit={saveTracking} className="ac-kit-tracking-form">
      <label>Carrier<input required maxLength={80} value={carrier} onChange={(event) => setCarrier(event.target.value)} /></label>
      <label>Tracking number<input required maxLength={120} value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} /></label>
      <label>Tracking link<input required type="url" pattern="https://.*" maxLength={2000} value={trackingUrl} onChange={(event) => setTrackingUrl(event.target.value)} /></label>
      <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save tracking'}</button>
    </form>
    {order.trackingNumber ? <p>Saved: {order.carrier} · <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer">{order.trackingNumber} ↗</a></p> : null}
    <p role="status">{status}</p>
  </section>;
}

'use client';
import KitFulfillmentFields, { pickupSelection } from '@/app/components/amanda/KitFulfillmentFields';
import type { AmandaKitSelection } from '@/lib/amanda-catherine/kit-fulfillment';
import { useState } from 'react';

export default function KitCheckout() {
  const [kit, setKit] = useState<AmandaKitSelection>(pickupSelection);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  async function checkout() {
    setBusy(true);setError('');
    try {
      const response = await fetch('/api/public/amanda/practitioner-kit/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(kit)});
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error(result.error || 'Checkout is unavailable.');
      const url = new URL(result.url);
      if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com') throw new Error('The secure checkout address could not be verified.');
      window.location.assign(url.href);
    } catch(error) {setError(error instanceof Error ? error.message : 'Please try again.');setBusy(false);}
  }
  return <><KitFulfillmentFields value={kit} onChange={setKit} included={false} /><button className="ac-kit-button" type="button" onClick={checkout} disabled={busy}>{busy?'Opening secure checkout…':'Purchase securely · $499 CAD'}</button><p role="status" aria-live="polite">{error}</p></>;
}

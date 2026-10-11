'use client';
import KitFulfillmentFields, { pickupSelection } from '@/app/components/amanda/KitFulfillmentFields';
import type { AmandaKitSelection } from '@/lib/amanda-catherine/kit-fulfillment';
import { useState } from 'react';

export default function KitCheckout() {
  const [kit, setKit] = useState<AmandaKitSelection>(pickupSelection);
  const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [phone,setPhone]=useState('');
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  async function checkout(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);setError('');
    try {
      const response = await fetch('/api/public/amanda/practitioner-kit/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...kit,name,email,phone})});
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error(result.error || 'Checkout is unavailable.');
      const url = new URL(result.url);
      if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com') throw new Error('The secure checkout address could not be verified.');
      window.location.assign(url.href);
    } catch(error) {setError(error instanceof Error ? error.message : 'Please try again.');setBusy(false);}
  }
  return <form onSubmit={checkout}><label>Name<input name="name" autoComplete="name" required minLength={2} value={name} onChange={e=>setName(e.target.value)}/></label><label>Email<input name="email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Phone (optional)<input name="phone" type="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)}/></label><KitFulfillmentFields value={kit} onChange={setKit} included={false} /><button data-cta-name="Purchase practitioner kit" data-cta-key="purchase-practitioner-kit" className="ac-kit-button" type="submit" disabled={busy}>{busy?'Opening secure checkout…':'Purchase securely · $499 CAD'}</button><p role="status" aria-live="polite">{error}</p></form>;
}

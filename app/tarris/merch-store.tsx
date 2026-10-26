"use client";

import { useEffect, useState } from 'react';
import catalog from '../../public/tb3/merch/manifest.json';

type Product = (typeof catalog)[number];
type Line = { variantId: number; quantity: number };

function ProductCard({ product, add }: {
  product: Product;
  add: (variantId: number) => void;
}) {
  const [variantId, setVariantId] = useState(product.variants[0].id);
  return <article id={`merch-${product.id}`} className="min-w-0 scroll-mt-20" data-product-id={product.printfulProductId}>
    <div className="aspect-square bg-white p-3">
      <img src={product.image} alt={product.name}
        className="h-full w-full object-contain" loading="lazy" />
    </div>
    <h3 className="mt-3 text-xs font-bold">{product.name}</h3>
    <p className="mt-2 text-sm">${product.price.toFixed(2)} USD</p>
    <label className="mt-3 block text-xs">Size
      <select value={variantId}
        onChange={e => setVariantId(Number(e.target.value))}
        className="mt-1 block min-h-11 w-full border border-black/30 bg-white px-3 text-sm">
        {product.variants.map(v =>
          <option key={v.id} value={v.id}>{v.size}</option>)}
      </select>
    </label>
    <a href={`/tarris?utm_source=instagram&utm_medium=social&utm_campaign=tb3_merch#merch-${product.id}`} className="mt-2 block text-xs underline" aria-label={`Direct shopping link for ${product.name}`}>Product link for sharing</a>
    <button type="button" onClick={() => add(variantId)}
      className="mt-3 min-h-11 w-full bg-[#A51C30] px-3 py-2 text-xs font-bold text-white">
      Add to Cart
    </button>
  </article>;
}

export function Tb3MerchStore() {
  const [cart, setCart] = useState<Line[]>([]);
  const [message, setMessage] = useState('');
  const [checkoutAvailable, setCheckoutAvailable] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [email, setEmail] = useState('');
  const [recipient, setRecipient] = useState({
    name: '', address1: '', address2: '', city: '',
    state_code: '', country_code: 'US' as const, zip: '',
  });
  useEffect(() => {
    fetch('/api/tb3/merch/checkout', {cache: 'no-store'})
      .then(res => res.ok ? res.json() : {available: false})
      .then(data => setCheckoutAvailable(data.available === true))
      .catch(() => setCheckoutAvailable(false));
  }, []);
  async function beginCheckout() {
    if (!count || processing) return;
    setProcessing(true);
    setMessage('Checking secure shipping and payment...');
    try {
      const attribution = new URL(window.location.href).searchParams.get('utm_source') === 'instagram'
        ? 'instagram' : 'direct';
      const response = await fetch('/api/tb3/merch/checkout', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({cart, email, recipient, attribution}),
      });
      const payload = await response.json();
      if (!response.ok || !payload.url ||
          new URL(payload.url).hostname !== 'checkout.stripe.com')
        throw new Error(payload.error || 'Checkout unavailable.');
      window.location.assign(payload.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Checkout unavailable.');
      setProcessing(false);
    }
  }
  const lines = cart.map(line => {
    const product = catalog.find(p => p.variants.some(v => v.id === line.variantId))!;
    const variant = product.variants.find(v => v.id === line.variantId)!;
    return { ...line, product, variant };
  });
  const count = cart.reduce((n, line) => n + line.quantity, 0);
  const subtotal = lines.reduce((n, line) =>
    n + Math.round(line.variant.price * 100) * line.quantity, 0);

  function add(variantId: number) {
    const existing = cart.find(line => line.variantId === variantId);
    if (count >= 20 || (existing?.quantity ?? 0) >= 10) {
      setMessage('Maximum 20 items per order and 10 of each size.');
      return;
    }
    setCart(existing
      ? cart.map(line => line.variantId === variantId
        ? { ...line, quantity: line.quantity + 1 } : line)
      : [...cart, { variantId, quantity: 1 }]);
    setMessage('Added to your cart.');
  }

  return <>
    <p role="status" className="mb-4 min-h-5 text-sm">{message}</p>
    <div id="merch-store" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {catalog.map(product =>
        <ProductCard key={product.id} product={product} add={add} />)}
    </div>
    <section aria-label="Shopping cart" className="mt-8 border-t border-black/20 pt-6">
      <h3 className="text-xl font-bold">Your cart ({count})</h3>
      {!count && <p className="mt-3 text-sm">Your cart is empty.</p>}
      <ul className="divide-y divide-black/10">
        {lines.map(line => <li key={line.variantId}
          className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
          <span>{line.product.name} · {line.variant.size} · Qty {line.quantity}</span>
          <button type="button" aria-label={`Remove ${line.product.name}, ${line.variant.size}`}
            onClick={() => {
              setCart(cart.filter(item => item.variantId !== line.variantId));
              setMessage('Item removed.');
            }} className="min-h-11 underline">Remove</button>
        </li>)}
      </ul>
      {count > 0 && <p className="mt-4 font-bold">
        Subtotal: ${(subtotal / 100).toFixed(2)} USD
      </p>}
      {count > 0 && (checkoutAvailable
        ? <form className="mt-5 grid max-w-lg gap-3" onSubmit={event => {
            event.preventDefault();
            void beginCheckout();
          }}>
            <p className="text-sm">Enter your U.S. delivery address for a live shipping quote and secure checkout. Final tax appears at checkout.</p>
            <label className="text-xs">Email
              <input required type="email" autoComplete="email" className="mt-1 block w-full border p-3"
                value={email} onChange={event => setEmail(event.target.value)} />
            </label>
            {([
              ['name','Full name','name'],
              ['address1','Street address','address-line1'],
              ['address2','Apartment / suite','address-line2'],
              ['city','City','address-level2'],
              ['state_code','State (two letters)','address-level1'],
              ['zip','ZIP code','postal-code'],
            ] as const).map(([field,title,completion]) =>
              <label key={field} className="text-xs">{title}
                <input required={field !== 'address2'} className="mt-1 block w-full border p-3"
                  autoComplete={completion} value={recipient[field]}
                  maxLength={field === 'state_code' ? 2 : 150}
                  onChange={event => setRecipient(current => ({
                    ...current, [field]: field === 'state_code'
                      ? event.target.value.toUpperCase() : event.target.value,
                  }))} />
              </label>)}
            <button disabled={processing} type="submit"
              className="min-h-11 bg-[#A51C30] p-3 font-bold text-white disabled:opacity-50">
              {processing ? 'Preparing checkout...' : 'Secure checkout'}
            </button>
          </form>
        : <p className="mt-5 text-sm" role="status">
            Online checkout is being connected. Products can be viewed, but orders are not yet being accepted.
          </p>)}
    </section>
  </>;
}

"use client";

import { useState } from 'react';
import catalog from '../../public/tb3/merch/manifest.json';

type Product = (typeof catalog)[number];
type Line = { variantId: number; quantity: number };

function ProductCard({ product, index, add }: {
  product: Product;
  index: number;
  add: (variantId: number) => void;
}) {
  const [variantId, setVariantId] = useState(product.variants[0].id);
  return <article className="min-w-0" data-product-id={product.printfulProductId}>
    <div id={`merch-${index + 1}`} className="aspect-square bg-white p-3">
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
    <button type="button" onClick={() => add(variantId)}
      className="mt-3 min-h-11 w-full bg-[#A51C30] px-3 py-2 text-xs font-bold text-white">
      Add to Cart
    </button>
  </article>;
}

export function Tb3MerchStore() {
  const [cart, setCart] = useState<Line[]>([]);
  const [message, setMessage] = useState('');
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
      {catalog.map((product, index) =>
        <ProductCard key={product.id} product={product} index={index} add={add} />)}
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
    </section>
  </>;
}

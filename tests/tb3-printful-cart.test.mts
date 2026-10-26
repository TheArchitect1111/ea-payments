import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveTb3Cart } from '../lib/tb3/merch-cart';

const catalog = JSON.parse(readFileSync(
  new URL('../public/tb3/merch/manifest.json', import.meta.url), 'utf8'
)) as {
  id: string; price: number; printfulProductId: number;
  variants: { id: number; size: string }[];
}[];

test('all 14 products resolve to their configured prices and variants', () => {
  assert.equal(catalog.length, 14);
  const ids = new Set<number>();
  for (const product of catalog) {
    for (const variant of product.variants) {
      assert.ok(!ids.has(variant.id), 'Duplicate variant ID');
      ids.add(variant.id);
      const [item] = resolveTb3Cart([{ variantId: variant.id, quantity: 2 }]);
      assert.equal(item.productId, product.printfulProductId);
      assert.equal(item.unitAmount, Math.round(product.price * 100));
      assert.equal(item.size, variant.size);
      assert.equal(item.quantity, 2);
    }
  }
});

test('all 14 catalog items have unique Printful identities and usable storefront assets', () => {
  assert.equal(new Set(catalog.map(x => x.id)).size, 14);
  assert.equal(new Set(catalog.map(x => x.printfulProductId)).size, 14);
  for (const item of catalog) {
    assert.ok(Number.isSafeInteger(item.printfulProductId) && item.printfulProductId > 0);
    assert.ok(item.variants.length > 0);
    const raw = JSON.parse(readFileSync(new URL('../public/tb3/merch/manifest.json', import.meta.url), 'utf8'));
    const product = raw.find((entry: {id:string}) => entry.id === item.id);
    assert.ok(product.image.startsWith('/tb3/merch/mockups/'));
    const imagePath = new URL('../public' + product.image, import.meta.url);
    assert.ok(readFileSync(imagePath).length > 1000, 'Missing or empty image: ' + item.id);
    assert.equal(product.currency, 'USD');
    assert.ok(product.price > 0);
    for (const variant of product.variants) {
      assert.ok(Number.isSafeInteger(variant.catalogVariantId) && variant.catalogVariantId > 0);
      assert.equal(variant.price, product.price, 'Catalog size price drift: ' + item.id);
    }
  }
});

test('duplicate sizes merge within order limits', () => {
  const variantId = catalog[0].variants[0].id;
  const lines = resolveTb3Cart([
    { variantId, quantity: 2 }, { variantId, quantity: 3 }
  ]);
  assert.equal(lines.length, 1);
  assert.equal(lines[0].quantity, 5);
});

test('rejects unknown variants, price injection and invalid quantities', () => {
  const variantId = catalog[0].variants[0].id;
  for (const value of [
    [],
    [{ variantId: 1, quantity: 1 }],
    [{ variantId, quantity: 0 }],
    [{ variantId, quantity: -1 }],
    [{ variantId, quantity: 1.5 }],
    [{ variantId, quantity: 11 }],
    [{ variantId, quantity: 1, price: 1 }],
    [{ variantId, quantity: 6 }, { variantId, quantity: 6 }],
    catalog.slice(0, 3).map(p => ({
      variantId: p.variants[0].id, quantity: 10
    }))
  ]) assert.throws(() => resolveTb3Cart(value));
});


test('TB3 checkout fails closed without Printful fulfillment credentials', () => {
  const checkout = readFileSync(new URL('../app/api/tb3/merch/checkout/route.ts', import.meta.url), 'utf8');
  const webhook = readFileSync(new URL('../app/api/webhooks/stripe-tb3-merch/route.ts', import.meta.url), 'utf8');
  assert.match(checkout, /const enabled = \(\) =>[\s\S]*?!!process\.env\.PRINTFUL_API_KEY\?\.trim\(\)/);
  assert.match(webhook, /export async function POST[\s\S]*?!process\.env\.PRINTFUL_API_KEY\?\.trim\(\)/);
});

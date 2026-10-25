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

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const checkoutRoutes = [
  'app/api/public/amanda/enrollment/checkout/route.ts',
  'app/api/portal/amanda/checkout/route.ts',
];

for (const route of checkoutRoutes) {
  const source = await readFile(new URL(`../${route}`, import.meta.url), 'utf8');
  assert.equal(
    source.includes('automatic_tax: { enabled: true }'),
    false,
    `${route} must not require Stripe Automatic Tax before the account tax address is configured`,
  );
}

console.log('Amanda checkout configuration tests passed.');

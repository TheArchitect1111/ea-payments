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

const publicCheckout = await readFile(
  new URL('../app/api/public/amanda/enrollment/checkout/route.ts', import.meta.url),
  'utf8',
);
assert.equal(
  publicCheckout.includes("paymentOption: testMode ? 'test' : 'full'"),
  true,
  'Amanda public enrollment must propagate paymentOption=test for the CAD $1 process checkout',
);
assert.equal(
  publicCheckout.includes('unit_amount: testMode ? 100 : Math.round(offer.priceCad * 100)'),
  true,
  'Amanda process-test checkout must charge exactly CAD $1.00 while preserving full-price logic',
);
assert.equal(
  publicCheckout.includes("portalSlug: 'amanda-catherine'"),
  true,
  'Amanda public enrollment must retain the Amanda portal identity for fulfillment',
);
assert.equal(
  publicCheckout.includes("enrollmentFlow: 'public-course-v1'"),
  true,
  'Amanda public enrollment must retain its verification flow identity',
);

const enrollmentForm = await readFile(
  new URL('../app/portal/amanda-catherine/enroll/AmandaEnrollmentForm.tsx', import.meta.url),
  'utf8',
);
assert.equal(
  enrollmentForm.includes("Regular ${course.compareAtPriceCad.toLocaleString('en-CA')}"),
  true,
  'Amanda enrollment must distinguish the regular price from a current sale price',
);
assert.equal(
  enrollmentForm.includes("{course.compareAtPriceCad ? 'Current' : 'Retail'}"),
  true,
  'Amanda $1 test screen must not mislabel a sale price as the regular retail price',
);

console.log('Amanda checkout configuration tests passed.');

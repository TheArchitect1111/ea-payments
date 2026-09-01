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
  publicCheckout.includes("paymentOption: 'full-or-promotion'"),
  true,
  'Amanda public enrollment must identify the approved full-price or promotion-code checkout flow',
);
assert.equal(
  publicCheckout.includes('allow_promotion_codes: true'),
  true,
  'Amanda public enrollment must allow approved Stripe promotion codes',
);
assert.equal(
  publicCheckout.includes('unit_amount: Math.round(offer.priceCad * 100)'),
  true,
  'Amanda public enrollment must charge the configured course price before any approved promotion code',
);
assert.equal(
  publicCheckout.includes('testMode'),
  false,
  'Amanda public enrollment must not expose the retired CAD $1 process-test mode',
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
assert.equal(
  publicCheckout.includes('regularPriceCad: String(regularPriceCad)') &&
    publicCheckout.includes('currentPriceCad: String(offer.priceCad)'),
  true,
  'Amanda Stripe metadata must distinguish regular pricing from the current course price',
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
  enrollmentForm.includes("course.compareAtPriceCad ? 'Sale ' : ''"),
  true,
  'Amanda enrollment must clearly label a discounted configured price as a sale price',
);

const amandaConfig = await readFile(
  new URL('../lib/amanda-catherine/config.ts', import.meta.url),
  'utf8',
);
const bodySculptBlock = amandaConfig.match(
  /id: 'body-sculpt-practitioner-certification'[\s\S]*?\n  },/,
)?.[0] || '';
assert.equal(
  bodySculptBlock.includes("delivery: ['in-person', 'virtual']"),
  true,
  'Body Sculpt Practitioner Certification must retain both official delivery pathways: in-person and virtual',
);
assert.equal(
  bodySculptBlock.includes('priceCad: 2497') && bodySculptBlock.includes('compareAtPriceCad: 4997'),
  true,
  'Body Sculpt must retain the current CAD $2,497 price and CAD $4,997 regular price relationship',
);

console.log('Amanda checkout configuration tests passed.');

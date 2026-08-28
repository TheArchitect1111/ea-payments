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
assert.equal(
  publicCheckout.includes('regularPriceCad: String(regularPriceCad)') &&
    publicCheckout.includes('currentPriceCad: String(offer.priceCad)'),
  true,
  'Amanda Stripe metadata must distinguish regular pricing from the current course price',
);
assert.equal(
  publicCheckout.includes("Regular CAD $") && publicCheckout.includes("Current CAD $"),
  true,
  'Amanda Stripe test description must distinguish regular and current sale pricing',
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

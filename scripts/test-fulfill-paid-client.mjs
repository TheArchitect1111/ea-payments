#!/usr/bin/env node
/**
 * Contract: shared fulfillPaidClient used by /buy starter and proposal payment.
 * Run: node scripts/test-fulfill-paid-client.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function read(rel) {
  const path = join(root, rel);
  assert(existsSync(path), `missing ${rel}`);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

const fulfill = read('lib/fulfill-paid-client.ts');
assert(fulfill.includes('export async function fulfillPaidClient'), 'fulfillPaidClient export required');
assert(fulfill.includes('createPortalAccess'), 'must create portal access');
assert(fulfill.includes('ensurePackageEntitlements'), 'must ensure entitlements');
assert(fulfill.includes('provisionConnectAfterCheckout'), 'must provision Connect');
assert(fulfill.includes('provisionWebsitePortalSite'), 'must support website provision');
assert(fulfill.includes('DEFAULT_PORTAL_CONFIG'), 'default portal config required');

const webhook = read('app/api/webhooks/stripe/route.ts');
assert(webhook.includes('fulfillPaidClient'), 'Stripe webhook must call fulfillPaidClient');
assert(webhook.includes('handleProposalPayment'), 'proposal payment handler required');
assert(
  /handleProposalPayment[\s\S]*fulfillPaidClient/.test(webhook),
  'proposal payment must use fulfillPaidClient',
);
assert(
  webhook.includes("commerceOfferId: 'website_portal_starter'") ||
    webhook.includes('commerceOfferId: "website_portal_starter"'),
  'proposal pay must map to website_portal_starter entitlements',
);
assert(webhook.includes('provisionWebsite: true') || webhook.includes('provisionWebsite: isWebsitePortalAuto'), 'website provision flag required');

const starter = read('scripts/test-website-portal-starter.mjs');
assert(starter.includes('website-portal-auto') || starter.includes('website_portal_starter'), 'starter contract still present');

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS fulfill-paid-client-contract');

#!/usr/bin/env node
/**
 * Website + Portal golden path cert — offer → fulfill → CX pack → Launch Edition modules.
 * Run: node scripts/test-website-portal-golden-path-cert.mjs
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

const presets = read('vendor/payments-contract/src/presets.ts');
const offers = read('vendor/payments-contract/src/offers.ts');
const fulfill = read('lib/fulfill-paid-client.ts');
const provision = read('lib/provision-website-portal.ts');
const ctpPack = read('lib/portal-universal/packs/ctp-client.ts');
const resolvePack = read('lib/portal-universal/resolve-pack-for-org.ts');
const portalModules = read('lib/modules/portal-modules.ts');

assert(offers.includes("id: 'website_portal_starter'"), 'website_portal_starter offer required');
assert(offers.includes('WEBSITE_PORTAL_MODULES'), 'offer must use WEBSITE_PORTAL_MODULES');
assert(presets.includes('WEBSITE_PORTAL_MODULES'), 'WEBSITE_PORTAL_MODULES preset required');
assert(presets.includes('ensureLaunchEditionModules'), 'ensureLaunchEditionModules required');
assert(presets.includes("'events'"), 'Launch Edition must include events');
assert(presets.includes("'billing'"), 'Launch Edition must include billing');
assert(presets.includes("'settings'"), 'Launch Edition must include settings');

assert(fulfill.includes('export async function fulfillPaidClient'), 'fulfillPaidClient required');
assert(fulfill.includes('provisionWebsitePortalSite'), 'website provision path required');
assert(fulfill.includes('ensurePackageEntitlements'), 'entitlements path required');
assert(provision.includes('provisionWebsitePortalSite'), 'provisionWebsitePortalSite export required');

assert(ctpPack.includes('useClientExperienceChrome: true'), 'CTP CX pack must use client chrome');
assert(ctpPack.includes("'pulse'"), 'CTP pack must hide pulse');
assert(ctpPack.includes("'simplifi'"), 'CTP pack must hide simplifi');
assert(ctpPack.includes("'amplifi'"), 'CTP pack must hide amplifi');
assert(ctpPack.includes("'connect'"), 'CTP pack must hide connect');

assert(resolvePack.includes('preferClientExperience'), 'resolvePackForOrg must support preferClientExperience');
assert(resolvePack.includes("'ctp-client'"), 'resolvePackForOrg must resolve ctp-client pack');

assert(
  portalModules.includes('commerceOfferId') || portalModules.includes('resolveEntitlementPackageKey'),
  'portal-modules must resolve offer entitlements',
);

const sitesPage = read('app/sites/[slug]/page.tsx');
assert(sitesPage.includes('slug'), 'public /sites/{slug} page required');

const starterCert = read('scripts/test-website-portal-starter.mjs');
assert(starterCert.includes('website_portal_starter'), 'starter cert script present');

if (failures.length) {
  console.error('FAIL website-portal-golden-path-cert');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS website-portal-golden-path-cert');

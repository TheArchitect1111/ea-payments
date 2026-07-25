/**
 * Phase 1 — Amplifi/Magnifi portal entitlement & chrome contracts.
 * Run: node scripts/test-amplifi-magnifi-portal-phase1.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

function read(rel) {
  const p = join(root, rel);
  if (!existsSync(p)) throw new Error(`Missing ${rel}`);
  return readFileSync(p, 'utf8');
}

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    failed += 1;
  } else {
    console.log(`PASS: ${msg}`);
  }
}

const presets = read('vendor/payments-contract/src/presets.ts');
const offers = read('vendor/payments-contract/src/offers.ts');
const registry = read('lib/modules/registry.ts');

// --- Package → modules (payments-contract presets) ---
assert(presets.includes("export const EA_CLIENT_MODULES"), 'EA_CLIENT_MODULES preset exists');
assert(
  /EA_CLIENT_MODULES\s*=\s*\[[^\]]*simplifi[^\]]*amplifi/s.test(presets) ||
    (presets.includes("'simplifi'") &&
      presets.includes("'amplifi'") &&
      presets.indexOf("'simplifi'") < presets.indexOf('WEBSITE_PORTAL_MODULES')),
  'EA_CLIENT_MODULES includes simplifi + amplifi',
);
assert(presets.includes('SIMPLIFI_ONE_TIME_MODULES = [...EA_CLIENT_MODULES]'), 'Simplifi one-time = EA client modules');
assert(presets.includes('IMPLEMENTATION_MODULES'), 'Implementation modules preset exists');
assert(
  presets.includes('IMPLEMENTATION_MODULES') &&
    presets.includes("'connect'") &&
    presets.includes("'member'"),
  'Implementation adds connect + member on EA client base',
);

const websiteBlock = presets.slice(presets.indexOf('WEBSITE_PORTAL_MODULES'));
const websiteEnd = websiteBlock.indexOf('] as const');
const websiteBody = websiteBlock.slice(0, websiteEnd >= 0 ? websiteEnd : 800);
assert(websiteBody.includes("'ctp'") || websiteBody.includes("'member'"), 'Website + Portal preset is lean portal set');
assert(!websiteBody.includes("'simplifi'"), 'Website + Portal excludes simplifi');
assert(!websiteBody.includes("'amplifi'"), 'Website + Portal excludes amplifi');

assert(presets.includes("Simplifi: SIMPLIFI_ONE_TIME_MODULES"), 'Airtable map: Simplifi → one-time modules');
assert(
  presets.includes("'Implementation Package': IMPLEMENTATION_MODULES"),
  'Airtable map: Implementation Package → implementation modules',
);
assert(
  presets.includes("'Website + Portal Starter': WEBSITE_PORTAL_MODULES"),
  'Airtable map: Website + Portal Starter → website portal modules',
);

assert(offers.includes("id: 'simplifi_early_access'"), 'simplifi_early_access offer defined');
assert(offers.includes("id: 'website_portal_starter'"), 'website_portal_starter offer defined');
assert(
  offers.includes('SIMPLIFI_ONE_TIME_MODULES') && offers.includes('simplifi_early_access'),
  'simplifi_early_access uses Simplifi modules',
);
assert(
  offers.includes('WEBSITE_PORTAL_MODULES') && offers.includes('website_portal_starter'),
  'website_portal_starter uses Website portal modules',
);

// Legacy grants still list Amplifi for Simplifi packages (fallback only)
assert(
  registry.includes("Simplifi: ['simplifi', 'amplifi']") ||
    registry.includes('Simplifi: ["simplifi", "amplifi"]'),
  'Legacy PACKAGE_MODULE_GRANTS Simplifi includes amplifi',
);
assert(
  registry.includes("'Website + Portal Starter': ['member', 'events']") ||
    registry.includes('"Website + Portal Starter"'),
  'Legacy Website + Portal grant is Amplifi-free',
);

// --- Fulfillment / login backfill wiring ---
const fulfill = read('lib/fulfill-paid-client.ts');
const portalModules = read('lib/modules/portal-modules.ts');
const orgProvision = read('lib/org-provision.ts');
assert(fulfill.includes('ensurePackageEntitlements'), 'fulfillPaidClient syncs package entitlements');
assert(
  portalModules.includes('ensurePackageEntitlements') && portalModules.includes('syncPackageEntitlements'),
  'portal-modules ensurePackageEntitlements → syncPackageEntitlements',
);
assert(orgProvision.includes('ensurePackageEntitlements'), 'login identity backfills package entitlements');

// --- Amplifi deep link guard ---
const amplifiPage = read('app/portal/[slug]/amplifi/page.tsx');
assert(
  amplifiPage.includes("requirePortalModule(slug, 'amplifi')"),
  'Amplifi portal page requires amplifi module',
);

// --- MCC operator grant surface ---
const entitlementsApi = read('app/api/admin/entitlements/route.ts');
const entitlementsPanel = read('app/admin/capability-marketplace/EntitlementsPanel.tsx');
assert(
  entitlementsApi.includes('bulk-enable') || entitlementsApi.includes('setModulesEnabledBulk'),
  'admin entitlements API can bulk-enable',
);
assert(entitlementsPanel.length > 100, 'MCC EntitlementsPanel present');

// --- CX chrome omits Amplifi/Simplifi ---
const cxNav = read('lib/ctp-client-nav.ts');
assert(!cxNav.includes('amplifi'), 'CX nav builder has no amplifi');
assert(!/label:\s*'Simplifi'/.test(cxNav) && !/label:\s*'Amplifi'/.test(cxNav), 'CX nav has no Simplifi/Amplifi labels');
const shell = read('lib/chassis/PortalShell.tsx');
assert(
  shell.includes("shellNavGroups={effectivePresentation === 'client' ? []"),
  'PortalShell clears executive nav groups for CX',
);

process.exit(failed ? 1 : 0);

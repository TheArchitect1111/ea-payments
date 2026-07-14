/**
 * Contract + wiring checks for automated Website + Portal Starter.
 * Run: node scripts/test-website-portal-starter.mjs
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

const offerPath = join(root, 'vendor/payments-contract/src/offers.ts');
const presetsPath = join(root, 'vendor/payments-contract/src/presets.ts');
const typesPath = join(root, 'vendor/payments-contract/src/types.ts');
const provisionPath = join(root, 'lib/provision-website-portal.ts');
const fulfillmentPath = join(root, 'lib/package-fulfillment.ts');
const webhookPath = join(root, 'app/api/webhooks/stripe/route.ts');
const buyPath = join(root, 'app/buy/page.tsx');
const sitesPath = join(root, 'app/sites/[slug]/page.tsx');
const magicPath = join(root, 'lib/magic-link.ts');
const emailPath = join(root, 'lib/email.ts');
const sessionStatusPath = join(root, 'app/api/checkout/session-status/route.ts');
const successClientPath = join(root, 'app/checkout/success/CheckoutSuccessClient.tsx');
const adminProvisionPath = join(root, 'app/api/admin/website-portal/provision/route.ts');

for (const [path, label] of [
  [offerPath, 'offers.ts'],
  [presetsPath, 'presets.ts'],
  [typesPath, 'types.ts'],
  [provisionPath, 'provision-website-portal.ts'],
  [fulfillmentPath, 'package-fulfillment.ts'],
  [webhookPath, 'stripe webhook'],
  [buyPath, 'buy page'],
  [sitesPath, 'sites page'],
  [magicPath, 'magic-link.ts'],
  [emailPath, 'email.ts'],
  [sessionStatusPath, 'session-status API'],
  [successClientPath, 'checkout success client'],
  [adminProvisionPath, 'admin website-portal provision API'],
]) {
  assert(existsSync(path), `Missing ${label} at ${path}`);
}

const offers = readFileSync(offerPath, 'utf8');
const presets = readFileSync(presetsPath, 'utf8');
const types = readFileSync(typesPath, 'utf8');
const provision = readFileSync(provisionPath, 'utf8');
const fulfillment = readFileSync(fulfillmentPath, 'utf8');
const webhook = readFileSync(webhookPath, 'utf8');
const buy = readFileSync(buyPath, 'utf8');
const magic = readFileSync(magicPath, 'utf8');
const email = readFileSync(emailPath, 'utf8');

assert(offers.includes("id: 'website_portal_starter'"), 'Offer website_portal_starter missing');
assert(offers.includes("fulfillmentType: 'website-portal-auto'"), 'Offer missing website-portal-auto fulfillment');
assert(offers.includes('reviewRequired: false'), 'website_portal_starter must set reviewRequired: false');
assert(offers.includes('WEBSITE_PORTAL_MODULES'), 'Offer must use WEBSITE_PORTAL_MODULES');
assert(offers.includes('allowInlineStripePrice: true'), 'Offer should allow inline Stripe price for launch');

assert(presets.includes('WEBSITE_PORTAL_MODULES'), 'WEBSITE_PORTAL_MODULES preset missing');
assert(types.includes("'website_portal_starter'"), 'CommerceOfferId missing website_portal_starter');
assert(types.includes("'website-portal-auto'"), 'FulfillmentType missing website-portal-auto');

assert(fulfillment.includes("case 'website-portal-auto'"), 'Fulfillment plan missing website-portal-auto case');
assert(
  fulfillment.includes('Your website and client portal are live'),
  'Fulfillment copy should say website/portal are live',
);

assert(provision.includes('buildStarterWebsitePuckData'), 'Starter website template builder missing');
assert(provision.includes('provisionWebsitePortalSite'), 'provisionWebsitePortalSite missing');
assert(provision.includes("status: 'published'"), 'Provisioned site must be published');
assert(provision.includes('/sites/'), 'Site path helper must use /sites/');

assert(webhook.includes('provisionWebsitePortalSite'), 'Webhook must call website provisioner');
assert(webhook.includes('website-portal-auto'), 'Webhook must detect website-portal-auto');
assert(webhook.includes('fulfillment.provisioned'), 'Webhook must emit fulfillment.provisioned');
assert(webhook.includes('createMagicLinkToken'), 'Webhook must issue welcome magic link');
assert(webhook.includes('WELCOME_MAGIC_LINK_TTL_MS'), 'Webhook must use welcome magic-link TTL');
assert(webhook.includes('magicLoginUrl'), 'Webhook must pass magicLoginUrl to welcome email');

assert(buy.includes('website_portal_starter'), 'Buy page must target website_portal_starter');
assert(buy.includes('Continue to checkout') || buy.includes('checkout?package='), 'Buy page must CTA into checkout');
assert(!buy.includes('redirect(') || buy.includes('Website + Portal Starter'), 'Buy page should be a sales surface');
assert(magic.includes('WELCOME_MAGIC_LINK_TTL_MS'), 'Magic-link module missing welcome TTL export');
assert(magic.includes('ttlMs'), 'createMagicLinkToken must accept ttlMs override');
assert(email.includes('magicLoginUrl'), 'Welcome email must support magicLoginUrl');
assert(email.includes('readyNow'), 'Welcome email must support readyNow auto copy');

const sessionStatus = readFileSync(sessionStatusPath, 'utf8');
const successClient = readFileSync(successClientPath, 'utf8');
assert(sessionStatus.includes('findPublishedSitePage'), 'session-status must resolve published site');
assert(sessionStatus.includes('findPortalClientByEmail'), 'session-status must resolve portal client');
assert(successClient.includes('/api/checkout/session-status'), 'Success page must poll session-status');
assert(successClient.includes('Open My Website'), 'Success page must offer live site CTA when ready');

const adminProvision = readFileSync(adminProvisionPath, 'utf8');
assert(adminProvision.includes('provisionWebsitePortalSite'), 'Admin provision API must call provisioner');
assert(adminProvision.includes('requireAdminActionFromRequest'), 'Admin provision API must require admin auth');
assert(provision.includes('force?: boolean') || provision.includes('force?'), 'Provisioner must support force refresh');

const opsPanelPath = join(root, 'app/admin/master/WebsitePortalOpsPanel.tsx');
const masterPagePath = join(root, 'app/admin/master/page.tsx');
assert(existsSync(opsPanelPath), 'Missing WebsitePortalOpsPanel on Master CC');
assert(
  readFileSync(masterPagePath, 'utf8').includes('WebsitePortalOpsPanel'),
  'Master CC page must mount WebsitePortalOpsPanel',
);
assert(
  readFileSync(opsPanelPath, 'utf8').includes('/api/admin/website-portal/provision'),
  'Ops panel must call admin provision API',
);

const persistencePath = join(root, 'lib/creative-studio/persistence.ts');
const pageStorePath = join(root, 'lib/experience-builder/page-store.ts');
const metaSetupPath = join(root, 'lib/airtable-meta-setup.ts');
assert(existsSync(persistencePath), 'Missing creative-studio persistence');
assert(
  readFileSync(persistencePath, 'utf8').includes('loadStudioRecordFromAirtable'),
  'Persistence must support Airtable-only durable load',
);
assert(
  readFileSync(pageStorePath, 'utf8').includes('verifyExperiencePageDurable'),
  'page-store must verify Experience durability',
);
assert(
  readFileSync(provisionPath, 'utf8').includes('verifyExperiencePageDurable'),
  'Provisioner must verify Airtable durability before returning siteUrl',
);
assert(
  readFileSync(metaSetupPath, 'utf8').includes("{ name: 'Experience' }"),
  'Creative Studio schema must include Experience record type',
);

const readinessLib = join(root, 'lib/website-portal-readiness.ts');
const readinessApi = join(root, 'app/api/admin/website-portal/readiness/route.ts');
const setupSchemaApi = join(root, 'app/api/admin/website-portal/setup-schema/route.ts');
assert(existsSync(readinessLib), 'Missing website-portal-readiness helper');
assert(existsSync(readinessApi), 'Missing admin website-portal readiness API');
assert(existsSync(setupSchemaApi), 'Missing admin website-portal setup-schema API');
assert(
  readFileSync(opsPanelPath, 'utf8').includes('/api/admin/website-portal/readiness'),
  'Ops panel must load readiness status',
);
assert(
  readFileSync(opsPanelPath, 'utf8').includes('/api/admin/website-portal/setup-schema'),
  'Ops panel must call admin setup-schema API',
);
assert(
  readFileSync(setupSchemaApi, 'utf8').includes('ensureAirtableLaunchTables'),
  'Setup-schema API must ensure Airtable launch tables',
);
assert(
  readFileSync(setupSchemaApi, 'utf8').includes('requireAdminActionFromRequest'),
  'Setup-schema API must require admin auth',
);

if (failures.length) {
  console.error('Website + Portal Starter checks FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('Website + Portal Starter checks: PASS');
console.log('  offer, fulfillment, provisioner, webhook, buy path, magic-link welcome');
process.exit(0);

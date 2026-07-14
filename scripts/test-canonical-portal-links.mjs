/**
 * Guardrail: client-facing portal login CTAs must not default to vercel.app or apex-only hosts.
 * Run: node scripts/test-canonical-portal-links.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolvePath(here, '..');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

const portalAccess = read('lib/portal-access.ts');
assert(portalAccess.includes('publicPortalLoginUrl'), 'portal-access must use publicPortalLoginUrl');
assert(!portalAccess.includes("?? 'https://ea-payments.vercel.app'"), 'portal-access must not default to vercel.app');

const stripe = read('app/api/webhooks/stripe/route.ts');
assert(stripe.includes('publicPortalLoginUrl'), 'stripe welcome must use publicPortalLoginUrl');
assert(
  !stripe.includes("?? 'https://ea-payments.vercel.app'}/portal/login"),
  'stripe must not build portal login from vercel.app fallback',
);

const marketing = read('lib/marketing-urls.ts');
assert(marketing.includes('EA_PLATFORM_URL'), 'marketing URLs must use EA_PLATFORM_URL');
assert(marketing.includes("signIn: `${BASE}/portal/login`"), 'PUBLIC_LINKS.signIn must be /portal/login');
assert(
  marketing.includes('/portal/login?next=/portal/demo-client/pulse'),
  'Pulse custom domain must deep-link portal pulse',
);

const tier2 = read('lib/launch-tier2.ts');
assert(tier2.includes('publicPortalLoginUrl()'), 'tier2 sample payload must use publicPortalLoginUrl');

const sessionStatus = read('app/api/checkout/session-status/route.ts');
assert(sessionStatus.includes('publicPortalLoginUrl'), 'session-status must use publicPortalLoginUrl');

const provision = read('lib/provision-website-portal.ts');
assert(provision.includes('publicPortalLoginUrl()'), 'website provision CTA must use publicPortalLoginUrl');

if (failures.length) {
  console.error('Canonical portal link checks FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('Canonical portal link checks: PASS');
process.exit(0);

#!/usr/bin/env node
/**
 * Contract: Legal Document Pack — Trust Engine registry + public routes + sources.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exit(1);
  }
}

const pack = readFileSync(join(root, 'lib/trust-engine/legal-pack.ts'), 'utf8');
const types = readFileSync(join(root, 'lib/trust-engine/types.ts'), 'utf8');
const acceptanceUi = readFileSync(join(root, 'app/components/LegalAcceptance.tsx'), 'utf8');
const play = readFileSync(join(root, 'lib/trust-engine/google-play-data-safety.ts'), 'utf8');
const docs = readFileSync(join(root, 'docs/TRUST-ENGINE-LEGAL-PACK.md'), 'utf8');

const sources = [
  'docs/legal/privacy-v1.0.md',
  'docs/legal/terms-v1.0.md',
  'docs/legal/eula-v1.0.md',
  'docs/legal/ai-disclosure-v1.0.md',
  'docs/legal/support-policy-v1.0.md',
  'docs/legal/cookie-policy-v1.0.md',
  'docs/legal/msa-v1.0.md',
  'docs/legal/sow-template-v1.0.md',
];

for (const rel of sources) {
  assert(existsSync(join(root, rel)), `missing source ${rel}`);
}

const routes = [
  'app/legal/privacy/page.tsx',
  'app/legal/terms/page.tsx',
  'app/legal/eula/page.tsx',
  'app/legal/ai-disclosure/page.tsx',
  'app/legal/support/page.tsx',
  'app/legal/cookies/page.tsx',
  'app/legal/msa/page.tsx',
  'app/legal/sow/page.tsx',
];

for (const rel of routes) {
  assert(existsSync(join(root, rel)), `missing route ${rel}`);
}

assert(pack.includes('LEGAL_DOCUMENT_PACK'), 'LEGAL_DOCUMENT_PACK registry');
assert(pack.includes('PRODUCT_LEGAL_PACKS'), 'PRODUCT_LEGAL_PACKS mapping');
assert(pack.includes("productId: 'simplifi'"), 'Simplifi pack');
assert(pack.includes("productId: 'amplifi'"), 'Amplifi pack');
assert(pack.includes("productId: 'magnifi'"), 'Magnifi pack');
assert(pack.includes("productId: 'pulse'"), 'Pulse pack');
assert(pack.includes("productId: 'executive_portals'"), 'Executive Portals pack');
assert(pack.includes('SIMPLIFI_PRIVACY_POLICY_URL'), 'Play privacy URL export');
assert(pack.includes('resolveOnboardingAcceptanceDocs'), 'onboarding resolver excludes eSign');
assert(types.includes("'privacy'"), 'privacy doc type');
assert(types.includes("'msa'"), 'msa doc type');
assert(types.includes('LegalAcceptanceRecord'), 'acceptance record type');
assert(acceptanceUi.includes('resolveOnboardingAcceptanceDocs'), 'LegalAcceptance uses onboarding docs');
assert(acceptanceUi.includes('Continue'), 'Continue CTA');
assert(play.includes('SIMPLIFI_GOOGLE_PLAY_DATA_SAFETY'), 'Play Data Safety object');
assert(play.includes('privacyPolicyUrl'), 'Play privacyPolicyUrl');
assert(docs.includes('Product → required documents'), 'ops doc present');
assert(existsSync(join(root, 'app/privacy/page.tsx')), 'legacy /privacy redirect');
assert(existsSync(join(root, 'app/terms/page.tsx')), 'legacy /terms redirect');

const privacyRedirect = readFileSync(join(root, 'app/privacy/page.tsx'), 'utf8');
assert(privacyRedirect.includes('/legal/privacy'), 'privacy redirects to Legal Pack');

console.log('PASS: Legal Document Pack contracts');

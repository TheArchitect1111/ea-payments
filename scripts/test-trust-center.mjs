#!/usr/bin/env node
/**
 * Contract: Trust Center + Legal Governance (builds on Legal Pack).
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

const files = [
  'lib/trust-engine/status.ts',
  'lib/trust-engine/governance.ts',
  'lib/trust-engine/audit.ts',
  'lib/trust-engine/client-store.ts',
  'lib/trust-engine/version-overlay.ts',
  'lib/trust-engine/journey.ts',
  'lib/trust-engine/notifications.ts',
  'lib/trust-engine/api.ts',
  'app/components/trust/LegalStatusDashboard.tsx',
  'app/components/trust/LegalReacceptanceGate.tsx',
  'app/components/trust/LegalAuditTimeline.tsx',
  'app/components/trust/LegalJourneyStrip.tsx',
  'app/trust/page.tsx',
  'app/admin/legal/page.tsx',
  'app/api/trust/client-status/route.ts',
  'app/api/trust/accept/route.ts',
  'app/api/admin/legal/dashboard/route.ts',
  'app/api/admin/legal/publish-version/route.ts',
  'docs/TRUST-CENTER.md',
  'docs/legal/privacy-v1.0.md',
];

for (const rel of files) {
  assert(existsSync(join(root, rel)), `missing ${rel}`);
}

const api = readFileSync(join(root, 'lib/trust-engine/api.ts'), 'utf8');
assert(api.includes('getClientLegalStatus'), 'getClientLegalStatus');
assert(api.includes('getLegalExecutiveDashboard'), 'executive dashboard');
assert(api.includes('publishLegalVersionApi') || api.includes('publishLegalVersion'), 'publish');

const gov = readFileSync(join(root, 'lib/trust-engine/governance.ts'), 'utf8');
assert(gov.includes('markClientsReacceptanceRequired'), 'reacceptance marking');
assert(gov.includes('appendClientAcceptances') || gov.includes('recordClientLegalAcceptance'), 'append acceptance');

const audit = readFileSync(join(root, 'lib/trust-engine/audit.ts'), 'utf8');
assert(audit.includes('recordLegalAuditEvent'), 'audit record');
assert(audit.includes('getLegalAuditHistory'), 'audit history');

const pulse = readFileSync(join(root, 'lib/pulse-bus.ts'), 'utf8');
assert(pulse.includes('trust.legal.version_published'), 'pulse trust events');
assert(pulse.includes('trust.msa.signed'), 'pulse msa signed');

const pack = readFileSync(join(root, 'lib/trust-engine/legal-pack.ts'), 'utf8');
assert(pack.includes('LEGAL_DOCUMENT_PACK'), 'legal pack preserved');
assert(pack.includes('PRODUCT_LEGAL_PACKS'), 'product packs preserved');

const trustPage = readFileSync(join(root, 'app/trust/page.tsx'), 'utf8');
assert(trustPage.includes('Trust Center'), 'trust center page');
assert(trustPage.includes('AI Principles'), 'AI section');
assert(trustPage.includes('/legal/'), 'links to legal pack');

const docsPage = readFileSync(join(root, 'app/portal/[slug]/documents/page.tsx'), 'utf8');
assert(docsPage.includes('LegalStatusDashboard'), 'portal legal status');
assert(docsPage.includes('LegalJourneyStrip'), 'journey strip');

console.log('PASS: Trust Center + Legal Governance contracts');

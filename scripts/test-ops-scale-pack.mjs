/**
 * Ops scale pack (S5) — eSign callback, CTP commercial desk, scale flags, SOP.
 * Run: node scripts/test-ops-scale-pack.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

assert(existsSync(join(root, 'lib/esignatures-config.ts')), 'esignatures-config missing');
assert(existsSync(join(root, 'lib/ctp-commercial-desk.ts')), 'ctp-commercial-desk missing');
assert(existsSync(join(root, 'docs/CTP-CLOSE-SOP.md')), 'CTP close SOP missing');

const esign = read('lib/esignatures-config.ts');
assert(esign.includes('canonicalPlatformOrigin'), 'callback must use canonical apex origin');
assert(esign.includes('esignaturesCallbackUrl'), 'callback URL helper required');
assert(!esign.includes('www.efficiencyarchitects.online'), 'esign config must not use www host');

const tier2 = read('lib/launch-tier2.ts');
assert(tier2.includes('esignaturesCallbackUrl'), 'tier2 callback must come from esignatures-config');

const cmd = read('lib/launch-command-center.ts');
assert(cmd.includes('esignaturesCallbackUrl'), 'command center must probe apex callback helper');

const webhook = read('app/api/webhooks/esignatures/route.ts');
assert(webhook.includes('getEsignaturesTemplateConfig'), 'webhook GET/POST must expose template config');
assert(webhook.includes('not www'), 'webhook health must warn against www');

const docs = read('docs/ESIGNATURES-SETUP.md');
assert(
  docs.includes('https://efficiencyarchitects.online/api/webhooks/esignatures'),
  'ESIGNATURES-SETUP must document apex callback',
);
assert(!docs.includes('https://www.efficiencyarchitects.online/api/webhooks/esignatures'), 'docs must not recommend www callback');

const make = read('lib/make-webhooks.ts');
assert(make.includes('esignaturesMakeTemplateFields'), 'onboarding payload must include template IDs');

const commercial = read('lib/ctp-commercial-desk.ts');
assert(commercial.includes('sendCtpProposalFromDesk'), 'CTP desk send proposal helper');
assert(commercial.includes('enrichCtpAdminViewWithCommercial'), 'commercial enrich helper');
assert(commercial.includes('resolveCtpCommercialStatus'), 'commercial status join');

const actions = read('lib/ctp-executive-actions.ts');
assert(actions.includes("'send_proposal'"), 'executive actions include send_proposal');

const panel = read('app/admin/ctp/CtpExecutiveActionsPanel.tsx');
assert(panel.includes('send_proposal'), 'UI must expose send proposal');
assert(panel.includes('CTP-CLOSE-SOP'), 'UI must point at close SOP');

const client = read('app/admin/ctp/CtpSubmissionsClient.tsx');
assert(client.includes('commercialLabel'), 'list UI shows commercial badge');
assert(client.includes('submission.paid'), 'list UI shows paid state');

const health = read('lib/launch-health.ts');
assert(health.includes('LAUNCH_OPERATIONAL_MATURITY'), 'health must read operational maturity flag');
assert(health.includes('LAUNCH_FOUNDER_DEPENDENCY_REDUCED'), 'health must read founder-dependency flag');
assert(health.includes('scaleAttestation'), 'health must surface scale attestation');
assert(existsSync(join(root, 'app/api/health/launch/route.ts')), 'launch health route missing');
const route = read('app/api/health/launch/route.ts');
assert(route.includes('requireAdminSessionFromRequest'), 'launch health route must gate diagnostics');
assert(route.includes('buildLaunchHealthDiagnostic'), 'launch health route must use shared builder');

const envEx = read('.env.example');
assert(envEx.includes('LAUNCH_OPERATIONAL_MATURITY'), '.env.example scale flags');
assert(envEx.includes('PRAISON_PACKAGE_WEBHOOK_URL'), '.env.example Praison webhook');
assert(
  envEx.includes('NEXT_PUBLIC_BASE_URL=https://efficiencyarchitects.online'),
  '.env.example base URL should be apex',
);

const sop = read('docs/CTP-CLOSE-SOP.md');
assert(sop.includes('Approve & send proposal'), 'SOP includes send proposal step');
assert(sop.includes('LAUNCH_OPERATIONAL_MATURITY'), 'SOP documents scale attestation');

if (failures.length) {
  console.error('Ops scale pack checks failed:');
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

console.log('Ops scale pack (S5) contract checks passed.');

/**
 * CTP Executive Snapshot (Phase 3 BI) wiring checks.
 * Run: node scripts/test-ctp-executive-snapshot.mjs
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

const snapshotPath = join(root, 'lib/ctp-executive-snapshot.ts');
const runPath = join(root, 'lib/ctp-executive-snapshot-run.ts');
const submissionsPath = join(root, 'lib/ctp-submissions.ts');
const submitPath = join(root, 'app/api/assessment/submit/route.ts');
const adminViewPath = join(root, 'lib/ctp-admin-view.ts');
const portalStatusPath = join(root, 'lib/ctp-portal-status.ts');
const pulsePath = join(root, 'lib/pulse-bus.ts');
const adminClientPath = join(root, 'app/admin/ctp/CtpSubmissionsClient.tsx');
const portalPagePath = join(root, 'app/portal/[slug]/ctp/page.tsx');

for (const [path, label] of [
  [snapshotPath, 'ctp-executive-snapshot.ts'],
  [runPath, 'ctp-executive-snapshot-run.ts'],
  [submissionsPath, 'ctp-submissions.ts'],
  [submitPath, 'assessment submit'],
  [adminViewPath, 'admin view'],
  [portalStatusPath, 'portal status'],
  [pulsePath, 'pulse-bus'],
  [adminClientPath, 'admin client'],
  [portalPagePath, 'portal CTP page'],
]) {
  assert(existsSync(path), `Missing ${label}`);
}

const snapshot = readFileSync(snapshotPath, 'utf8');
const run = readFileSync(runPath, 'utf8');
const submissions = readFileSync(submissionsPath, 'utf8');
const submit = readFileSync(submitPath, 'utf8');
const adminView = readFileSync(adminViewPath, 'utf8');
const portalStatus = readFileSync(portalStatusPath, 'utf8');
const pulse = readFileSync(pulsePath, 'utf8');
const adminClient = readFileSync(adminClientPath, 'utf8');
const portalPage = readFileSync(portalPagePath, 'utf8');

assert(snapshot.includes('buildCtpExecutiveSnapshot'), 'Must export snapshot builder');
assert(snapshot.includes('operationalMaturity'), 'Must compute operational maturity');
assert(snapshot.includes('adminWastePercent'), 'Must compute admin waste percent');
assert(snapshot.includes('scope'), 'Must include project scope block');
assert(run.includes('ctp.bi.ready'), 'Must emit ctp.bi.ready');
assert(run.includes('businessIntelligence'), 'Must gate on BI track flag');
assert(submissions.includes('executiveSnapshot'), 'Submissions must persist executiveSnapshot');
assert(submit.includes('runCtpExecutiveSnapshot'), 'Submit must run snapshot for BI tracks');
assert(submit.includes('businessIntelligence'), 'Submit must check businessIntelligence');
assert(adminView.includes('maturityScore'), 'Admin view must expose maturity');
assert(portalStatus.includes('executiveSnapshot'), 'Portal timeline must use snapshot');
assert(pulse.includes("'ctp.bi.ready'"), 'Pulse union must include ctp.bi.ready');
assert(adminClient.includes('Executive Snapshot'), 'Admin UI must show snapshot');
assert(portalPage.includes('maturityScore'), 'Portal page must show maturity');

if (failures.length) {
  console.error('CTP executive snapshot checks FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('CTP executive snapshot checks: PASS');
process.exit(0);

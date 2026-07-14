/**
 * CTP approve/reveal desk wiring checks.
 * Run: node scripts/test-ctp-approve-reveal.mjs
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

const actionsPath = join(root, 'lib/ctp-executive-actions.ts');
const apiPath = join(root, 'app/api/admin/ctp/submissions/[id]/action/route.ts');
const panelPath = join(root, 'app/admin/ctp/CtpExecutiveActionsPanel.tsx');
const clientPath = join(root, 'app/admin/ctp/CtpSubmissionsClient.tsx');
const revealPagePath = join(root, 'app/reveal/[slug]/page.tsx');
const revealExperiencePath = join(root, 'app/reveal/[slug]/RevealExperience.tsx');

for (const [path, label] of [
  [actionsPath, 'ctp-executive-actions.ts'],
  [apiPath, 'action API'],
  [panelPath, 'executive actions panel'],
  [clientPath, 'CTP admin client'],
  [revealPagePath, 'reveal page'],
  [revealExperiencePath, 'reveal experience'],
]) {
  assert(existsSync(path), `Missing ${label}`);
}

const actions = readFileSync(actionsPath, 'utf8');
const api = readFileSync(apiPath, 'utf8');
const panel = readFileSync(panelPath, 'utf8');
const client = readFileSync(clientPath, 'utf8');
const reveal = `${readFileSync(revealPagePath, 'utf8')}\n${readFileSync(revealExperiencePath, 'utf8')}`;

assert(actions.includes("ready_for_review"), 'Must support ready_for_review');
assert(actions.includes("approve_reveal"), 'Must support approve_reveal');
assert(actions.includes('run_digital_audit'), 'Must support run_digital_audit');
assert(actions.includes('resend_executive_email'), 'Must support resend_executive_email');
assert(actions.includes('reprovision_workspace'), 'Must support reprovision_workspace');
assert(actions.includes('runCtpDigitalPresenceAudit'), 'Digital audit action must call runner');
assert(actions.includes('sendCtpExecutiveEmailForSubmission'), 'Resend must use executive email helper');
assert(actions.includes('runCtpWorkspaceProvision'), 'Reprovision must call workspace provision');
assert(actions.includes('force: true'), 'Digital audit re-run must force');
assert(actions.includes('sendRevealEmail'), 'Approve must send reveal email');
assert(api.includes('runCtpExecutiveAction'), 'API must call executive actions');
assert(api.includes('run_digital_audit'), 'API must accept run_digital_audit');
assert(api.includes('resend_executive_email'), 'API must accept resend_executive_email');
assert(api.includes('reprovision_workspace'), 'API must accept reprovision_workspace');
assert(panel.includes('Approve & reveal'), 'Panel must expose approve button');
assert(panel.includes('Re-run digital audit'), 'Panel must expose digital audit re-run');
assert(panel.includes('Resend executive email'), 'Panel must expose resend executive email');
assert(panel.includes('Re-provision workspace'), 'Panel must expose re-provision workspace');
assert(client.includes('CtpExecutiveActionsPanel'), 'Admin client must mount panel');
const revealViewPath = join(root, 'lib/ctp-reveal.ts');
assert(existsSync(revealViewPath), 'Missing ctp-reveal view');
const revealView = readFileSync(revealViewPath, 'utf8');
assert(revealView.includes('Welcome to the other side'), 'Reveal page should feel celebratory');
assert(
  reveal.includes('Open live website') || revealView.includes('siteUrl'),
  'Reveal should surface site when present',
);

const runPath = join(root, 'lib/ctp-digital-presence-run.ts');
assert(existsSync(runPath), 'Missing digital presence run helper');
const runSrc = readFileSync(runPath, 'utf8');
assert(runSrc.includes('options?.force'), 'Runner must honor force re-run option');

if (failures.length) {
  console.error('CTP approve/reveal checks FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('CTP approve/reveal checks: PASS');
process.exit(0);

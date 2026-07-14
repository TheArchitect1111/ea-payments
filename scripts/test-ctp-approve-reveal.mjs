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
const revealPath = join(root, 'app/reveal/[slug]/page.tsx');

for (const [path, label] of [
  [actionsPath, 'ctp-executive-actions.ts'],
  [apiPath, 'action API'],
  [panelPath, 'executive actions panel'],
  [clientPath, 'CTP admin client'],
  [revealPath, 'reveal page'],
]) {
  assert(existsSync(path), `Missing ${label}`);
}

const actions = readFileSync(actionsPath, 'utf8');
const api = readFileSync(apiPath, 'utf8');
const panel = readFileSync(panelPath, 'utf8');
const client = readFileSync(clientPath, 'utf8');
const reveal = readFileSync(revealPath, 'utf8');

assert(actions.includes("ready_for_review"), 'Must support ready_for_review');
assert(actions.includes("approve_reveal"), 'Must support approve_reveal');
assert(actions.includes('run_digital_audit'), 'Must support run_digital_audit');
assert(actions.includes('runCtpDigitalPresenceAudit'), 'Digital audit action must call runner');
assert(actions.includes('force: true'), 'Digital audit re-run must force');
assert(actions.includes('sendRevealEmail'), 'Approve must send reveal email');
assert(api.includes('runCtpExecutiveAction'), 'API must call executive actions');
assert(api.includes('run_digital_audit'), 'API must accept run_digital_audit');
assert(panel.includes('Approve & reveal'), 'Panel must expose approve button');
assert(panel.includes('Re-run digital audit'), 'Panel must expose digital audit re-run');
assert(client.includes('CtpExecutiveActionsPanel'), 'Admin client must mount panel');
assert(reveal.includes('Welcome to the other side'), 'Reveal page should feel celebratory');
assert(reveal.includes('Open Live Website') || reveal.includes('siteUrl'), 'Reveal should surface site when present');

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

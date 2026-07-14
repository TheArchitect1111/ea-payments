/**
 * CTP Mission Control attention wiring checks.
 * Run: node scripts/test-ctp-mission-control-attention.mjs
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

const statsPath = join(root, 'lib/ctp-attention-stats.ts');
const attentionPath = join(root, 'lib/pulse-attention.ts');
const mcPath = join(root, 'app/api/mission-control/route.ts');
const adminViewPath = join(root, 'lib/ctp-admin-view.ts');
const adminUiPath = join(root, 'app/admin/ctp/CtpSubmissionsClient.tsx');
const pulsePath = join(root, 'lib/pulse-bus.ts');

for (const [path, label] of [
  [statsPath, 'ctp-attention-stats.ts'],
  [attentionPath, 'pulse-attention.ts'],
  [mcPath, 'mission-control route'],
  [adminViewPath, 'ctp-admin-view.ts'],
  [adminUiPath, 'CTP admin client'],
  [pulsePath, 'pulse-bus.ts'],
]) {
  assert(existsSync(path), `Missing ${label}`);
}

const stats = readFileSync(statsPath, 'utf8');
const attention = readFileSync(attentionPath, 'utf8');
const mc = readFileSync(mcPath, 'utf8');
const adminView = readFileSync(adminViewPath, 'utf8');
const adminUi = readFileSync(adminUiPath, 'utf8');
const pulse = readFileSync(pulsePath, 'utf8');

assert(stats.includes('executiveEmailsPending'), 'Stats must count pending executive emails');
assert(stats.includes('studiosInProgress'), 'Stats must count studios in progress');
assert(attention.includes('ctpStudiosInProgress'), 'Attention builder must accept studios in progress');
assert(attention.includes('ctpExecutiveEmailsPending'), 'Attention builder must accept pending emails');
assert(attention.includes("href: '/admin/ctp'"), 'CTP attention items must link to /admin/ctp');
assert(attention.includes("id: 'ctp-studios-ready'"), 'Must keep ready-for-review attention item');
assert(attention.includes("id: 'ctp-studios-in-progress'"), 'Must add studios-in-progress attention item');
assert(attention.includes("id: 'ctp-executive-emails-pending'"), 'Must add pending executive email attention item');
assert(
  (attention.match(/href: '\/admin\/ctp'/g) || []).length >= 4,
  'All primary CTP attention CTAs should land on /admin/ctp',
);
assert(mc.includes('ctpStudiosInProgress'), 'Mission Control must pass studios in progress');
assert(mc.includes('ctpExecutiveEmailsPending'), 'Mission Control must pass pending emails');
assert(adminView.includes('executiveEmailStatus'), 'Admin view must expose email status');
assert(adminUi.includes('Executive email'), 'Admin UI must show executive email status');
assert(pulse.includes('ctp.executive_email.resent'), 'Pulse bus must allow resend event type');

if (failures.length) {
  console.error('CTP Mission Control attention checks FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('CTP Mission Control attention checks: PASS');
process.exit(0);

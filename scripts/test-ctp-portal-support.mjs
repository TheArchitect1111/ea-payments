/**
 * CTP portal Messages & Support wiring checks.
 * Run: node scripts/test-ctp-portal-support.mjs
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

const viewPath = join(root, 'lib/ctp-support-view.ts');
const pagePath = join(root, 'app/portal/[slug]/ctp/support/page.tsx');
const overviewViewPath = join(root, 'lib/ctp-overview-view.ts');
const adminPath = join(root, 'app/admin/ctp/CtpSubmissionsClient.tsx');

for (const [path, label] of [
  [viewPath, 'ctp-support-view.ts'],
  [pagePath, 'support page'],
  [overviewViewPath, 'portal overview view'],
  [adminPath, 'admin CTP client'],
]) {
  assert(existsSync(path), `Missing ${label}`);
}

const view = readFileSync(viewPath, 'utf8');
const page = readFileSync(pagePath, 'utf8');
const overviewView = readFileSync(overviewViewPath, 'utf8');
const admin = readFileSync(adminPath, 'utf8');

assert(view.includes('buildCtpSupportView'), 'Must export support view builder');
assert(view.includes('SUPPORT_EMAIL') || view.includes('supportEmail'), 'Must include support email');
assert(view.includes('updates/new'), 'Must link to advisor messaging');
assert(view.includes('CALENDLY') || view.includes('calendly'), 'Must include Calendly');
assert(page.includes('buildCtpSupportView'), 'Page must use support view');
assert(page.includes('Messages & Support'), 'Page must brand as Messages & Support');
assert(page.includes('requirePortalModule'), 'Page must require ctp module');
assert(overviewView.includes('/ctp/support'), 'Overview must link to support');
assert(admin.includes('/ctp/support'), 'Admin must link to support');

if (failures.length) {
  console.error('CTP portal support checks FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('CTP portal support checks: PASS');
process.exit(0);

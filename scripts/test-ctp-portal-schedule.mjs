/**
 * CTP portal scheduling wiring checks.
 * Run: node scripts/test-ctp-portal-schedule.mjs
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

const viewPath = join(root, 'lib/ctp-schedule-view.ts');
const pagePath = join(root, 'app/portal/[slug]/ctp/schedule/page.tsx');
const overviewViewPath = join(root, 'lib/ctp-overview-view.ts');
const progressPath = join(root, 'app/portal/[slug]/ctp/progress/page.tsx');
const adminPath = join(root, 'app/admin/ctp/CtpSubmissionsClient.tsx');

for (const [path, label] of [
  [viewPath, 'ctp-schedule-view.ts'],
  [pagePath, 'schedule page'],
  [overviewViewPath, 'portal overview view'],
  [progressPath, 'portal progress page'],
  [adminPath, 'admin CTP client'],
]) {
  assert(existsSync(path), `Missing ${label}`);
}

const view = readFileSync(viewPath, 'utf8');
const page = readFileSync(pagePath, 'utf8');
const overviewView = readFileSync(overviewViewPath, 'utf8');
const progress = readFileSync(progressPath, 'utf8');
const admin = readFileSync(adminPath, 'utf8');

assert(view.includes('buildCtpScheduleView'), 'Must export schedule view builder');
assert(view.includes('reviewScheduledAt'), 'Must surface reviewScheduledAt');
assert(view.includes('CALENDLY'), 'Must include Calendly CTA URL');
assert(page.includes('buildCtpScheduleView'), 'Page must use schedule view');
assert(page.includes('Book strategy session'), 'Page must expose booking CTA');
assert(page.includes('requirePortalModule'), 'Page must require ctp module');
assert(overviewView.includes('/ctp/schedule'), 'Overview must link to schedule');
assert(progress.includes('reviewScheduledAt'), 'Progress must show scheduled review when present');
assert(admin.includes('/ctp/schedule'), 'Admin must link to scheduling');

if (failures.length) {
  console.error('CTP portal schedule checks FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('CTP portal schedule checks: PASS');
process.exit(0);

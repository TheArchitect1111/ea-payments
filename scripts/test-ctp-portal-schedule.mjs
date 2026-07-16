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

const calendlyPath = join(root, 'lib/ctp-calendly.ts');
const viewPath = join(root, 'lib/ctp-schedule-view.ts');
const pagePath = join(root, 'app/portal/[slug]/ctp/schedule/page.tsx');
const reviewPath = join(root, 'app/portal/[slug]/ctp/review/page.tsx');
const overviewViewPath = join(root, 'lib/ctp-overview-view.ts');
const progressPath = join(root, 'app/portal/[slug]/ctp/progress/page.tsx');
const adminPath = join(root, 'app/admin/ctp/CtpSubmissionsClient.tsx');

for (const [path, label] of [
  [calendlyPath, 'ctp-calendly.ts'],
  [viewPath, 'ctp-schedule-view.ts'],
  [pagePath, 'schedule page'],
  [reviewPath, 'review page'],
  [overviewViewPath, 'portal overview view'],
  [progressPath, 'portal progress page'],
  [adminPath, 'admin CTP client'],
]) {
  assert(existsSync(path), `Missing ${label}`);
}

const calendly = readFileSync(calendlyPath, 'utf8');
const view = readFileSync(viewPath, 'utf8');
const page = readFileSync(pagePath, 'utf8');
const review = readFileSync(reviewPath, 'utf8');
const overviewView = readFileSync(overviewViewPath, 'utf8');
const progress = readFileSync(progressPath, 'utf8');
const admin = readFileSync(adminPath, 'utf8');

assert(calendly.includes('ctpCalendlyUrl'), 'Must export shared Calendly URL helper');
assert(view.includes('buildCtpScheduleView'), 'Must export schedule view builder');
assert(view.includes('reviewScheduledAt'), 'Must surface reviewScheduledAt');
assert(view.includes('ctpCalendlyUrl'), 'Must use shared Calendly helper');
assert(page.includes('redirect'), 'Schedule page must redirect to canonical review');
assert(page.includes('opportunityReviewPath'), 'Schedule redirect must use route helper');
assert(review.includes('Schedule My Opportunity Review') || review.includes('ctaLabel'), 'Review page must expose booking CTA');
assert(review.includes('requirePortalModule'), 'Review page must require ctp module');
assert(overviewView.includes('/ctp/schedule'), 'Overview must link to schedule (legacy alias)');
assert(progress.includes('reviewScheduledAt'), 'Progress must show scheduled review when present');
assert(admin.includes('/ctp/schedule'), 'Admin must link to scheduling alias');

if (failures.length) {
  console.error('CTP portal schedule checks FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('CTP portal schedule checks: PASS');
process.exit(0);

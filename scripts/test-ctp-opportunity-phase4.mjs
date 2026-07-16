/**
 * Phase 4 — Opportunity Review & scheduling contract.
 * Run: node scripts/test-ctp-opportunity-phase4.mjs
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
const reviewPagePath = join(root, 'app/portal/[slug]/ctp/review/page.tsx');
const schedulePagePath = join(root, 'app/portal/[slug]/ctp/schedule/page.tsx');
const viewPath = join(root, 'lib/ctp-opportunity-view.ts');
const scheduleViewPath = join(root, 'lib/ctp-schedule-view.ts');
const routesPath = join(root, 'lib/ctp-opportunity-routes.ts');
const dashboardPath = join(root, 'app/portal/components/OpportunityDashboard.tsx');

for (const [path, label] of [
  [calendlyPath, 'ctp-calendly'],
  [reviewPagePath, 'review page'],
  [schedulePagePath, 'schedule page'],
  [viewPath, 'ctp-opportunity-view'],
  [scheduleViewPath, 'ctp-schedule-view'],
  [routesPath, 'ctp-opportunity-routes'],
]) {
  assert(existsSync(path), `Missing ${label}`);
}

const calendly = readFileSync(calendlyPath, 'utf8');
const reviewPage = readFileSync(reviewPagePath, 'utf8');
const schedulePage = readFileSync(schedulePagePath, 'utf8');
const view = readFileSync(viewPath, 'utf8');
const scheduleView = readFileSync(scheduleViewPath, 'utf8');
const routes = readFileSync(routesPath, 'utf8');
const dashboard = readFileSync(dashboardPath, 'utf8');

// Single Calendly source
assert(calendly.includes('ctpCalendlyUrl'), 'Must export ctpCalendlyUrl');
assert(calendly.includes('CALENDLY_URL'), 'Must read CALENDLY_URL env');
assert(scheduleView.includes('ctpCalendlyUrl'), 'Schedule view must use shared Calendly helper');
assert(!scheduleView.includes('DEFAULT_CALENDLY'), 'No duplicate Calendly constant in schedule view');
assert(!view.includes('DEFAULT_CALENDLY'), 'No duplicate Calendly constant in opportunity view');

// Review page — executive experience, not sales call
assert(reviewPage.includes('buildCtpOpportunityReviewView'), 'Review page uses review view builder');
assert(reviewPage.includes('not a sales call'), 'Must set guided-review expectation');
assert(reviewPage.includes('Schedule My Opportunity Review') || reviewPage.includes('ctaLabel'), 'Calendly CTA present');
assert(reviewPage.includes('calendlyUrl'), 'Must link to Calendly');
assert(reviewPage.includes('noopener noreferrer'), 'External Calendly link must be safe');
assert(reviewPage.includes('oe-report'), 'Must use Opportunity Experience styling');
assert(reviewPage.includes('During our Opportunity Review we will'), 'Must show agenda');

// View model composes schedule status
assert(view.includes('buildCtpScheduleView'), 'Review view must reuse schedule status copy');
assert(view.includes('ctaLabel'), 'Review view must expose CTA label');
assert(view.includes('headline'), 'Review view must expose headline');
assert(view.includes('Opportunity Review'), 'Dashboard utilities must link to review');

// Legacy schedule redirects to canonical review
assert(schedulePage.includes('redirect'), 'Schedule page must redirect');
assert(schedulePage.includes('opportunityReviewPath'), 'Schedule redirect must target review path');

// Routes
assert(routes.includes("review: 'ctp/review'"), 'Review segment defined in routes');

// Dashboard primary CTA → review
assert(dashboard.includes('reviewHref'), 'Dashboard must link to review');

// Forbidden scheduling jargon on review surface
const forbidden = ['strategy session', 'sales call', 'CRM', 'Book strategy'];
for (const term of forbidden) {
  if (term === 'sales call') continue; // allowed in "not a sales call"
  assert(!reviewPage.toLowerCase().includes(term.toLowerCase()), `Review page must not include: ${term}`);
}

if (failures.length) {
  console.error('Phase 4 Opportunity Review FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('Phase 4 Opportunity Experience (review & scheduling): PASS');
process.exit(0);

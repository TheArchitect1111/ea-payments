/**
 * CTP Opportunity Dashboard landing checks (replaces CRM overview hub).
 * Run: node scripts/test-ctp-portal-overview.mjs
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

const pagePath = join(root, 'app/portal/[slug]/ctp/page.tsx');
const viewPath = join(root, 'lib/ctp-opportunity-view.ts');
const dashPath = join(root, 'app/portal/components/OpportunityDashboard.tsx');
const experiencePath = join(root, 'app/portal/components/ClientExperience.tsx');
const reviewPath = join(root, 'app/portal/[slug]/ctp/review/page.tsx');
const detailPath = join(root, 'app/portal/[slug]/ctp/opportunities/[opportunityId]/page.tsx');
const progressPath = join(root, 'app/portal/[slug]/ctp/progress/page.tsx');

for (const [path, label] of [
  [pagePath, 'ctp page'],
  [viewPath, 'opportunity view'],
  [dashPath, 'OpportunityDashboard'],
  [experiencePath, 'ClientExperience'],
  [reviewPath, 'review page'],
  [detailPath, 'detail page'],
  [progressPath, 'progress / Design Studio'],
]) {
  assert(existsSync(path), `Missing ${label}`);
}

const page = readFileSync(pagePath, 'utf8');
const view = readFileSync(viewPath, 'utf8');
const experience = readFileSync(experiencePath, 'utf8');
const review = readFileSync(reviewPath, 'utf8');

assert(page.includes('ClientExperience'), 'Landing must render Client Experience');
assert(page.includes('buildCtpOpportunityDashboardView'), 'Landing must use opportunity view');
assert(!page.includes('buildCtpOverviewView'), 'Landing must not use CRM overview cards');
assert(experience.includes('What we noticed'), 'Must show initial findings');
assert(experience.includes('view.learnedCards'), 'Must render personalized insight cards');
assert(experience.includes('BrandOnboardingPaths'), 'Must include guided project definition');
assert(experience.includes('estimatedProjectInvestment'), 'Must include investment section');
assert(
  review.includes('Schedule My Opportunity Review') ||
    review.includes('ctaLabel') ||
    view.includes('Schedule My Opportunity Review'),
  'Review page CTA required',
);
assert(review.includes('calendlyUrl') || review.includes('CALENDLY') || view.includes('calendlyUrl'), 'Calendly must be wired');
assert(view.includes('designStudioHref'), 'Design Studio remains secondary link');

if (failures.length) {
  console.error('CTP portal overview checks FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('CTP portal overview checks: PASS');
process.exit(0);

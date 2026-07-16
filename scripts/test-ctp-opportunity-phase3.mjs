/**
 * Phase 3 — Opportunity Dashboard UI contract.
 * Run: node scripts/test-ctp-opportunity-phase3.mjs
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
const dashPath = join(root, 'app/portal/components/OpportunityDashboard.tsx');
const cssPath = join(root, 'app/portal/components/opportunity-experience.css');
const viewPath = join(root, 'lib/ctp-opportunity-view.ts');
const detailPath = join(root, 'app/portal/[slug]/ctp/opportunities/[opportunityId]/page.tsx');
const routesPath = join(root, 'lib/ctp-opportunity-routes.ts');

for (const [path, label] of [
  [pagePath, 'ctp dashboard page'],
  [dashPath, 'OpportunityDashboard'],
  [cssPath, 'opportunity-experience.css'],
  [viewPath, 'ctp-opportunity-view'],
  [detailPath, 'opportunity detail page'],
  [routesPath, 'ctp-opportunity-routes'],
]) {
  assert(existsSync(path), `Missing ${label}`);
}

const page = readFileSync(pagePath, 'utf8');
const dash = readFileSync(dashPath, 'utf8');
const css = readFileSync(cssPath, 'utf8');
const view = readFileSync(viewPath, 'utf8');
const detail = readFileSync(detailPath, 'utf8');

// Page wiring
assert(page.includes('OpportunityDashboard'), 'CTP page must render dashboard');
assert(page.includes('buildCtpOpportunityDashboardView'), 'Must build view from submission');
assert(!page.includes('buildCtpOverviewView'), 'Must not use CRM overview');
assert(page.includes('Opportunity Experience'), 'Must use Opportunity Experience chrome');

// Dashboard sections (prompt)
const sections = [
  'Executive Snapshot',
  'Overall Readiness',
  'Opportunity Rating',
  'Progress Tracker',
  'Opportunity Summary',
  'Top Three Opportunities',
  'Estimated Impact',
  'Business Health',
  'Benchmarks',
  'Coming soon',
  'Recommended Digital Foundation',
  'Project Preview',
  'Estimated Investment',
  'Walk Me Through My Recommendations',
];
for (const s of sections) {
  assert(dash.includes(s), `Dashboard missing section/copy: ${s}`);
}
assert(dash.includes('primaryCtaLabel'), 'Primary CTA from view model');
assert(view.includes('Review My Opportunity Plan'), 'View model defines primary CTA label');

// UX rules
assert(dash.includes('oe-report'), 'Light executive report shell');
assert(dash.includes('role="progressbar"'), 'Progress must be accessible');
assert(dash.includes('aria-labelledby'), 'Sections must have accessible labels');
assert(dash.includes('🥇'), 'Top opportunities use medal ranks');
assert(dash.includes('reviewHref'), 'Primary CTA targets review');
assert(dash.includes('showDesignStudio'), 'Design Studio is conditional secondary');

// Forbidden dashboard jargon (user-facing strings in component)
const forbidden = ['Automation', 'Workflow', 'CMS', 'API', 'Infrastructure', 'Deployment', 'CRM'];
for (const term of forbidden) {
  assert(!dash.includes(term), `Dashboard must not show: ${term}`);
}

// View model
assert(view.includes('buildCtpOpportunityDashboardView'), 'Dashboard view builder required');
assert(view.includes('buildOpportunities'), 'Must build opportunity cards');
assert(view.includes('mapHealthAreas'), 'Must map business health areas');
assert(view.includes('opportunityDetailPath'), 'Health/opportunity cards link to detail');
assert(view.includes('opportunityReviewPath'), 'Review href from routes');
assert(view.includes('Opportunity Review'), 'Progress includes Opportunity Review step');

// Detail page for clickable cards
assert(detail.includes('What We Noticed'), 'Detail page required for card drill-down');
assert(detail.includes('Why It Matters'), 'Detail page must explain impact');

// Responsive
assert(css.includes('clamp('), 'Typography must be responsive');
assert(css.includes('grid-template-columns'), 'Layout must use responsive grids');
assert(css.includes('@media'), 'Mobile breakpoints required');

if (failures.length) {
  console.error('Phase 3 Opportunity Dashboard FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('Phase 3 Opportunity Experience (dashboard): PASS');
process.exit(0);

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
const experiencePath = join(root, 'app/portal/components/ClientExperience.tsx');
const cssPath = join(root, 'app/portal/components/opportunity-experience.css');
const experienceCssPath = join(root, 'app/portal/components/client-experience.css');
const viewPath = join(root, 'lib/ctp-opportunity-view.ts');
const detailPath = join(root, 'app/portal/[slug]/ctp/opportunities/[opportunityId]/page.tsx');
const routesPath = join(root, 'lib/ctp-opportunity-routes.ts');

for (const [path, label] of [
  [pagePath, 'ctp dashboard page'],
  [experiencePath, 'ClientExperience'],
  [cssPath, 'opportunity-experience.css'],
  [experienceCssPath, 'client-experience.css'],
  [viewPath, 'ctp-opportunity-view'],
  [detailPath, 'opportunity detail page'],
  [routesPath, 'ctp-opportunity-routes'],
]) {
  assert(existsSync(path), `Missing ${label}`);
}

const page = readFileSync(pagePath, 'utf8');
const experience = readFileSync(experiencePath, 'utf8');
const experienceCss = readFileSync(experienceCssPath, 'utf8');
const view = readFileSync(viewPath, 'utf8');
const detail = readFileSync(detailPath, 'utf8');

// Page wiring
assert(page.includes('ClientExperience'), 'CTP page must render the canonical Client Experience');
assert(page.includes('buildCtpOpportunityDashboardView'), 'Must build view from submission');
assert(!page.includes('buildCtpOverviewView'), 'Must not use CRM overview');
assert(page.includes('presentation="client"'), 'Must use client presentation chrome');

// Canonical cinematic Client Experience scenes.
const sections = [
  'Welcome',
  'Imagine',
  'What we noticed',
  'Where we begin',
  'Your project journey',
  'What happens next',
  'Support anytime',
];
for (const s of sections) {
  assert(experience.includes(s), `Client Experience missing scene/copy: ${s}`);
}
assert(experience.includes('primaryCtaLabel'), 'Primary CTA from view model');
assert(view.includes('Review My Opportunity Plan'), 'View model defines primary CTA label');

// UX rules
assert(experience.includes('cex-stage'), 'Cinematic Client Experience shell');
assert(experience.includes('aria-current'), 'Scene progress must be accessible');
assert(experience.includes('aria-labelledby'), 'Scenes must have accessible labels');
assert(experience.includes('view.guide?.nbaHref'), 'Primary CTA must follow the guide engine');
assert(experience.includes('BrandOnboardingPaths'), 'Brand onboarding remains part of the experience');
assert(experience.includes('/ctp/messages'), 'Messages must remain available');
assert(experience.includes('/ctp/documents'), 'Documents must remain available');
assert(experience.includes('/ctp/support'), 'Support must remain available');

// Forbidden dashboard jargon (user-facing strings in component)
const forbidden = ['Automation', 'Workflow', 'CMS', 'API', 'Infrastructure', 'Deployment', 'CRM'];
for (const term of forbidden) {
  assert(!experience.includes(term), `Client Experience must not show: ${term}`);
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
assert(experienceCss.includes('clamp('), 'Typography must be responsive');
assert(experienceCss.includes('grid-template-columns'), 'Layout must use responsive grids');
assert(experienceCss.includes('@media'), 'Mobile breakpoints required');

if (failures.length) {
  console.error('Phase 3 Opportunity Dashboard FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('Phase 3 Opportunity Experience (dashboard): PASS');
process.exit(0);

/**
 * CTP AI production engine wiring checks.
 * Run: node scripts/test-ctp-ai-production.mjs
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

const productionPath = join(root, 'lib/ctp-production.ts');
const runPath = join(root, 'lib/ctp-production-run.ts');
const submissionsPath = join(root, 'lib/ctp-submissions.ts');
const intakePath = join(root, 'lib/ctp-intake-orchestrator.ts');
const workspacePath = join(root, 'lib/ctp-workspace-provision.ts');
const websitePath = join(root, 'lib/ctp-website-provision.ts');
const studioPath = join(root, 'lib/ctp-studio-bridge.ts');
const portalStatusPath = join(root, 'lib/ctp-portal-status.ts');
const actionsPath = join(root, 'lib/ctp-executive-actions.ts');
const panelPath = join(root, 'app/admin/ctp/CtpExecutiveActionsPanel.tsx');
const progressPagePath = join(root, 'app/portal/[slug]/ctp/progress/page.tsx');

for (const [path, label] of [
  [productionPath, 'ctp-production.ts'],
  [runPath, 'ctp-production-run.ts'],
  [submissionsPath, 'ctp-submissions.ts'],
  [intakePath, 'intake orchestrator'],
  [workspacePath, 'workspace provision'],
  [websitePath, 'website provision'],
  [studioPath, 'studio bridge'],
  [portalStatusPath, 'portal status'],
  [actionsPath, 'executive actions'],
  [panelPath, 'executive panel'],
  [progressPagePath, 'portal CTP progress page'],
]) {
  assert(existsSync(path), `Missing ${label}`);
}

const production = readFileSync(productionPath, 'utf8');
const run = readFileSync(runPath, 'utf8');
const submissions = readFileSync(submissionsPath, 'utf8');
const intake = readFileSync(intakePath, 'utf8');
const workspace = readFileSync(workspacePath, 'utf8');
const website = readFileSync(websitePath, 'utf8');
const studio = readFileSync(studioPath, 'utf8');
const portalStatus = readFileSync(portalStatusPath, 'utf8');
const actions = readFileSync(actionsPath, 'utf8');
const panel = readFileSync(panelPath, 'utf8');
const progressPage = readFileSync(progressPagePath, 'utf8');

assert(production.includes('buildCtpProductionPackage'), 'Must export package builder');
assert(production.includes('website_brief'), 'Website track artifacts required');
assert(production.includes('executive_blueprint'), 'Business track artifacts required');
assert(run.includes('ctp.production.ready'), 'Must emit production ready Pulse');
assert(run.includes('scheduleCtpProduction'), 'Must expose schedule helper');
assert(submissions.includes('productionPackage'), 'Submissions must persist productionPackage');
assert(intake.includes('scheduleCtpProduction'), 'Intake must schedule production');
assert(workspace.includes('scheduleCtpProduction'), 'Workspace active must schedule production');
assert(website.includes('force: true'), 'Website live must refresh production');
assert(studio.includes('scheduleCtpProduction'), 'Studio bridge must schedule production');
assert(portalStatus.includes('productionReady'), 'Timeline must honor production package');
assert(actions.includes('run_production'), 'Executive desk must support run_production');
assert(panel.includes('Run AI production'), 'Admin panel must expose run button');
assert(progressPage.includes('AI production'), 'Progress must surface production package');

if (failures.length) {
  console.error('CTP AI production checks FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('CTP AI production checks: PASS');
process.exit(0);

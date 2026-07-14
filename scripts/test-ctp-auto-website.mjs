/**
 * CTP auto website provision wiring checks.
 * Run: node scripts/test-ctp-auto-website.mjs
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

const websiteProv = join(root, 'lib/ctp-website-provision.ts');
const workspaceProv = join(root, 'lib/ctp-workspace-provision.ts');
const submit = join(root, 'app/api/assessment/submit/route.ts');
const submissions = join(root, 'lib/ctp-submissions.ts');
const provisioner = join(root, 'lib/provision-website-portal.ts');

for (const [path, label] of [
  [websiteProv, 'ctp-website-provision.ts'],
  [workspaceProv, 'ctp-workspace-provision.ts'],
  [submit, 'assessment submit'],
  [submissions, 'ctp-submissions'],
  [provisioner, 'provision-website-portal'],
]) {
  assert(existsSync(path), `Missing ${label}`);
}

const websiteSrc = readFileSync(websiteProv, 'utf8');
const workspaceSrc = readFileSync(workspaceProv, 'utf8');
const submitSrc = readFileSync(submit, 'utf8');
const submissionsSrc = readFileSync(submissions, 'utf8');

assert(websiteSrc.includes('provisionWebsitePortalSite'), 'Must reuse website provisioner');
assert(websiteSrc.includes('scheduleCtpWebsiteProvision'), 'Must export schedule helper');
assert(websiteSrc.includes('website_portal'), 'Must detect website_portal track');
assert(workspaceSrc.includes('scheduleCtpWebsiteProvision'), 'Workspace provision must schedule website');
assert(submitSrc.includes('scheduleCtpWebsiteProvision'), 'Submit must schedule website for websiteRequired');
assert(submissionsSrc.includes('siteUrl'), 'CTP submission must persist siteUrl');

if (failures.length) {
  console.error('CTP auto website checks FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('CTP auto website checks: PASS');
process.exit(0);

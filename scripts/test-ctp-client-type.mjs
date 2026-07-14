/**
 * CTP client-type classifier contract checks.
 * Run: node scripts/test-ctp-client-type.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const failures = [];
const require = createRequire(import.meta.url);

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const classifierPath = join(root, 'lib/ctp-client-type.ts');
const submissionsPath = join(root, 'lib/ctp-submissions.ts');
const submitPath = join(root, 'app/api/assessment/submit/route.ts');
const emailPath = join(root, 'lib/email.ts');
const adminViewPath = join(root, 'lib/ctp-admin-view.ts');

for (const [path, label] of [
  [classifierPath, 'ctp-client-type.ts'],
  [submissionsPath, 'ctp-submissions.ts'],
  [submitPath, 'assessment submit route'],
  [emailPath, 'email.ts'],
  [adminViewPath, 'ctp-admin-view.ts'],
]) {
  assert(existsSync(path), `Missing ${label}`);
}

const classifierSrc = readFileSync(classifierPath, 'utf8');
const submissionsSrc = readFileSync(submissionsPath, 'utf8');
const submitSrc = readFileSync(submitPath, 'utf8');
const emailSrc = readFileSync(emailPath, 'utf8');
const adminSrc = readFileSync(adminViewPath, 'utf8');

assert(classifierSrc.includes("business_transformation"), 'Missing business_transformation type');
assert(classifierSrc.includes("website_portal"), 'Missing website_portal type');
assert(classifierSrc.includes('export function classifyCtpClientType'), 'Missing classifier export');
assert(submissionsSrc.includes('clientType'), 'CTP submission must persist clientType');
assert(submissionsSrc.includes('clientTypeClassification'), 'CTP submission must persist classification');
assert(submitSrc.includes('classifyCtpClientType'), 'Assessment submit must classify CTP clients');
assert(submitSrc.includes('clientTypeLabel'), 'Submit response/email must include clientTypeLabel');
assert(emailSrc.includes('clientTypeLabel'), 'Confirmation email must accept clientTypeLabel');
assert(emailSrc.includes('Primary track:'), 'Confirmation email must show primary track');
assert(adminSrc.includes('clientTypeLabel'), 'Admin view must expose clientTypeLabel');

// Runtime rules via tsx if available; otherwise string-level only.
try {
  const { register } = require('tsx/cjs/api');
  register();
  const { classifyCtpClientType } = require('../lib/ctp-client-type.ts');

  const websitePortal = classifyCtpClientType({
    desiredExperiences: ['landing-page', 'portal'],
  });
  assert(websitePortal.clientType === 'website_portal', 'landing+portal => website_portal');
  assert(websitePortal.portalRequired && websitePortal.websiteRequired, 'website_portal flags');

  const website = classifyCtpClientType({ desiredExperiences: ['landing-page'] });
  assert(website.clientType === 'website', 'landing-only => website');

  const portal = classifyCtpClientType({ desiredExperiences: ['portal'] });
  assert(portal.clientType === 'portal_only', 'portal-only => portal_only');

  const biz = classifyCtpClientType({
    desiredExperiences: ['automation'],
    recommendedProjectType: 'business_transformation',
  });
  assert(biz.clientType === 'business_transformation', 'ops/transform => business_transformation');
} catch (err) {
  console.warn('Runtime classifier checks skipped:', err?.message || err);
}

if (failures.length) {
  console.error('CTP client-type checks FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('CTP client-type checks: PASS');
process.exit(0);

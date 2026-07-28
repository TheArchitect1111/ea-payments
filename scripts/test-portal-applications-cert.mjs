#!/usr/bin/env node
/**
 * Portal Applications cert — apply flow, queue, shared form ledger.
 * Run: node scripts/test-portal-applications-cert.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const required = [
  'app/portal/[slug]/apply/page.tsx',
  'app/portal/[slug]/applications/page.tsx',
  'lib/portal-forms/store.ts',
  'app/api/portal/forms/submit/route.ts',
];

for (const rel of required) {
  assert(existsSync(join(root, rel)), `missing ${rel}`);
}

const registry = readFileSync(join(root, 'lib/modules/registry.ts'), 'utf8');
assert(registry.includes("'applications'"), 'module registry must include applications');

const experience = readFileSync(join(root, 'lib/experience-registry.ts'), 'utf8');
assert(experience.includes("moduleId: 'applications'"), 'experience registry must map applications');

const applyPage = readFileSync(join(root, 'app/portal/[slug]/apply/page.tsx'), 'utf8');
assert(applyPage.includes("kind=\"application\""), 'apply page must submit application kind');
assert(applyPage.includes('PortalFormClient'), 'apply page must use shared portal form client');
const formClient = readFileSync(join(root, 'app/portal/[slug]/intake/IntakeFormClient.tsx'), 'utf8');
assert(formClient.includes('/api/portal/forms/submit'), 'form client must POST submit API');

const appsPage = readFileSync(join(root, 'app/portal/[slug]/applications/page.tsx'), 'utf8');
assert(appsPage.includes("requirePortalModule(slug, 'applications')"), 'applications page must gate module');
assert(appsPage.includes("kind: 'application'"), 'applications page must filter application kind');

const submitRoute = readFileSync(join(root, 'app/api/portal/forms/submit/route.ts'), 'utf8');
assert(submitRoute.includes("'application'"), 'submit route must accept application kind');

if (failures.length) {
  console.error('FAIL portal-applications-cert');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS portal-applications-cert');

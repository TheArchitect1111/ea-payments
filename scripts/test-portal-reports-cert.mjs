#!/usr/bin/env node
/**
 * Portal Reports cert — curated gallery module.
 * Run: node scripts/test-portal-reports-cert.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

assert(existsSync(join(root, 'lib/portal-reports.ts')), 'missing lib/portal-reports.ts');
assert(existsSync(join(root, 'app/portal/[slug]/reports/page.tsx')), 'missing reports page');

const registry = readFileSync(join(root, 'lib/modules/registry.ts'), 'utf8');
assert(registry.includes("'reports'"), 'module registry must include reports');

const reportsLib = readFileSync(join(root, 'lib/portal-reports.ts'), 'utf8');
assert(reportsLib.includes('listReportArtifacts'), 'portal-reports must export listReportArtifacts');
assert(reportsLib.includes('pulse'), 'reports gallery must link Pulse');
assert(reportsLib.includes('documents'), 'reports gallery must link documents');

const page = readFileSync(join(root, 'app/portal/[slug]/reports/page.tsx'), 'utf8');
assert(page.includes("requirePortalModule(slug, 'reports')"), 'reports page must gate module');
assert(page.includes('listReportArtifacts'), 'reports page must use listReportArtifacts');

if (failures.length) {
  console.error('FAIL portal-reports-cert');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS portal-reports-cert');

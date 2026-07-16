#!/usr/bin/env node
/**
 * Contract: GlitchTip monitoring layer (Sentry-compatible SDK).
 * Run: node scripts/test-glitchtip-monitoring-contract.mjs
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

const files = [
  'lib/monitoring/dsn.ts',
  'lib/monitoring/options.ts',
  'lib/monitoring/scrub.ts',
  'lib/monitoring/ops-center.ts',
  'lib/monitoring/index.ts',
  'docs/GLITCHTIP-SETUP.md',
  'instrumentation.ts',
  'instrumentation-client.ts',
  'lib/ops-error.ts',
];

for (const rel of files) {
  assert(existsSync(join(root, rel)), `missing ${rel}`);
}

const dsn = readFileSync(join(root, 'lib/monitoring/dsn.ts'), 'utf8');
assert(dsn.includes('NEXT_PUBLIC_GLITCHTIP_DSN'), 'DSN resolver must prefer GlitchTip');
assert(dsn.includes('NEXT_PUBLIC_SENTRY_DSN'), 'DSN resolver must accept legacy Sentry');
assert(dsn.includes('monitoringConfigured'), 'monitoringConfigured required');

const options = readFileSync(join(root, 'lib/monitoring/options.ts'), 'utf8');
assert(options.includes('beforeSend'), 'beforeSend scrubbing required');
assert(options.includes('APP_RELEASE') || options.includes('resolveAppRelease'), 'release tracking required');

const scrub = readFileSync(join(root, 'lib/monitoring/scrub.ts'), 'utf8');
assert(scrub.includes('[Filtered]'), 'secret scrubbing required');

const instr = readFileSync(join(root, 'instrumentation.ts'), 'utf8');
assert(instr.includes('monitoringConfigured'), 'instrumentation must gate on monitoringConfigured');

const ops = readFileSync(join(root, 'lib/ops-error.ts'), 'utf8');
assert(ops.includes('monitoringConfigured'), 'ops-error must gate on monitoringConfigured');

const doc = readFileSync(join(root, 'docs/GLITCHTIP-SETUP.md'), 'utf8');
assert(doc.includes('NEXT_PUBLIC_GLITCHTIP_DSN'), 'setup doc must document GlitchTip DSN');
assert(doc.includes('Operations Center') || doc.includes('ops-center'), 'ops center architecture note required');

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS glitchtip-monitoring-contract');

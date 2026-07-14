/**
 * CTP interactive Design Studio wiring checks.
 * Run: node scripts/test-ctp-design-studio.mjs
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

const libPath = join(root, 'lib/ctp-design-studio.ts');
const apiPath = join(root, 'app/api/portal/ctp/studio/route.ts');
const formPath = join(root, 'app/portal/components/PortalCtpDesignStudioForm.tsx');
const progressPath = join(root, 'app/portal/[slug]/ctp/progress/page.tsx');
const pulsePath = join(root, 'lib/pulse-bus.ts');
const statusPath = join(root, 'lib/ctp-portal-status.ts');

for (const [path, label] of [
  [libPath, 'ctp-design-studio.ts'],
  [apiPath, 'portal studio API'],
  [formPath, 'Design Studio form'],
  [progressPath, 'portal CTP progress page'],
  [pulsePath, 'pulse-bus'],
  [statusPath, 'portal status'],
]) {
  assert(existsSync(path), `Missing ${label}`);
}

const lib = readFileSync(libPath, 'utf8');
const api = readFileSync(apiPath, 'utf8');
const form = readFileSync(formPath, 'utf8');
const progress = readFileSync(progressPath, 'utf8');
const pulse = readFileSync(pulsePath, 'utf8');
const status = readFileSync(statusPath, 'utf8');

assert(lib.includes('applyCtpDesignStudioInput'), 'Must export apply helper');
assert(lib.includes('scheduleCtpProduction'), 'Save must refresh production');
assert(lib.includes('ctp.studio.input'), 'Must emit studio input Pulse');
assert(api.includes('applyCtpDesignStudioInput'), 'API must apply inputs');
assert(api.includes('guardPortalApiCookie'), 'API must require portal auth');
assert(form.includes('Save Design Studio'), 'Form must expose save CTA');
assert(form.includes('/api/portal/ctp/studio'), 'Form must POST studio API');
assert(form.includes('/api/ctp/assets'), 'Form must upload via CTP assets API');
assert(progress.includes('PortalCtpDesignStudioForm'), 'Progress page must mount form');
assert(status.includes('designStudioFields'), 'Status view must expose field defaults');
assert(pulse.includes("'ctp.studio.input'"), 'Pulse union must include ctp.studio.input');

if (failures.length) {
  console.error('CTP Design Studio checks FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('CTP Design Studio checks: PASS');
process.exit(0);

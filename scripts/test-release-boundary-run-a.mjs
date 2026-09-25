import { readFileSync } from 'node:fs';

const ci = readFileSync('.github/workflows/ci.yml', 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

for (const job of ['platform-core:', 'certified-assembly:', 'platform-build:']) {
  assert(ci.includes(job), `missing Run A boundary ${job}`);
}

for (const universal of [
  'test-production-protection.mjs',
  'test-tenant-release-safety.mjs',
  'test-release-guardrails.mjs',
  'test-master-guard-contract.mjs',
  'test-system-registry.mjs',
  'test-control-plane.ts',
  'test-capability-standard.mjs',
  'test-modular-assembly-run6.ts',
  'npm run verify:deploy',
  'test-recovery-journeys.mjs',
]) {
  assert(ci.includes(universal), `universal safety/assembly evidence missing: ${universal}`);
}

for (const unrelated of [
  'test-athlete-brand-os-run',
  'test:amanda-checkout',
  'test:simplifi-hardening',
  'test-recovery-journeys.mjs',
  'test-universal-factory-run10.mjs',
  'npm run lint',
]) {
  assert(!ci.includes(unrelated), `unrelated suite still coupled to universal release gate: ${unrelated}`);
}

if (failures.length) {
  console.error('EA Release Boundary Run A FAILED');
  failures.forEach((failure) => console.error(' -', failure));
  process.exit(1);
}

console.log('EA Release Boundary Run A OK');
console.log(' - platform security/safety remains universal');
console.log(' - certified assembly contract remains universal');
console.log(' - production application build remains universal');
console.log(' - product/client/legacy suites are decoupled from unrelated client promotion');

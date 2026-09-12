import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const policy = JSON.parse(read('config/release-guardrails.json'));
const ci = read('.github/workflows/ci.yml');
const protection = JSON.parse(read('config/production-protection.json'));
const smoke = read('tests/smoke/core-flows.spec.ts');
const tenantSafety = read('scripts/test-tenant-safety.mjs');
const productionGate = read('.github/workflows/ea-production-gate.yml');

for (const gate of ['system-registry','production-protection','tenant-safety','release-guardrails','recovery','factory-fulfillment','customer-journey-smoke']) {
  assert(policy.requiredGates.includes(gate), `Missing required release gate: ${gate}`);
}

assert.match(ci, /npm run test:tenant-safety/, 'CI must execute tenant isolation/security checks');
assert.match(ci, /npm run test:release-guardrails/, 'CI must execute release guardrail contract');
assert.match(ci, /npm run verify:deploy/, 'CI must execute browser customer-journey smoke tests');
assert.match(ci, /test-recovery-journeys/, 'CI must execute live recovery journeys');
assert.match(productionGate, /production-gate-manifest/, 'Production promotion must remain manifest-gated');

assert(protection.clients.length >= 3, 'Production protection must cover platform plus critical client/product surfaces');
for (const client of protection.clients) {
  assert(client.id && client.name, 'Every protected surface requires stable identity');
  assert((client.publicUrls?.length || 0) + (client.platformRoutes?.length || 0) > 0, `${client.id} requires a protected route or URL`);
  assert((client.sourceContracts?.length || 0) > 0, `${client.id} requires source invariants`);
}

assert.match(tenantSafety, /Pulse event reads must be admin-only/, 'Tenant-safety contract must cover Pulse');
assert.match(tenantSafety, /Billing must enforce billing RBAC/, 'Tenant-safety contract must cover billing');
assert.match(smoke, /pulse route requires portal login/, 'Smoke suite must verify protected Pulse behavior');
assert.match(smoke, /amplifi landing page is reachable/, 'Smoke suite must verify Amplifi customer surface');

const switches = new Map(policy.killSwitches.map((item) => [item.id, item]));
for (const id of ['amplifi-generation','factory-execution','client-updates-autoexecute']) {
  assert(switches.has(id), `Missing emergency kill switch: ${id}`);
}
assert.equal(switches.get('client-updates-autoexecute').safeDefault, true, 'Automatic client updates must fail safe/off until explicitly enabled');

console.log(`EA Release Guardrails: PASS (${policy.requiredGates.length} required gates, ${protection.clients.length} protected surfaces, ${policy.killSwitches.length} kill switches)`);

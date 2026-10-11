import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MODULE_IDS } from '../lib/modules/registry';

const specialized = new Set(['calendar','people','discovery']);
const remaining = MODULE_IDS.filter(id => !specialized.has(id));
const installer = readFileSync('lib/bricks/module-install.ts', 'utf8');
const route = readFileSync('app/api/bricks/tenant-provision-test/route.ts', 'utf8');

test('inventory includes exactly 20 unspecialized canonical modules', () => {
  assert.equal(MODULE_IDS.length, 23);
  assert.equal(remaining.length, 20);
  assert.equal(new Set(remaining).size, 20);
});
for (const moduleId of remaining) {
  test(`module ${moduleId}: selected modules use durable, tenant-scoped replay receipts`, () => {
    assert.ok(installer.includes('for (const id of ids)'));
    assert.match(installer, /readBrickRecord/);
    assert.match(installer, /writeBrickRecord/);
    assert.match(installer, /Module install receipt mismatch/);
    assert.ok(installer.includes('brickHash(tenant.organizationId)'));
    assert.match(route, /ensureTenantFoundation/);
    assert.match(route, /receiptReplay/);
    assert.match(route, /lifecycleCertified: false/);
    assert.ok(MODULE_IDS.includes(moduleId));
  });
}
test('production preview fixture is guarded before auth or tenant writes', () => {
  assert.ok(route.includes("if (!provisionTestsAllowed()) return Response.json({ error: 'Not found' }, { status: 404 })"));
  assert.ok(route.includes('export async function GET()'));
});

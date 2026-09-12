import assert from 'node:assert/strict';
import { createAssemblyPlan, requireAssemblyPlan } from '../lib/modules/assembly';
import {
  planClientFactoryAssembly,
  requireClientFactoryAssembly,
} from '../lib/modules/client-factory-assembly';
import { getModuleDefinition } from '../lib/modules/registry';

const wave = ['intake', 'applications', 'reports'] as const;
const plan = requireAssemblyPlan(wave);
assert.equal(plan.blocked, false);
assert.deepEqual(plan.admitted, [
  'dashboard',
  'amplifi',
  'update-hub',
  'intake',
  'applications',
  'reports',
]);

for (const id of wave) {
  const definition = getModuleDefinition(id);
  assert.ok(definition, `${id} must exist in the canonical module registry`);
  assert.ok(definition.pathSegment, `${id} must have a portal route segment`);
  assert.equal(definition.demoOnly, undefined, `${id} cannot be demo-only`);
}

const mixed = createAssemblyPlan(['intake', 'events']);
assert.equal(mixed.blocked, true);
assert.ok(mixed.admitted.includes('intake'));
assert.deepEqual(mixed.rejected, [
  { id: 'events', reason: 'not-certified', status: 'inventoried' },
]);

const starter = planClientFactoryAssembly({
  packagePurchased: 'Website + Portal Starter',
});
assert.equal(starter.blocked, true, 'package must fail closed while any entitlement is uncertified');
assert.ok(starter.admitted.includes('intake'));
assert.ok(starter.admitted.includes('applications'));
assert.ok(starter.admitted.includes('reports'));
assert.ok(starter.rejected.length > 0);
assert.throws(
  () => requireClientFactoryAssembly({ packagePurchased: 'Website + Portal Starter' }),
  /EA assembly blocked:/,
);

console.log('EA Modular Assembly Run 3 OK');
console.log(' - intake, applications, and reports are certified reusable business capabilities');
console.log(' - certified business capabilities coexist with the universal chassis');
console.log(' - uncertified modules still fail closed');
console.log(' - Client Factory package planning is now routed through the Assembly Engine');
console.log(' - incomplete package certification blocks before provisioning writes');

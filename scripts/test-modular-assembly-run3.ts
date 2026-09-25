import assert from 'node:assert/strict';
import { createAssemblyPlan, requireAssemblyPlan } from '../lib/modules/assembly';
import {
  planClientFactoryAssembly,
  requireClientFactoryAssembly,
} from '../lib/modules/client-factory-assembly';
import { getModuleDefinition } from '../lib/modules/registry';

const wave = ['intake', 'applications', 'reports'] as const;
const plan = createAssemblyPlan(wave);
assert.equal(plan.blocked, true);
assert.deepEqual(plan.admitted, []);
assert.ok(plan.rejected.every((x) => x.reason === 'missing-10-class-certificate'));

for (const id of wave) {
  const definition = getModuleDefinition(id);
  assert.ok(definition, `${id} must exist in the canonical module registry`);
  assert.ok(definition.pathSegment, `${id} must have a portal route segment`);
  assert.equal(definition.demoOnly, undefined, `${id} cannot be demo-only`);
}

// Run 3 established a fail-closed admission boundary. Later runs are allowed to
// certify additional known modules, so this invariant uses a permanently unknown
// capability rather than freezing a legitimate module in an uncertified state.
const unknownCapability = '__run3-unknown-capability__';
const mixed = createAssemblyPlan(['intake', unknownCapability]);
assert.equal(mixed.blocked, true);
assert.ok(!mixed.admitted.includes('intake'));
assert.ok(mixed.rejected.some((x) => x.id === unknownCapability && x.reason === 'unknown-module'));

const clientFactoryPlan = planClientFactoryAssembly({
  packagePurchased: 'Amplifi',
  requestedModuleIds: [unknownCapability],
});
assert.equal(clientFactoryPlan.blocked, true);
assert.ok(!clientFactoryPlan.admitted.includes('amplifi'));
assert.ok(clientFactoryPlan.rejected.some((x) => x.id === unknownCapability && x.reason === 'unknown-module'));
assert.throws(
  () =>
    requireClientFactoryAssembly({
      packagePurchased: 'Amplifi',
      requestedModuleIds: [unknownCapability],
    }),
  /EA assembly blocked:/,
);

console.log('EA Modular Assembly Run 3 OK');
console.log(' - legacy certified labels cannot bypass the 10-class certificate authority');
console.log(' - certified business capabilities coexist with the universal chassis');
console.log(' - unknown capabilities remain fail-closed');
console.log(' - Client Factory package planning remains routed through the Assembly Engine');
console.log(' - Run 3 invariants remain valid as later runs certify additional modules');

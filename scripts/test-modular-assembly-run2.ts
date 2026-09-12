import assert from 'node:assert/strict';
import { createAssemblyPlan, requireAssemblyPlan } from '../lib/modules/assembly';

const coreOnly = createAssemblyPlan([]);
assert.deepEqual(coreOnly.admitted, ['dashboard', 'amplifi', 'update-hub']);
assert.equal(coreOnly.blocked, false);

const duplicateCore = createAssemblyPlan(['amplifi', 'amplifi']);
assert.deepEqual(duplicateCore.admitted, ['dashboard', 'amplifi', 'update-hub']);
assert.equal(duplicateCore.blocked, false);

const uncertifiedBusiness = createAssemblyPlan(['events']);
assert.equal(uncertifiedBusiness.blocked, true);
assert.deepEqual(uncertifiedBusiness.rejected, [
  { id: 'events', reason: 'not-certified', status: 'inventoried' },
]);

const unknown = createAssemblyPlan(['not-a-real-module']);
assert.equal(unknown.blocked, true);
assert.deepEqual(unknown.rejected, [
  { id: 'not-a-real-module', reason: 'unknown-module' },
]);

assert.throws(
  () => requireAssemblyPlan(['events']),
  /EA assembly blocked: events:not-certified/,
);

const approved = requireAssemblyPlan(['dashboard', 'amplifi', 'update-hub']);
assert.equal(approved.blocked, false);
assert.deepEqual(approved.rejected, []);

console.log('EA Modular Assembly Run 2 OK');
console.log(' - certified core is always assembled');
console.log(' - duplicate requests are normalized');
console.log(' - unknown modules fail closed');
console.log(' - inventoried but uncertified modules fail closed');
console.log(' - provisioning callers can require a zero-rejection plan');

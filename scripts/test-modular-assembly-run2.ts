import assert from 'node:assert/strict';
import capabilityInventory from '../config/capability-inventory.json';
import capabilityCertifications from '../config/capability-certifications.json';
import { createAssemblyPlan, requireAssemblyPlan } from '../lib/modules/assembly';

const coreOnly = createAssemblyPlan([]);
assert.deepEqual(coreOnly.admitted, ['dashboard', 'amplifi', 'update-hub']);
assert.equal(coreOnly.blocked, false);

const duplicateCore = createAssemblyPlan(['amplifi', 'amplifi']);
assert.deepEqual(duplicateCore.admitted, ['dashboard', 'amplifi', 'update-hub']);
assert.equal(duplicateCore.blocked, false);

// Run 2 established the fail-closed rule, not a permanent ban on any specific
// business capability. Later runs may legitimately certify known modules.
const certifiedLater = new Set(
  capabilityCertifications.certifications.map((item) => item.id),
);
const stillUncertified = capabilityInventory.modules.find(
  (item) => item.assemblyStatus !== 'certified' && !certifiedLater.has(item.id),
);
if (stillUncertified) {
  const plan = createAssemblyPlan([stillUncertified.id]);
  assert.equal(plan.blocked, true);
  assert.ok(plan.rejected.some((item) =>
    item.id === stillUncertified.id &&
    item.reason === 'not-certified' &&
    item.status === stillUncertified.assemblyStatus
  ));
  assert.throws(
    () => requireAssemblyPlan([stillUncertified.id]),
    new RegExp(`${stillUncertified.id}:not-certified`),
  );
}

const unknown = createAssemblyPlan(['not-a-real-module']);
assert.equal(unknown.blocked, true);
assert.ok(unknown.rejected.some((item) => item.id === 'not-a-real-module' && item.reason === 'unknown-module'));
assert.throws(
  () => requireAssemblyPlan(['not-a-real-module']),
  /not-a-real-module:unknown-module/,
);

assert.doesNotThrow(() => requireAssemblyPlan(['dashboard', 'amplifi', 'update-hub']));

console.log('EA Modular Assembly Run 2 OK');
console.log(' - exact-certified chassis is admitted');
console.log(' - duplicate requests are normalized');
console.log(' - unknown modules fail closed');
console.log(' - any currently uncertified known module remains fail-closed');
console.log(' - later certification does not invalidate the Run 2 engine contract');

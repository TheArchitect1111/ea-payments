import assert from 'node:assert/strict';
import capabilityInventory from '../config/capability-inventory.json';
import capabilityCertifications from '../config/capability-certifications.json';
import { createAssemblyPlan, requireAssemblyPlan } from '../lib/modules/assembly';

const coreOnly = createAssemblyPlan([]);
assert.deepEqual(coreOnly.admitted, []);
assert.equal(coreOnly.blocked, true);
assert.ok(coreOnly.rejected.every((x) => x.reason === 'missing-10-class-certificate'));

const duplicateCore = createAssemblyPlan(['amplifi', 'amplifi']);
assert.deepEqual(duplicateCore.admitted, []);
assert.equal(duplicateCore.blocked, true);

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
assert.deepEqual(unknown.rejected, [
  { id: 'not-a-real-module', reason: 'unknown-module' },
]);
assert.throws(
  () => requireAssemblyPlan(['not-a-real-module']),
  /EA assembly blocked: not-a-real-module:unknown-module/,
);

assert.throws(() => requireAssemblyPlan(['dashboard', 'amplifi', 'update-hub']), /missing-10-class-certificate/);

console.log('EA Modular Assembly Run 2 OK');
console.log(' - chassis is fail-closed until exact 10-class certificates exist');
console.log(' - duplicate requests are normalized');
console.log(' - unknown modules fail closed');
console.log(' - any currently uncertified known module remains fail-closed');
console.log(' - later certification does not invalidate the Run 2 engine contract');

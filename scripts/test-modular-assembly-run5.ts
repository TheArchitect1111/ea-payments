import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildAssemblyEvidenceReceipt } from '../lib/modules/assembly-evidence';
import { requireClientFactoryAssembly } from '../lib/modules/client-factory-assembly';

const packagePurchased = 'Website + Portal Starter';
const plan = requireClientFactoryAssembly({ packagePurchased });
assert.equal(plan.blocked, false);
assert.equal(plan.rejected.length, 0);

const fixedTime = '2026-09-12T20:00:00.000Z';
const receiptA = buildAssemblyEvidenceReceipt({
  portalSlug: 'run5-proof',
  organizationId: 'org_run5',
  packagePurchased,
  plan,
  certificationRun: 6,
  recordedAt: fixedTime,
});
const receiptB = buildAssemblyEvidenceReceipt({
  portalSlug: 'run5-proof',
  organizationId: 'org_run5',
  packagePurchased,
  plan,
  certificationRun: 6,
  recordedAt: fixedTime,
});

assert.equal(receiptA.mode, 'certified');
assert.equal(receiptA.fingerprint, receiptB.fingerprint, 'same assembly must produce deterministic evidence');
assert.equal(receiptA.fingerprint.length, 64);
assert.deepEqual(receiptA.admitted, plan.admitted);
assert.equal(receiptA.packagePurchased, packagePurchased);

const changed = buildAssemblyEvidenceReceipt({
  portalSlug: 'run5-proof',
  organizationId: 'org_run5',
  packagePurchased: 'Different Package',
  plan,
  certificationRun: 6,
  recordedAt: fixedTime,
});
assert.notEqual(changed.fingerprint, receiptA.fingerprint, 'material assembly changes must change the fingerprint');

const foundationSource = readFileSync('lib/tenant-foundation.ts', 'utf8');
assert.match(foundationSource, /Website \+ Portal Starter' \? 'certified' : 'legacy'/);
assert.match(foundationSource, /persistAssemblyEvidenceReceipt/);
assert.match(foundationSource, /if \(assemblyMode === 'certified'\) throw err/);

console.log('EA Modular Assembly Run 5 prerequisite OK');
console.log(' - Starter provisioning defaults to certified assembly');
console.log(' - certified entitlement failures fail closed');
console.log(' - durable evidence receipts are deterministic and fingerprinted');

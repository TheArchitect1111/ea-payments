import assert from 'node:assert/strict';
import {
  evaluateAssetIntegrity,
  evaluateVisualFidelity,
} from '../lib/factory-build-verification-gates.mjs';
import {
  createExecutionContract,
  executionContractAllowsDelivery,
} from '../lib/factory-execution-contract.mjs';

const at = '2026-08-22T12:00:00.000Z';
const workOrder = {
  id: 'wo-verification-test',
  projectId: 'project-test',
  type: 'website',
  title: 'Verification test',
  acceptanceCriteria: ['Use approved hero', 'Keep classes on page'],
  payload: {
    requiredAssets: [
      { id: 'hero', path: '/hero.png', role: 'hero' },
      { id: 'logo', path: '/logo.png', role: 'logo' },
    ],
    protectedSections: ['story', 'portal'],
    allowedChanges: ['hero', 'classes', 'logo'],
  },
  provenance: { sourceArtifactIds: [] },
};

const contract = createExecutionContract(workOrder, at);
assert.equal(contract.immutableRules.assetIntegrityRequired, true);
assert.equal(contract.immutableRules.visualFidelityRequired, true);
assert.deepEqual(contract.protectedSections, ['story', 'portal']);

const failedAssets = evaluateAssetIntegrity({
  requiredAssets: contract.requiredAssets,
  observedAssets: [
    { id: 'hero', exists: true, resolves: true, renders: true },
    { id: 'logo', exists: true, resolves: true, renders: false },
  ],
  at,
});
assert.equal(failedAssets.status, 'failed');
assert.equal(failedAssets.deliveryAllowed, false);
assert.deepEqual(failedAssets.failedRequiredIds, ['logo']);

const passedAssets = evaluateAssetIntegrity({
  requiredAssets: contract.requiredAssets,
  observedAssets: [
    { id: 'hero', exists: true, resolves: true, renders: true },
    { id: 'logo', exists: true, resolves: true, renders: true },
  ],
  at,
});
assert.equal(passedAssets.status, 'passed');

const failedVisual = evaluateVisualFidelity({
  requirements: contract.requirements,
  protectedSections: contract.protectedSections,
  observedRequirements: contract.requirements.map((item) => ({ id: item.id, passed: true })),
  observedSections: [
    { id: 'story', present: true, unchanged: true },
    { id: 'portal', present: true, unchanged: false },
  ],
  visualChecks: {
    mobileRender: true,
    desktopRender: true,
    noBrokenImages: true,
    noOverflow: true,
    noUnexplainedBlankSpace: true,
    facesUnobstructedWhenRequired: true,
  },
  at,
});
assert.equal(failedVisual.status, 'failed');
assert.equal(failedVisual.deliveryAllowed, false);
assert.ok(failedVisual.failedRequiredIds.includes('protected:portal'));

const passedVisual = evaluateVisualFidelity({
  requirements: contract.requirements,
  protectedSections: contract.protectedSections,
  observedRequirements: contract.requirements.map((item) => ({ id: item.id, passed: true })),
  observedSections: [
    { id: 'story', present: true, unchanged: true },
    { id: 'portal', present: true, unchanged: true },
  ],
  visualChecks: {
    mobileRender: true,
    desktopRender: true,
    noBrokenImages: true,
    noOverflow: true,
    noUnexplainedBlankSpace: true,
    facesUnobstructedWhenRequired: true,
  },
  at,
});
assert.equal(passedVisual.status, 'passed');

const executionVerification = {
  contractId: contract.id,
  status: 'passed',
  deliveryAllowed: true,
};
assert.equal(executionContractAllowsDelivery(contract, executionVerification, {
  assetIntegrity: passedAssets,
  visualFidelity: passedVisual,
}), true);
assert.equal(executionContractAllowsDelivery(contract, executionVerification, {
  assetIntegrity: failedAssets,
  visualFidelity: passedVisual,
}), false);

console.log('factory build verification gates: PASS');

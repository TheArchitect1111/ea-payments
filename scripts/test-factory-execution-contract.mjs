import assert from 'node:assert/strict';

import {
  createExecutionContract,
  evaluateExecutionContract,
  executionContractAllowsDelivery,
  wrapBuilderWithExecutionContract,
} from '../lib/factory-execution-contract.mjs';
import { reviewGatesAllowPublish } from '../lib/factory-review-gate.mjs';

const workOrder = {
  id: 'workorder-website-joe',
  projectId: 'project-joe',
  type: 'website',
  title: 'Joe Smith website update',
  acceptanceCriteria: ['Use the approved logo', 'Show all classes on the homepage'],
  payload: {
    executionRequirements: [
      {
        id: 'logo',
        label: 'Use the exact approved Joe Smith logo',
        verification: 'visual',
      },
      {
        id: 'classes',
        label: 'Render all approved classes directly on the homepage',
        verification: 'dom_and_visual',
      },
    ],
  },
  provenance: {
    capabilityId: 'planning',
    sourceArtifactIds: ['artifact-discovery-joe'],
    seedClient: 'Joe Smith Basketball Academy',
  },
};

const contract = createExecutionContract(workOrder, '2026-08-22T10:00:00.000Z');
assert.equal(contract.immutableRules.diffOnly, true);
assert.equal(contract.immutableRules.noScopeCreep, true);
assert.equal(contract.immutableRules.noSubstitutionsWithoutApproval, true);
assert.equal(contract.immutableRules.deliveryBlockedUntilPassed, true);
assert.deepEqual(contract.requirements.map((r) => r.id), ['logo', 'classes']);

const failed = evaluateExecutionContract(contract, [
  { id: 'logo', passed: true, evidence: 'header screenshot' },
  { id: 'classes', passed: false, evidence: 'homepage missing class list' },
]);
assert.equal(failed.status, 'failed');
assert.equal(failed.deliveryAllowed, false);
assert.deepEqual(failed.failedRequiredIds, ['classes']);
assert.equal(executionContractAllowsDelivery(contract, failed), false);

const passed = evaluateExecutionContract(contract, [
  { id: 'logo', passed: true, evidence: 'header screenshot' },
  { id: 'classes', passed: true, evidence: 'homepage screenshot + DOM count' },
]);
assert.equal(passed.status, 'passed');
assert.equal(passed.deliveryAllowed, true);
assert.equal(executionContractAllowsDelivery(contract, passed), true);

const fakeBuilder = {
  id: 'fake',
  workOrderType: 'website',
  canBuild: () => true,
  build: () => ({
    ok: true,
    drafts: [],
    reviewGates: [],
    deliverable: { id: 'deliverable-1' },
    metrics: { reviewGatesCreated: 0 },
  }),
};

const wrapped = wrapBuilderWithExecutionContract(fakeBuilder);
const result = wrapped.build(workOrder, {}, '2026-08-22T10:00:00.000Z');
assert.equal(result.ok, true);
assert.equal(result.deliveryBlocked, true);
assert.equal(result.deliveryBlockReason, 'execution_verification_pending');
assert.equal(result.reviewGates.length, 1);
assert.equal(result.reviewGates[0].gateId, 'execution-verification');
assert.equal(result.reviewGates[0].required, true);
assert.equal(result.reviewGates[0].status, 'pending');
assert.equal(result.drafts.some((d) => d.kind === 'execution_contract'), true);

const pendingGuard = reviewGatesAllowPublish(result.reviewGates);
assert.equal(pendingGuard.ok, false);
assert.equal(pendingGuard.blockers[0].gateId, 'execution-verification');

const failedGuard = reviewGatesAllowPublish([
  { ...result.reviewGates[0], status: 'failed' },
]);
assert.equal(failedGuard.ok, false);

const passedGuard = reviewGatesAllowPublish([
  { ...result.reviewGates[0], status: 'passed' },
]);
assert.equal(passedGuard.ok, true);

console.log('factory execution contract: PASS');

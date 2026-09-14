import assert from 'node:assert/strict';
import { TEMPORAL_INVARIANTS, type DurableExecutionRequest } from '../lib/execution/temporal-boundary';
import {
  OPENHANDS_RUN1_POLICY,
  assertOpenHandsRun1TaskSafe,
  type OpenHandsEngineeringTask,
} from '../lib/execution/openhands-worker-boundary';

assert.ok(TEMPORAL_INVARIANTS.includes('OPA remains authoritative for advancement policy'));
assert.ok(TEMPORAL_INVARIANTS.includes('EA gate evidence remains authoritative for pass/fail'));
assert.ok(TEMPORAL_INVARIANTS.includes('COMPLETE requires authoritative EA verification'));

const durableRequest: DurableExecutionRequest = {
  executionId: 'exec-run1-test',
  projectId: 'proj-run1-test',
  clientId: 'client-run1-test',
  approvedIntentId: 'intent-run1-test',
  riskTier: 'AUTO_VERIFY',
  rollbackTarget: 'commit-known-good',
};
assert.equal(durableRequest.riskTier, 'AUTO_VERIFY');
assert.ok(durableRequest.rollbackTarget);

assert.equal(OPENHANDS_RUN1_POLICY.productionAuthority, false);
assert.equal(OPENHANDS_RUN1_POLICY.mergeAuthority, false);
assert.equal(OPENHANDS_RUN1_POLICY.deployAuthority, false);
assert.equal(OPENHANDS_RUN1_POLICY.directMasterWrite, false);

const safeTask: OpenHandsEngineeringTask = {
  executionId: 'exec-run1-test',
  projectId: 'proj-run1-test',
  clientId: 'client-run1-test',
  repository: 'TheArchitect1111/ea-payments',
  baseRef: 'known-good',
  task: 'Repair a scoped regression',
  allowedPaths: ['app/example/page.tsx'],
  forbiddenPaths: ['.github/workflows/production.yml'],
  acceptanceCriteria: ['existing tests pass', 'no unauthorized visual change'],
  rollbackTarget: 'known-good',
  mode: 'PATCH_ONLY',
};
assert.doesNotThrow(() => assertOpenHandsRun1TaskSafe(safeTask));

assert.throws(() => assertOpenHandsRun1TaskSafe({ ...safeTask, rollbackTarget: '' }), /rollback target/i);
assert.throws(() => assertOpenHandsRun1TaskSafe({ ...safeTask, allowedPaths: [] }), /allowed path scope/i);
assert.throws(() => assertOpenHandsRun1TaskSafe({ ...safeTask, acceptanceCriteria: [] }), /acceptance criteria/i);
assert.throws(
  () => assertOpenHandsRun1TaskSafe({ ...safeTask, allowedPaths: ['x'], forbiddenPaths: ['x'] }),
  /conflicts with forbidden/i,
);

console.log('EA Stability Run 1 durable execution + OpenHands boundary: PASS');

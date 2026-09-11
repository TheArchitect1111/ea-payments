import assert from 'node:assert/strict';
import { runRecoveryOrchestrator, type RecoveryActionAdapter, type RecoveryVerifier } from '../lib/recovery/orchestrator';
import type { RecoveryAuthority, RecoverySignal, RecoveryVerification } from '../lib/recovery/types';

const authority: RecoveryAuthority = {
  target: 'Certification Client',
  productionUrl: 'https://example.test',
  infrastructureState: 'Resolved',
  approvalState: 'Verified',
  changeAuthorization: 'Approved',
  approvedBaseline: 'Verified',
  rollbackTarget: 'Known',
  clientIsolation: 'Dedicated Client',
  monitoringGate: 'Verified',
  releaseReadiness: 'Ready',
  automationPermission: 'Auto Repair Allowed',
};

const signal = (failureClass: RecoverySignal['failureClass']): RecoverySignal => ({
  target: authority.target,
  failureClass,
  source: 'synthetic',
  summary: `Run 3 certification: ${failureClass}`,
  route: '/',
});

const evidenceRecorder = async () => true;
const verification = (ok: boolean, detail: string): RecoveryVerification => ({ ok, status: ok ? 200 : 503, route: '/', detail });

async function caseSuccessfulRepair() {
  const actions: string[] = [];
  const adapter: RecoveryActionAdapter = async ({ action }) => { actions.push(action); return { mutated: true, detail: 'sandbox repair applied' }; };
  const verifier: RecoveryVerifier = async () => verification(true, 'sandbox healthy after repair');
  const out = await runRecoveryOrchestrator({ signal: signal('asset_missing'), mode: 'execute', adapter, rollbackAdapter: adapter, verifier, authorityOverride: authority, evidenceRecorder });
  assert.equal(out.decision.disposition, 'auto_repair');
  assert.equal(out.execution.mutated, true);
  assert.equal(out.verification.ok, true);
  assert.equal(out.rollback, undefined);
  assert.deepEqual(actions, ['restore_approved_asset']);
}

async function caseFailedRepairRollsBack() {
  const actions: string[] = [];
  let verifyCount = 0;
  const adapter: RecoveryActionAdapter = async ({ action }) => { actions.push(action); return { mutated: true, detail: `sandbox ${action} applied` }; };
  const verifier: RecoveryVerifier = async () => {
    verifyCount += 1;
    return verifyCount === 1 ? verification(false, 'repair verification failed') : verification(true, 'rollback restored health');
  };
  const out = await runRecoveryOrchestrator({ signal: signal('configuration_drift'), mode: 'execute', adapter, rollbackAdapter: adapter, verifier, authorityOverride: authority, evidenceRecorder });
  assert.equal(out.execution.mutated, true);
  assert.equal(out.repairVerification?.ok, false);
  assert.equal(out.rollback?.attempted, true);
  assert.equal(out.rollback?.mutated, true);
  assert.equal(out.rollbackVerification?.ok, true);
  assert.equal(out.verification.ok, true);
  assert.deepEqual(actions, ['restore_approved_configuration', 'restore_known_rollback']);
}

async function caseRollbackFailureRemainsUnhealthy() {
  let verifyCount = 0;
  const repair: RecoveryActionAdapter = async () => ({ mutated: true, detail: 'sandbox repair applied' });
  const rollback: RecoveryActionAdapter = async () => ({ mutated: false, detail: 'sandbox rollback refused' });
  const verifier: RecoveryVerifier = async () => { verifyCount += 1; return verification(false, `still unhealthy ${verifyCount}`); };
  const out = await runRecoveryOrchestrator({ signal: signal('route_unhealthy'), mode: 'execute', adapter: repair, rollbackAdapter: rollback, verifier, authorityOverride: authority, evidenceRecorder });
  assert.equal(out.execution.mutated, true);
  assert.equal(out.repairVerification?.ok, false);
  assert.equal(out.rollback?.attempted, true);
  assert.equal(out.rollback?.mutated, false);
  assert.equal(out.verification.ok, false);
}

async function caseProviderEscalates() {
  let called = false;
  const adapter: RecoveryActionAdapter = async () => { called = true; return { mutated: true, detail: 'should never run' }; };
  const verifier: RecoveryVerifier = async () => verification(false, 'provider unavailable');
  const out = await runRecoveryOrchestrator({ signal: signal('provider_unavailable'), mode: 'execute', adapter, rollbackAdapter: adapter, verifier, authorityOverride: authority, evidenceRecorder });
  assert.equal(out.decision.disposition, 'escalate');
  assert.equal(out.execution.attempted, false);
  assert.equal(called, false);
}

async function caseSharedPlatformFailsClosed() {
  let called = false;
  const adapter: RecoveryActionAdapter = async () => { called = true; return { mutated: true, detail: 'should never run' }; };
  const verifier: RecoveryVerifier = async () => verification(true, 'shared platform remains untouched');
  const out = await runRecoveryOrchestrator({ signal: signal('deployment_drift'), mode: 'execute', adapter, rollbackAdapter: adapter, verifier, authorityOverride: { ...authority, clientIsolation: 'Shared Platform' }, evidenceRecorder });
  assert.equal(out.decision.safeToMutate, false);
  assert.equal(out.execution.attempted, false);
  assert.equal(called, false);
}

async function caseExecutionFlagFailsClosed() {
  const previous = process.env.EA_RECOVERY_EXECUTION_ENABLED;
  delete process.env.EA_RECOVERY_EXECUTION_ENABLED;
  let called = false;
  const adapter: RecoveryActionAdapter = async () => { called = true; return { mutated: true, detail: 'should never run' }; };
  const verifier: RecoveryVerifier = async () => verification(true, 'service healthy');
  const out = await runRecoveryOrchestrator({ signal: signal('asset_missing'), mode: 'execute', adapter, rollbackAdapter: adapter, verifier, authorityOverride: authority, evidenceRecorder });
  assert.equal(out.execution.attempted, false);
  assert.match(out.execution.detail, /EA_RECOVERY_EXECUTION_ENABLED/);
  assert.equal(called, false);
  if (previous === undefined) delete process.env.EA_RECOVERY_EXECUTION_ENABLED;
  else process.env.EA_RECOVERY_EXECUTION_ENABLED = previous;
}

async function main() {
  const previous = process.env.EA_RECOVERY_EXECUTION_ENABLED;
  process.env.EA_RECOVERY_EXECUTION_ENABLED = 'true';
  try {
    await caseSuccessfulRepair();
    await caseFailedRepairRollsBack();
    await caseRollbackFailureRemainsUnhealthy();
    await caseProviderEscalates();
    await caseSharedPlatformFailsClosed();
    await caseExecutionFlagFailsClosed();
    console.log('Recovery Orchestrator Run 3 certification: PASS');
  } finally {
    if (previous === undefined) delete process.env.EA_RECOVERY_EXECUTION_ENABLED;
    else process.env.EA_RECOVERY_EXECUTION_ENABLED = previous;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

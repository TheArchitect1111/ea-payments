import assert from 'node:assert/strict';
import { decideRecovery } from '../lib/recovery/policy';
import type { RecoveryAuthority, RecoverySignal } from '../lib/recovery/types';

const authority: RecoveryAuthority = {
  target: 'Safe Client',
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
  target: 'Safe Client', failureClass, source: 'synthetic', summary: 'contract test',
});

assert.equal(decideRecovery(signal('route_unhealthy'), authority).disposition, 'auto_repair');
assert.equal(decideRecovery(signal('deployment_drift'), authority).action, 'restore_known_rollback');
assert.equal(decideRecovery(signal('asset_missing'), authority).action, 'restore_approved_asset');
assert.equal(decideRecovery(signal('configuration_drift'), authority).action, 'restore_approved_configuration');
assert.equal(decideRecovery(signal('provider_unavailable'), authority).disposition, 'escalate');
assert.equal(decideRecovery(signal('unknown'), authority).disposition, 'escalate');
assert.equal(decideRecovery(signal('route_unhealthy'), null).disposition, 'blocked');
assert.equal(decideRecovery(signal('route_unhealthy'), { ...authority, clientIsolation: 'Shared Platform' }).disposition, 'escalate');
assert.equal(decideRecovery(signal('route_unhealthy'), { ...authority, rollbackTarget: 'Needs Mapping' }).disposition, 'escalate');
assert.equal(decideRecovery(signal('route_unhealthy'), { ...authority, automationPermission: 'Human Approval Required' }).safeToMutate, false);

console.log('Recovery Orchestrator safety contract: PASS');

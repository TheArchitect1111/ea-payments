import type { RecoveryActionId, RecoveryAuthority, RecoveryDecision, RecoverySignal } from './types';

const AUTOMATION_APPROVALS = new Set(['Approved', 'Auto Repair Allowed', 'Automated Repair Allowed']);
const APPROVED_STATES = new Set(['Current Approved', 'Verified']);

function actionFor(signal: RecoverySignal): RecoveryActionId | undefined {
  switch (signal.failureClass) {
    case 'route_unhealthy': return 'restore_known_rollback';
    case 'deployment_drift': return 'restore_known_rollback';
    case 'asset_missing': return 'restore_approved_asset';
    case 'configuration_drift': return 'restore_approved_configuration';
    default: return undefined;
  }
}

export function decideRecovery(signal: RecoverySignal, authority: RecoveryAuthority | null): RecoveryDecision {
  const reasons: string[] = [];
  const action = actionFor(signal);

  if (signal.failureClass === 'provider_unavailable') {
    return { disposition: 'escalate', reasons: ['Provider, credential, quota, or billing failures require owner/account intervention.'], authority, safeToMutate: false };
  }
  if (signal.failureClass === 'unknown' || !action) {
    return { disposition: 'escalate', reasons: ['Failure class is not mapped to an approved deterministic repair.'], authority, safeToMutate: false };
  }
  if (!authority) {
    return { disposition: 'blocked', action, reasons: ['Canonical Control Plane authority could not be resolved.'], authority: null, safeToMutate: false };
  }

  if (authority.infrastructureState !== 'Resolved') reasons.push(`Infrastructure State is ${authority.infrastructureState ?? 'unset'}, not Resolved.`);
  if (!authority.approvalState || !APPROVED_STATES.has(authority.approvalState)) reasons.push(`Approval State is ${authority.approvalState ?? 'unset'}, not approved.`);
  if (authority.changeAuthorization !== 'Approved') reasons.push(`Change Authorization is ${authority.changeAuthorization ?? 'unset'}, not Approved.`);
  if (authority.approvedBaseline !== 'Verified') reasons.push(`Approved Baseline is ${authority.approvedBaseline ?? 'unset'}, not Verified.`);
  if (authority.rollbackTarget !== 'Known') reasons.push(`Rollback Target is ${authority.rollbackTarget ?? 'unset'}, not Known.`);
  if (!authority.clientIsolation || /shared/i.test(authority.clientIsolation)) reasons.push(`Client isolation is ${authority.clientIsolation ?? 'unset'}; shared-platform mutation is not autonomous-safe.`);
  if (authority.monitoringGate !== 'Verified') reasons.push(`Monitoring Gate is ${authority.monitoringGate ?? 'unset'}, not Verified.`);
  if (authority.releaseReadiness !== 'Ready') reasons.push(`Release Readiness is ${authority.releaseReadiness ?? 'unset'}, not Ready.`);
  if (!authority.automationPermission || !AUTOMATION_APPROVALS.has(authority.automationPermission)) reasons.push(`Automation Permission is ${authority.automationPermission ?? 'unset'}, not explicitly approved for auto-repair.`);

  if (reasons.length) return { disposition: 'escalate', action, reasons, authority, safeToMutate: false };
  return { disposition: 'auto_repair', action, reasons: ['All canonical safety gates passed and the repair action is allowlisted.'], authority, safeToMutate: true };
}

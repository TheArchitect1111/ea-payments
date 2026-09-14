export type EATelemetrySignal = 'trace' | 'metric' | 'log';

export type EAOperationalEvent = {
  eventId: string;
  tenantId: string;
  projectId: string;
  releaseId?: string;
  workflowId?: string;
  signal: EATelemetrySignal;
  stage: 'REQUEST' | 'BUILD' | 'VERIFY' | 'RELEASE' | 'PRODUCTION' | 'RECOVERY';
  outcome: 'STARTED' | 'PASSED' | 'FAILED' | 'BLOCKED' | 'ROLLED_BACK';
  occurredAt: string;
  evidenceRefs: string[];
};

export type EAReleaseControl = {
  flagKey: string;
  tenantId: string;
  environment: 'preview' | 'production';
  mode: 'OFF' | 'INTERNAL' | 'CANARY' | 'FULL' | 'KILL_SWITCH';
  rolloutPercentage: number;
  rollbackTarget: string;
  approvedBy?: string;
};

export type EAExternalAutomationEnvelope = {
  connector: 'ACTIVEPIECES';
  tenantId: string;
  projectId: string;
  action: string;
  correlationId: string;
  idempotencyKey: string;
  requestedAt: string;
  allowedCapabilities: string[];
};

export function validateOperationalEvent(event: EAOperationalEvent): string[] {
  const failures: string[] = [];
  if (!event.eventId) failures.push('eventId required');
  if (!event.tenantId) failures.push('tenantId required');
  if (!event.projectId) failures.push('projectId required');
  if (!event.occurredAt) failures.push('occurredAt required');
  if (!event.evidenceRefs.length) failures.push('evidence required');
  return failures;
}

export function validateReleaseControl(control: EAReleaseControl): string[] {
  const failures: string[] = [];
  if (!control.flagKey) failures.push('flagKey required');
  if (!control.tenantId) failures.push('tenantId required');
  if (!control.rollbackTarget) failures.push('rollbackTarget required');
  if (control.rolloutPercentage < 0 || control.rolloutPercentage > 100) failures.push('rolloutPercentage must be 0..100');
  if (control.mode === 'OFF' || control.mode === 'KILL_SWITCH') {
    if (control.rolloutPercentage !== 0) failures.push(`${control.mode} requires 0% rollout`);
  }
  if (control.mode === 'FULL' && control.rolloutPercentage !== 100) failures.push('FULL requires 100% rollout');
  if (control.environment === 'production' && !control.approvedBy) failures.push('production release requires approval identity');
  return failures;
}

export function validateExternalAutomationEnvelope(envelope: EAExternalAutomationEnvelope): string[] {
  const failures: string[] = [];
  if (envelope.connector !== 'ACTIVEPIECES') failures.push('unsupported connector');
  if (!envelope.tenantId) failures.push('tenantId required');
  if (!envelope.projectId) failures.push('projectId required');
  if (!envelope.action) failures.push('action required');
  if (!envelope.correlationId) failures.push('correlationId required');
  if (!envelope.idempotencyKey) failures.push('idempotencyKey required');
  if (!envelope.requestedAt) failures.push('requestedAt required');
  if (!envelope.allowedCapabilities.length) failures.push('allowedCapabilities required');
  return failures;
}

export const EA_RUN3_INVARIANTS = Object.freeze([
  'every production action is tenant and project scoped',
  'every release has a known rollback target',
  'production feature changes require an approval identity',
  'kill switches fail closed at zero percent rollout',
  'telemetry carries durable evidence references',
  'external automations carry correlation and idempotency keys',
  'external connectors receive explicit capability allowlists',
  'observability does not grant deployment authority',
]);

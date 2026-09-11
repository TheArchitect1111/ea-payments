export type RecoveryFailureClass = 'route_unhealthy' | 'deployment_drift' | 'asset_missing' | 'configuration_drift' | 'provider_unavailable' | 'unknown';
export type RecoveryActionId = 'verify_only' | 'restore_known_rollback' | 'restore_approved_asset' | 'restore_approved_configuration';
export type RecoveryDisposition = 'auto_repair' | 'escalate' | 'blocked';
export type RecoveryRunMode = 'dry_run' | 'execute';

export type RecoverySignal = {
  target: string;
  failureClass: RecoveryFailureClass;
  source: 'monitoring' | 'runtime' | 'synthetic' | 'admin' | 'production_guard';
  summary: string;
  route?: string;
  observedCommit?: string;
  observedValue?: string;
  expectedValue?: string;
  metadata?: Record<string, unknown>;
};

export type RecoveryAuthority = {
  target: string;
  manifestRecordId?: string;
  governanceRecordId?: string;
  productionUrl?: string;
  portalUrl?: string;
  githubRepo?: string;
  infrastructureState?: string;
  approvalState?: string;
  changeAuthorization?: string;
  approvedBaseline?: string;
  rollbackTarget?: string;
  clientIsolation?: string;
  monitoringGate?: string;
  releaseReadiness?: string;
  automationPermission?: string;
};

export type RecoveryDecision = { disposition: RecoveryDisposition; action?: RecoveryActionId; reasons: string[]; authority: RecoveryAuthority | null; safeToMutate: boolean };
export type RecoveryVerification = { ok: boolean; status?: number; route?: string; detail: string };
export type RecoveryExecution = { attempted: boolean; mutated: boolean; action?: RecoveryActionId; detail: string };
export type RecoveryOutcome = { runId: string; mode: RecoveryRunMode; signal: RecoverySignal; decision: RecoveryDecision; execution: RecoveryExecution; verification: RecoveryVerification; evidenceRecorded: boolean; startedAt: string; completedAt: string };

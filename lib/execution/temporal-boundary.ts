export type EAExecutionStage =
  | 'INTAKE'
  | 'CONTEXT_LOCK'
  | 'MANIFEST'
  | 'PLAN'
  | 'EXECUTE'
  | 'GATE'
  | 'REPAIR'
  | 'VERIFY'
  | 'COMPLETE'
  | 'BLOCKED'
  | 'ROLLED_BACK';

export type DurableExecutionRequest = {
  executionId: string;
  projectId: string;
  clientId: string;
  approvedIntentId: string;
  riskTier: 'SAFE_AUTO' | 'AUTO_VERIFY' | 'OWNER_APPROVAL' | 'CLIENT_APPROVAL' | 'BLOCKED';
  rollbackTarget: string | null;
  requestedStage?: EAExecutionStage;
};

export type DurableExecutionEvidence = {
  executionId: string;
  stage: EAExecutionStage;
  attempt: number;
  startedAt: string;
  completedAt?: string;
  gateStatus?: 'PASS' | 'FAIL' | 'PENDING';
  evidenceRefs: string[];
  repairRoute?: string;
};

export interface TemporalExecutionBoundary {
  /**
   * Starts or resumes one EA execution. The Temporal implementation owns durable
   * workflow state and retries only. It does not own EA business policy.
   */
  startOrResume(request: DurableExecutionRequest): Promise<{ workflowId: string; runId?: string }>;

  /** Returns durable state without declaring EA completion. */
  getState(workflowId: string): Promise<DurableExecutionEvidence>;

  /** Signals approved cancellation/rollback intent to the durable workflow. */
  signal(workflowId: string, signal: 'CANCEL' | 'ROLLBACK' | 'RETRY_GATE'): Promise<void>;
}

/**
 * Hard architectural invariants for the eventual Temporal adapter.
 *
 * Temporal may:
 * - preserve workflow state across worker/process failure;
 * - retry idempotent EA activities;
 * - wait for approvals/signals;
 * - resume from the last durable workflow state.
 *
 * Temporal may not:
 * - bypass OPA;
 * - synthesize PASS evidence;
 * - change tenant scope;
 * - mark COMPLETE from deployment/HTTP success alone;
 * - mutate production without approved intent and a valid rollback policy.
 */
export const TEMPORAL_INVARIANTS = Object.freeze([
  'OPA remains authoritative for advancement policy',
  'EA gate evidence remains authoritative for pass/fail',
  'ProjectContext remains authoritative project execution context',
  'CapabilityRegistry remains authoritative capability router',
  'Temporal owns durable state and retries, not business truth',
  'COMPLETE requires authoritative EA verification',
]);

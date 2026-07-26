/**
 * Phase 2B durable job models (blueprint §3.1, §10.1, §10.2).
 * Job rows are org-bound at creation from the session slug (INV-1 / ADV-P-8).
 */
import type { PersonId } from '@/lib/people/types';

export type PeopleMergeJobStatus =
  | 'queued'
  | 'locking'
  | 'copying'
  | 'rewriting'
  | 'finalizing'
  | 'completed'
  | 'failed'
  | 'retryable';

/** Ordered stages — `finalizing` is the destructive boundary (INV-21). */
export const PEOPLE_MERGE_STAGES: readonly PeopleMergeJobStatus[] = [
  'queued',
  'locking',
  'copying',
  'rewriting',
  'finalizing',
  'completed',
] as const;

export type PeopleMergeStepName =
  | 'validate'
  | 'lock'
  | 'copy_directory'
  | 'rewrite_graph'
  | 'move_external_ids'
  | 'finalize';

export const PEOPLE_MERGE_STEP_ORDER: readonly PeopleMergeStepName[] = [
  'validate',
  'lock',
  'copy_directory',
  'rewrite_graph',
  'move_external_ids',
  'finalize',
] as const;

export type PeopleMergeJob = {
  id: string;
  organizationId: string;
  /** `org#absorbedPersonKey` — one active/completed survivor mapping (§9.1). */
  jobKey: string;
  survivorPersonId: PersonId;
  absorbedPersonId: PersonId;
  status: PeopleMergeJobStatus;
  completedSteps: PeopleMergeStepName[];
  attempts: number;
  actorEmail: string;
  lastError?: string;
  /** Redacted only (INV-25). */
  meta?: Record<string, string | number | boolean | null>;
  createdAt: string;
  updatedAt: string;
};

export type PeopleImportJobStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'retryable'
  | 'failed_rate_limit';

export type PeopleImportJobSource =
  | 'staff-import'
  | 'client-record-backfill'
  | 'provisioning';

export type PeopleImportJob = {
  id: string;
  organizationId: string;
  /** Unique per org (§9.1) — client supplied or derived hash. */
  idempotencyKey: string;
  source: PeopleImportJobSource;
  status: PeopleImportJobStatus;
  rowCount: number;
  okCount: number;
  failedCount: number;
  actorEmail: string;
  dryRun?: boolean;
  lastError?: string;
  meta?: Record<string, string | number | boolean | null>;
  createdAt: string;
  updatedAt: string;
};

export type PeopleImportRowResult = {
  id: string;
  organizationId: string;
  importJobId: string;
  rowNumber: number;
  /** `importJobId#rowNumber` — retrying a job skips `ok` rows (§10.2). */
  rowKey: string;
  status: 'ok' | 'failed' | 'skipped';
  personId?: PersonId;
  /** Redacted error text only. */
  error?: string;
  createdAt: string;
};

export type PeopleMigrationCheckpoint = {
  id: string;
  organizationId: string;
  jobId: string;
  checkpointKey: string;
  lastClientRecordId?: string;
  processed: number;
  created: number;
  linked: number;
  status: 'running' | 'completed' | 'failed';
  updatedAt: string;
};

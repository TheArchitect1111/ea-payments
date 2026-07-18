/**
 * Durable Factory Project records — Creative Studio media + memory list.
 */
import {
  listStudioRecords,
  loadStudioRecord,
  saveStudioRecord,
} from '@/lib/creative-studio/persistence';

export type FactoryPipelineStatus =
  | 'CREATED'
  | 'QUEUED'
  | 'GENERATING'
  | 'INTAKE'
  | 'INTAKE_COMPLETE'
  | 'RESEARCHING'
  | 'DISCOVERING'
  | 'PLANNING'
  | 'BUILDING'
  | 'QA'
  | 'PUBLISHING'
  | 'UNDER_REVIEW'
  | 'PUBLISHED'
  | 'COMPLETE'
  | 'FAILED'
  | 'CANCELLED';

/** Normalized launch source — downstream workers must not care about original channel. */
export type FactorySourceType =
  | 'website'
  | 'organization'
  | 'pdf'
  | 'image'
  | 'powerpoint'
  | 'word'
  | 'text'
  | 'voice'
  | 'other';

export type FactoryIntakeSource = {
  type: FactorySourceType;
  label: string;
  url?: string;
  textPreview?: string;
  name?: string;
  attachmentIndex?: number;
};

export type FactoryIntakeRecord = {
  version: 1;
  projectId: string;
  primarySourceType: FactorySourceType;
  sources: FactoryIntakeSource[];
  normalized: {
    client: string;
    organizationName: string;
    goal: string;
    deliverable: string;
    industry?: string;
    notes?: string;
    primaryUrl?: string;
  };
  completedAt: string;
};

export type FactoryProjectSource = 'api' | 'chatgpt' | 'admin' | 'cron';

export type FactoryAttachmentMeta = {
  type: 'image' | 'pdf' | 'powerpoint' | 'word' | 'text' | 'voice' | 'other';
  url?: string;
  textPreview?: string;
  name?: string;
};

export type FactoryActivity = {
  at: string;
  from: FactoryPipelineStatus | null;
  to: FactoryPipelineStatus;
  worker: string;
  detail?: string;
};

/** Persisted ProjectContext blob (see lib/factory-project-context.ts). */
export type FactoryProjectContextBlob = {
  schemaVersion: number;
  projectId: string;
  seed: {
    client: string;
    goal: string;
    deliverable: string;
    industry?: string;
    notes?: string;
    url?: string;
    attachments: FactoryAttachmentMeta[];
    source: FactoryProjectSource;
  };
  pipelineStatus: FactoryPipelineStatus;
  outputs: Array<{
    id: string;
    kind: string;
    worker: string;
    createdAt: string;
    payload: Record<string, unknown>;
  }>;
  artifacts?: Array<{
    schemaVersion: number;
    id: string;
    projectId: string;
    kind: string;
    providerId: string;
    createdAt: string;
    provenance: Record<string, unknown>;
    data: Record<string, unknown>;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type FactoryProject = {
  version: 1;
  id: string;
  client: string;
  goal: string;
  deliverable: string;
  industry?: string;
  notes?: string;
  url?: string;
  attachments: FactoryAttachmentMeta[];
  source: FactoryProjectSource;
  pipelineStatus: FactoryPipelineStatus;
  launchId?: string;
  launchReviewUrl?: string;
  /**
   * Shared execution context for all workers (append-only outputs).
   * Preferred over reading ad-hoc project fields inside workers.
   */
  context?: FactoryProjectContextBlob;
  /** Compat mirror of latest intake output payload. */
  intake?: FactoryIntakeRecord;
  error?: string;
  createdAt: string;
  updatedAt: string;
  queuedAt?: string;
  activity: FactoryActivity[];
};

const ORG_ID = 'ea-factory';

function recordId(projectId: string): string {
  return `factory-project-${projectId}`;
}

export async function saveFactoryProject(
  project: FactoryProject,
): Promise<{ ok: boolean; error?: string }> {
  const result = await saveStudioRecord({
    recordType: 'media',
    id: recordId(project.id),
    organizationId: ORG_ID,
    payload: project,
    title: `Factory Project — ${project.client}`,
  });
  return { ok: result.ok, error: result.error };
}

export async function getFactoryProject(id: string): Promise<FactoryProject | null> {
  const stored = await loadStudioRecord<FactoryProject>('media', recordId(id));
  if (!stored || stored.version !== 1 || !stored.id) return null;
  return stored;
}

export async function listFactoryProjects(): Promise<FactoryProject[]> {
  const rows = await listStudioRecords<FactoryProject>('media', ORG_ID);
  return rows
    .filter((row) => row?.version === 1 && typeof row.id === 'string')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function factoryQueueHealth(projects: FactoryProject[]): {
  queued: number;
  generating: number;
  intake: number;
  intakeComplete: number;
  researching: number;
  discovering: number;
  planning: number;
  building: number;
  underReview: number;
  failed: number;
  oldestQueuedAt: string | null;
} {
  const queued = projects.filter((p) => p.pipelineStatus === 'QUEUED');
  const generating = projects.filter((p) => p.pipelineStatus === 'GENERATING');
  const intake = projects.filter((p) => p.pipelineStatus === 'INTAKE');
  const intakeComplete = projects.filter((p) => p.pipelineStatus === 'INTAKE_COMPLETE');
  const researching = projects.filter((p) => p.pipelineStatus === 'RESEARCHING');
  const discovering = projects.filter((p) => p.pipelineStatus === 'DISCOVERING');
  const planning = projects.filter((p) => p.pipelineStatus === 'PLANNING');
  const building = projects.filter((p) => p.pipelineStatus === 'BUILDING');
  const underReview = projects.filter((p) => p.pipelineStatus === 'UNDER_REVIEW');
  const failed = projects.filter((p) => p.pipelineStatus === 'FAILED');
  const oldest = queued
    .map((p) => p.queuedAt || p.updatedAt)
    .sort()[0];
  return {
    queued: queued.length,
    generating: generating.length,
    intake: intake.length,
    intakeComplete: intakeComplete.length,
    researching: researching.length,
    discovering: discovering.length,
    planning: planning.length,
    building: building.length,
    underReview: underReview.length,
    failed: failed.length,
    oldestQueuedAt: oldest ?? null,
  };
}

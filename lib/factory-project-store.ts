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
  | 'UNDER_REVIEW'
  | 'RESEARCHING'
  | 'DISCOVERING'
  | 'PLANNING'
  | 'BUILDING'
  | 'QA'
  | 'PUBLISHED'
  | 'COMPLETE'
  | 'FAILED'
  | 'CANCELLED';

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
  oldestQueuedAt: string | null;
} {
  const queued = projects.filter((p) => p.pipelineStatus === 'QUEUED');
  const generating = projects.filter((p) => p.pipelineStatus === 'GENERATING');
  const oldest = queued
    .map((p) => p.queuedAt || p.updatedAt)
    .sort()[0];
  return {
    queued: queued.length,
    generating: generating.length,
    oldestQueuedAt: oldest ?? null,
  };
}

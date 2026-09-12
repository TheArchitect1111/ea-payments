import { loadStudioRecord, saveStudioRecord } from '@/lib/creative-studio/persistence';
import type { ReliabilityErrorClass } from '@/lib/reliability/execution';

export type FactoryReliabilityState = {
  version: 1;
  projectId: string;
  attempts: number;
  nextAttemptAt?: string;
  lastError?: string;
  lastErrorClass?: ReliabilityErrorClass;
  deadLetteredAt?: string;
  completedAt?: string;
  updatedAt: string;
};

const ORG_ID = 'ea-factory';
const recordId = (projectId: string) => `factory-reliability-${projectId}`;

export async function getFactoryReliabilityState(projectId: string): Promise<FactoryReliabilityState> {
  const existing = await loadStudioRecord<FactoryReliabilityState>('media', recordId(projectId));
  if (existing?.version === 1 && existing.projectId === projectId) return existing;
  return { version: 1, projectId, attempts: 0, updatedAt: new Date().toISOString() };
}

export async function saveFactoryReliabilityState(state: FactoryReliabilityState): Promise<void> {
  const result = await saveStudioRecord({
    recordType: 'media',
    id: recordId(state.projectId),
    organizationId: ORG_ID,
    payload: state,
    title: `Factory Reliability — ${state.projectId}`,
  });
  if (!result.ok) throw new Error(result.error || 'Could not persist Factory reliability state');
}

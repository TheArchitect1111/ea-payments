import { ORCHESTRATOR_DRAIN_STATUSES, runFactoryOrchestrator } from '@/lib/factory-orchestrator';
import { getProject, listProjects } from '@/lib/factory-project';
import { getFactoryReliabilityState, saveFactoryReliabilityState } from '@/lib/factory-reliability-store';
import { classifyReliabilityError, DEFAULT_RETRY_POLICY, isRetryableErrorClass, nextAttemptAt } from '@/lib/reliability/execution';
import { featureEnabled } from '@/lib/reliability/feature-flags';
import { emitReliabilityTelemetry } from '@/lib/reliability/telemetry';

export type DurableDrainResult = {
  processed: number;
  retried: number;
  deadLettered: number;
  skippedBackoff: number;
  projectIds: string[];
  errors: string[];
};

export async function drainFactoryQueueDurably(limit = 10): Promise<DurableDrainResult> {
  const now = Date.now();
  const projects = await listProjects();
  const due = projects
    .filter((project) => ORCHESTRATOR_DRAIN_STATUSES.includes(project.pipelineStatus))
    .sort((a, b) => (a.queuedAt || a.createdAt).localeCompare(b.queuedAt || b.createdAt))
    .slice(0, Math.max(1, Math.min(20, limit)));

  const result: DurableDrainResult = {
    processed: 0,
    retried: 0,
    deadLettered: 0,
    skippedBackoff: 0,
    projectIds: [],
    errors: [],
  };

  for (const project of due) {
    const state = await getFactoryReliabilityState(project.id);
    if (state.deadLetteredAt || state.completedAt) continue;
    if (state.nextAttemptAt && new Date(state.nextAttemptAt).getTime() > now) {
      result.skippedBackoff += 1;
      continue;
    }

    const startedAt = Date.now();
    try {
      await runFactoryOrchestrator(project.id);
      const latest = await getProject(project.id);
      await saveFactoryReliabilityState({
        ...state,
        attempts: 0,
        nextAttemptAt: undefined,
        lastError: undefined,
        lastErrorClass: undefined,
        completedAt: latest && ['COMPLETE', 'PUBLISHED', 'UNDER_REVIEW'].includes(latest.pipelineStatus)
          ? new Date().toISOString()
          : undefined,
        updatedAt: new Date().toISOString(),
      });
      result.processed += 1;
      result.projectIds.push(project.id);
      emitReliabilityTelemetry({
        event: 'factory.job.success',
        tenantId: 'ea-factory',
        projectId: project.id,
        attempt: state.attempts + 1,
        durationMs: Date.now() - startedAt,
        status: latest?.pipelineStatus,
      });
    } catch (error) {
      const errorClass = classifyReliabilityError(error);
      const attempts = state.attempts + 1;
      const retryable = featureEnabled('factory_durable_retries') && isRetryableErrorClass(errorClass) && attempts < DEFAULT_RETRY_POLICY.maxAttempts;
      const message = error instanceof Error ? error.message : String(error);
      if (retryable) {
        await saveFactoryReliabilityState({
          ...state,
          attempts,
          nextAttemptAt: nextAttemptAt(attempts),
          lastError: message,
          lastErrorClass: errorClass,
          updatedAt: new Date().toISOString(),
        });
        result.retried += 1;
      } else {
        await saveFactoryReliabilityState({
          ...state,
          attempts,
          nextAttemptAt: undefined,
          lastError: message,
          lastErrorClass: errorClass,
          deadLetteredAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        result.deadLettered += 1;
      }
      result.errors.push(`${project.id}: ${errorClass}: ${message}`);
      emitReliabilityTelemetry({
        event: retryable ? 'factory.job.retry_scheduled' : 'factory.job.dead_lettered',
        tenantId: 'ea-factory',
        projectId: project.id,
        attempt: attempts,
        durationMs: Date.now() - startedAt,
        errorClass,
        status: project.pipelineStatus,
      });
    }
  }

  return result;
}

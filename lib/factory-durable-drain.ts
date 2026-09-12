import { ORCHESTRATOR_DRAIN_STATUSES, runFactoryOrchestrator } from '@/lib/factory-orchestrator';
import { getProject, listProjects, transitionFactoryProject } from '@/lib/factory-project';
import type { FactoryPipelineStatus, FactoryProject } from '@/lib/factory-project-store';
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

function resumableFailedStatus(project: FactoryProject): FactoryPipelineStatus | null {
  if (project.pipelineStatus !== 'FAILED' || !project.error) return null;
  if (!isRetryableErrorClass(classifyReliabilityError(project.error))) return null;
  const failedActivity = [...project.activity].reverse().find((activity) => activity.to === 'FAILED');
  const prior = failedActivity?.from;
  return prior && ORCHESTRATOR_DRAIN_STATUSES.includes(prior) ? prior : null;
}

export async function drainFactoryQueueDurably(limit = 10): Promise<DurableDrainResult> {
  const now = Date.now();
  const projects = await listProjects();
  const due = projects
    .filter((project) =>
      ORCHESTRATOR_DRAIN_STATUSES.includes(project.pipelineStatus) || Boolean(resumableFailedStatus(project)),
    )
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

    const resumeStatus = resumableFailedStatus(project);
    if (resumeStatus) {
      const attempts = state.attempts + 1;
      if (!featureEnabled('factory_durable_retries') || attempts >= DEFAULT_RETRY_POLICY.maxAttempts) {
        await saveFactoryReliabilityState({
          ...state,
          attempts,
          lastError: project.error,
          lastErrorClass: classifyReliabilityError(project.error),
          deadLetteredAt: new Date().toISOString(),
          nextAttemptAt: undefined,
          updatedAt: new Date().toISOString(),
        });
        result.deadLettered += 1;
        result.errors.push(`${project.id}: retry budget exhausted before FAILED recovery`);
        continue;
      }
      const resumed = await transitionFactoryProject(
        project.id,
        resumeStatus,
        'durable-retry',
        `Resuming transient failure from ${resumeStatus}`,
      );
      if (!resumed) {
        result.errors.push(`${project.id}: could not restore retryable FAILED project`);
        continue;
      }
      await saveFactoryReliabilityState({
        ...state,
        attempts,
        lastError: project.error,
        lastErrorClass: classifyReliabilityError(project.error),
        nextAttemptAt: undefined,
        updatedAt: new Date().toISOString(),
      });
      result.retried += 1;
      emitReliabilityTelemetry({
        event: 'factory.job.failed_state_resumed',
        tenantId: 'ea-factory',
        projectId: project.id,
        attempt: attempts,
        status: resumeStatus,
        errorClass: classifyReliabilityError(project.error),
      });
    }

    const currentState = await getFactoryReliabilityState(project.id);
    const startedAt = Date.now();
    try {
      await runFactoryOrchestrator(project.id);
      const latest = await getProject(project.id);
      await saveFactoryReliabilityState({
        ...currentState,
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
        attempt: currentState.attempts + 1,
        durationMs: Date.now() - startedAt,
        status: latest?.pipelineStatus,
      });
    } catch (error) {
      const errorClass = classifyReliabilityError(error);
      const attempts = currentState.attempts + 1;
      const retryable = featureEnabled('factory_durable_retries') && isRetryableErrorClass(errorClass) && attempts < DEFAULT_RETRY_POLICY.maxAttempts;
      const message = error instanceof Error ? error.message : String(error);
      if (retryable) {
        await saveFactoryReliabilityState({
          ...currentState,
          attempts,
          nextAttemptAt: nextAttemptAt(attempts),
          lastError: message,
          lastErrorClass: errorClass,
          updatedAt: new Date().toISOString(),
        });
        result.retried += 1;
      } else {
        await saveFactoryReliabilityState({
          ...currentState,
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

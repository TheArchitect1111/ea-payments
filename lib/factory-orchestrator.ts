/**
 * EA Factory Orchestrator — sole scheduler/dispatcher.
 * Discovers the next Capability from the registry (not a fixed sequence).
 * Capabilities never call one another; they only read/append ProjectContext.
 */
import {
  bootstrapCapabilityRegistry,
  discoverNextFromRegistry,
} from '@/lib/factory-capabilities';
import { ensureProjectContext, loadProjectContext } from '@/lib/factory-project-context';
import { getProject, transitionFactoryProject } from '@/lib/factory-project';
import type { FactoryPipelineStatus, FactoryProject } from '@/lib/factory-project-store';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';
import { emitPulseEvent } from '@/lib/pulse-bus';

bootstrapCapabilityRegistry();

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL || EA_PLATFORM_URL).replace(/\/$/, '');
}

async function emitStatusPulse(project: FactoryProject) {
  try {
    await emitPulseEvent({
      product: 'ea-platform',
      type: 'factory.project.status',
      title: `Factory ${project.pipelineStatus} — ${project.client}`,
      detail: `${project.pipelineStatus} · ctx:v${project.context?.schemaVersion ?? 0} · outputs:${project.context?.outputs?.length ?? 0}`,
      priority: project.pipelineStatus === 'FAILED' ? 'high' : 'medium',
      href: `${baseUrl()}/admin/ea-factory/projects`,
      tenantId: 'ea-factory',
      objectId: project.id,
      metadata: {
        projectId: project.id,
        status: project.pipelineStatus,
        launchId: project.launchId || '',
        client: project.client,
      },
    });
  } catch (err) {
    console.error('[factory-orchestrator] pulse failed', err);
  }
}

export type OrchestratorStepResult = {
  project: FactoryProject | null;
  dispatched: boolean;
  worker: string | null;
  capabilityId: string | null;
};

export async function orchestrateOnce(projectId: string): Promise<OrchestratorStepResult> {
  bootstrapCapabilityRegistry();
  await ensureProjectContext(projectId);
  const context = await loadProjectContext(projectId);
  if (!context) return { project: null, dispatched: false, worker: null, capabilityId: null };

  const status = context.pipelineStatus;
  console.info('[factory-orchestrator] inspect context', {
    projectId,
    status,
    schemaVersion: context.schemaVersion,
    outputs: context.outputs.length,
  });

  if (status === 'CANCELLED' || status === 'FAILED') {
    return { project: await getProject(projectId), dispatched: false, worker: null, capabilityId: null };
  }

  // UNDER_REVIEW is terminal only after the Run 0 notification receipt exists.
  // Before that, the Notification capability must still be allowed to run.
  if (status === 'UNDER_REVIEW' && context.outputs.some((item) => item.kind === 'notification')) {
    const project = await getProject(projectId);
    return { project, dispatched: false, worker: null, capabilityId: null };
  }

  const capability = discoverNextFromRegistry(context);
  if (!capability) {
    console.info('[factory-orchestrator] no capability runnable', { projectId, status });
    return { project: await getProject(projectId), dispatched: false, worker: null, capabilityId: null };
  }

  console.info('[factory-orchestrator] dispatch capability', {
    projectId,
    capabilityId: capability.id,
    dependencies: capability.dependencies,
  });

  const startedAt = Date.now();
  const result = await capability.execute(context);
  const durationMs = Date.now() - startedAt;
  console.info('[factory-orchestrator] capability duration', {
    projectId,
    capabilityId: capability.id,
    ran: result.ran,
    durationMs,
    slow: durationMs > 90_000,
  });
  if (result.project && result.ran) await emitStatusPulse(result.project);

  return {
    project: result.project,
    dispatched: result.ran,
    worker: capability.id,
    capabilityId: capability.id,
  };
}

/**
 * Run one orchestration step, then auto-chain the next in a fresh background job.
 * One step per job protects Vercel request budgets while preserving full automation.
 */
export async function runFactoryOrchestrator(projectId: string): Promise<FactoryProject | null> {
  let project = await getProject(projectId);
  if (!project) return null;

  if (project.pipelineStatus === 'CREATED') {
    const { enqueueFactoryProject } = await import('@/lib/factory-queue');
    await enqueueFactoryProject(projectId);
    project = await getProject(projectId);
  }

  await ensureProjectContext(projectId);
  bootstrapCapabilityRegistry();
  console.info('[factory-orchestrator] start', { projectId, status: project?.pipelineStatus });

  const result = await orchestrateOnce(projectId);
  project = result.project;
  console.info(result.dispatched ? '[factory-orchestrator] dispatched' : '[factory-orchestrator] idle', {
    projectId,
    capabilityId: result.capabilityId,
    worker: result.worker,
    status: project?.pipelineStatus,
  });

  await ensureProjectContext(projectId);
  const leftover = await loadProjectContext(projectId);
  if (leftover && discoverNextFromRegistry(leftover)) {
    console.info('[factory-orchestrator] auto-chain next capability', {
      projectId,
      status: leftover.pipelineStatus,
    });
    const { scheduleFactoryGenerateJob } = await import('@/lib/factory-queue');
    scheduleFactoryGenerateJob(projectId);
  } else if (leftover) {
    const idleProject = await getProject(projectId);
    if (idleProject) {
      const {
        shouldRunPostBuildConceptPack,
        runPostBuildConceptPack,
      } = await import('@/lib/factory-post-build-concepts');
      if (shouldRunPostBuildConceptPack(idleProject)) {
        console.info('[factory-orchestrator] post-build concept pack', { projectId });
        try {
          const pack = await runPostBuildConceptPack(projectId);
          if (!pack.ok && pack.blocked) {
            console.info('[factory-orchestrator] identity gate blocked concepts', { projectId, error: pack.error });
          } else if (!pack.ok) {
            console.error('[factory-orchestrator] concept pack failed', projectId, pack.error);
          } else {
            console.info('[factory-orchestrator] concept pack', { projectId, skipped: pack.skipped, reason: pack.reason });
          }
        } catch (err) {
          console.error('[factory-orchestrator] concept pack threw', projectId, err);
        }
      }
    }

    // Backward-compatible safety net. The Notification capability normally handles this first.
    try {
      const { notifyFactoryDone } = await import('@/lib/factory-notify');
      const notified = await notifyFactoryDone(projectId);
      if (!notified.ok && notified.error && !/already sent/i.test(notified.error)) {
        console.error('[factory-orchestrator] done notify failed', projectId, notified.error);
      }
    } catch (err) {
      console.error('[factory-orchestrator] done notify failed', projectId, err);
    }
  }

  return getProject(projectId);
}

/** Statuses the cron drain should wake. */
export const ORCHESTRATOR_DRAIN_STATUSES: FactoryPipelineStatus[] = [
  'QUEUED',
  'INTAKE',
  'INTAKE_COMPLETE',
  'RESEARCHING',
  'DISCOVERING',
  'PLANNING',
  'BUILDING',
  'QA',
  'PUBLISHING',
  'GENERATING',
];

export async function failOrchestration(
  projectId: string,
  message: string,
): Promise<FactoryProject | null> {
  const failed = await transitionFactoryProject(projectId, 'FAILED', 'generate', message, { error: message });
  try {
    const { notifyFactoryFailed } = await import('@/lib/factory-notify');
    await notifyFactoryFailed(projectId);
  } catch (err) {
    console.error('[factory-orchestrator] failed notify failed', projectId, err);
  }
  return failed;
}

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

/**
 * Single orchestration step: discover at most one Capability from the registry.
 */
export async function orchestrateOnce(projectId: string): Promise<OrchestratorStepResult> {
  bootstrapCapabilityRegistry();
  await ensureProjectContext(projectId);
  const context = await loadProjectContext(projectId);
  if (!context) {
    return { project: null, dispatched: false, worker: null, capabilityId: null };
  }

  const status = context.pipelineStatus;
  console.info('[factory-orchestrator] inspect context', {
    projectId,
    status,
    schemaVersion: context.schemaVersion,
    outputs: context.outputs.length,
  });

  if (status === 'CANCELLED' || status === 'FAILED') {
    return {
      project: await getProject(projectId),
      dispatched: false,
      worker: null,
      capabilityId: null,
    };
  }

  if (status === 'UNDER_REVIEW') {
    const project = await getProject(projectId);
    if (project?.launchId) {
      return { project, dispatched: false, worker: null, capabilityId: null };
    }
  }

  const capability = discoverNextFromRegistry(context);
  if (!capability) {
    console.info('[factory-orchestrator] no capability runnable', { projectId, status });
    return {
      project: await getProject(projectId),
      dispatched: false,
      worker: null,
      capabilityId: null,
    };
  }

  console.info('[factory-orchestrator] dispatch capability', {
    projectId,
    capabilityId: capability.id,
    dependencies: capability.dependencies,
  });

  const result = await capability.execute(context);
  if (result.project && result.ran) {
    await emitStatusPulse(result.project);
  }

  return {
    project: result.project,
    dispatched: result.ran,
    worker: capability.id,
    capabilityId: capability.id,
  };
}

/**
 * Run orchestration until quiescent or max steps.
 * GenerateWorker entry delegates here — Orchestrator is the only dispatcher.
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

  console.info('[factory-orchestrator] start', {
    projectId,
    status: project?.pipelineStatus,
  });

  for (let step = 0; step < 8; step += 1) {
    const result = await orchestrateOnce(projectId);
    project = result.project;
    if (!result.dispatched) {
      console.info('[factory-orchestrator] idle', {
        projectId,
        status: project?.pipelineStatus,
        steps: step,
      });
      break;
    }
    console.info('[factory-orchestrator] dispatched', {
      projectId,
      capabilityId: result.capabilityId,
      worker: result.worker,
      status: project?.pipelineStatus,
      step,
    });
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
  'GENERATING',
];

export async function failOrchestration(
  projectId: string,
  message: string,
): Promise<FactoryProject | null> {
  return transitionFactoryProject(projectId, 'FAILED', 'generate', message, { error: message });
}

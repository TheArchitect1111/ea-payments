/**
 * Factory queue — after() + cron drain.
 * GenerateWorker entry is preserved; body is the Orchestrator.
 */
import { after } from 'next/server';
import { createEACPLaunch } from '@/lib/eacp-launch';
import { sendInternalNotification } from '@/lib/email';
import {
  failOrchestration,
  ORCHESTRATOR_DRAIN_STATUSES,
  runFactoryOrchestrator,
} from '@/lib/factory-orchestrator';
import {
  getProject,
  listProjects,
  transitionFactoryProject,
} from '@/lib/factory-project';
import type { FactoryProject } from '@/lib/factory-project-store';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';
import { emitPulseEvent } from '@/lib/pulse-bus';

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL || EA_PLATFORM_URL).replace(/\/$/, '');
}

async function emitFactoryPulse(
  project: FactoryProject,
  type: 'factory.project.created' | 'factory.project.queued' | 'factory.project.status',
  title: string,
) {
  try {
    await emitPulseEvent({
      product: 'ea-platform',
      type,
      title,
      detail: `${project.pipelineStatus} · ${project.client}`,
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
    console.error('[factory-queue] pulse failed', err);
  }
}

export async function enqueueFactoryProject(projectId: string): Promise<FactoryProject | null> {
  const queued = await transitionFactoryProject(
    projectId,
    'QUEUED',
    'queue',
    'Enqueued for GenerateWorker (Orchestrator)',
  );
  if (!queued) return null;
  await emitFactoryPulse(queued, 'factory.project.queued', `Factory project queued — ${queued.client}`);
  return queued;
}

export function scheduleFactoryGenerateJob(projectId: string) {
  // Each after() tick runs one capability, then runFactoryOrchestrator schedules the next.
  after(async () => {
    try {
      await runGenerateWorker(projectId);
    } catch (err) {
      console.error('[factory-queue] background generate/orchestrator failed', projectId, err);
      await failOrchestration(
        projectId,
        err instanceof Error ? err.message : 'Generate worker (orchestrator) failed',
      );
    }
  });
}

/**
 * GenerateWorker — preserved public entry.
 * Phase 2: orchestration only (Intake → Research stub). Does not build EACP packages.
 */
export async function runGenerateWorker(projectId: string): Promise<FactoryProject | null> {
  console.info('[factory-generate] orchestrator entry', { projectId });
  return runFactoryOrchestrator(projectId);
}

/**
 * Phase 1 package path — retained for backward compatibility / future Publishing stage.
 * Not invoked by the Orchestrator in Phase 2.
 */
export async function runLegacyGeneratePackageWorker(
  projectId: string,
): Promise<FactoryProject | null> {
  const current = await getProject(projectId);
  if (!current) return null;
  if (current.pipelineStatus === 'CANCELLED') return current;
  if (current.pipelineStatus === 'UNDER_REVIEW' && current.launchId) return current;

  const generating = await transitionFactoryProject(
    projectId,
    'GENERATING',
    'generate',
    'Legacy GenerateWorker package generation',
  );
  if (!generating) return null;

  try {
    const launch = await createEACPLaunch({
      client: generating.client,
      goal: generating.goal,
      deliverable: generating.deliverable,
      industry: generating.industry,
      notes: generating.notes,
    });

    const reviewUrl = `${baseUrl()}${launch.links.reviewPackage}`;
    const done = await transitionFactoryProject(
      projectId,
      'UNDER_REVIEW',
      'generate',
      `EACP package ${launch.id} ready for human review`,
      {
        launchId: launch.id,
        launchReviewUrl: reviewUrl,
      },
    );

    if (done) {
      await emitFactoryPulse(done, 'factory.project.status', `Factory under review — ${done.client}`);
      try {
        await sendInternalNotification({
          subject: `Factory project ready — ${done.client}`,
          title: `EA Factory: ${done.client}`,
          body: [
            `Project: ${done.id}`,
            `Status: ${done.pipelineStatus}`,
            `Goal: ${done.goal}`,
            `Launch: ${done.launchId}`,
            `Review: ${done.launchReviewUrl}`,
          ]
            .filter(Boolean)
            .join('\n'),
        });
      } catch (notifyErr) {
        console.error('[factory-queue] notify failed', notifyErr);
      }
    }

    return done;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Package generation failed';
    return transitionFactoryProject(projectId, 'FAILED', 'generate', message, { error: message });
  }
}

/** Drain projects waiting on orchestrator-owned statuses. */
export async function drainFactoryQueue(limit = 5): Promise<{
  processed: number;
  projectIds: string[];
  errors: string[];
}> {
  const projects = await listProjects();
  const due = projects
    .filter((p) => ORCHESTRATOR_DRAIN_STATUSES.includes(p.pipelineStatus))
    .sort((a, b) => (a.queuedAt || a.createdAt).localeCompare(b.queuedAt || b.createdAt))
    .slice(0, Math.max(1, Math.min(20, limit)));

  const projectIds: string[] = [];
  const errors: string[] = [];

  for (const project of due) {
    try {
      await runGenerateWorker(project.id);
      projectIds.push(project.id);
    } catch (err) {
      errors.push(`${project.id}: ${err instanceof Error ? err.message : 'drain failed'}`);
    }
  }

  return { processed: projectIds.length, projectIds, errors };
}

export async function launchFactoryProjectFlow(
  projectId: string,
): Promise<FactoryProject | null> {
  const created = await getProject(projectId);
  if (!created) return null;
  await emitFactoryPulse(created, 'factory.project.created', `Factory project created — ${created.client}`);
  const queued = await enqueueFactoryProject(projectId);
  if (!queued) return null;
  scheduleFactoryGenerateJob(projectId);
  try {
    const { notifyFactoryStarted } = await import('@/lib/factory-notify');
    await notifyFactoryStarted(projectId);
  } catch (err) {
    console.error('[factory-queue] start notify failed', projectId, err);
  }
  return queued;
}

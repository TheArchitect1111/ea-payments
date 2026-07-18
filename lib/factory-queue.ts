/**
 * Factory queue — after() + cron drain. No BullMQ/Redis in Phase 1.
 * Workers communicate only via project status updates.
 */
import { after } from 'next/server';
import { createEACPLaunch } from '@/lib/eacp-launch';
import { sendInternalNotification } from '@/lib/email';
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
  const queued = await transitionFactoryProject(projectId, 'QUEUED', 'queue', 'Enqueued for GenerateWorker');
  if (!queued) return null;
  await emitFactoryPulse(queued, 'factory.project.queued', `Factory project queued — ${queued.client}`);
  return queued;
}

export function scheduleFactoryGenerateJob(projectId: string) {
  after(async () => {
    try {
      await runGenerateWorker(projectId);
    } catch (err) {
      console.error('[factory-queue] background generate failed', projectId, err);
      await transitionFactoryProject(
        projectId,
        'FAILED',
        'generate',
        err instanceof Error ? err.message : 'Generate worker failed',
        { error: err instanceof Error ? err.message : 'Generate worker failed' },
      );
    }
  });
}

export async function runGenerateWorker(projectId: string): Promise<FactoryProject | null> {
  const current = await getProject(projectId);
  if (!current) return null;
  if (current.pipelineStatus === 'CANCELLED') return current;
  if (current.pipelineStatus === 'UNDER_REVIEW' && current.launchId) return current;
  if (current.pipelineStatus !== 'QUEUED' && current.pipelineStatus !== 'GENERATING') {
    if (current.pipelineStatus === 'CREATED') {
      await enqueueFactoryProject(projectId);
    } else {
      return current;
    }
  }

  const generating = await transitionFactoryProject(
    projectId,
    'GENERATING',
    'generate',
    'GenerateWorker started package generation',
  );
  if (!generating) return null;
  await emitFactoryPulse(generating, 'factory.project.status', `Factory generating — ${generating.client}`);

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
            `Deliverable: ${done.deliverable}`,
            done.url ? `URL: ${done.url}` : null,
            `Launch: ${done.launchId}`,
            `Review: ${done.launchReviewUrl}`,
            '',
            'Phase 1 GenerateWorker complete. Approve in EA Factory before build/deploy.',
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
    const failed = await transitionFactoryProject(projectId, 'FAILED', 'generate', message, {
      error: message,
    });
    if (failed) {
      await emitFactoryPulse(failed, 'factory.project.status', `Factory failed — ${failed.client}`);
    }
    return failed;
  }
}

/** Drain stuck QUEUED jobs (cron safety net). */
export async function drainFactoryQueue(limit = 5): Promise<{
  processed: number;
  projectIds: string[];
  errors: string[];
}> {
  const projects = await listProjects();
  const due = projects
    .filter((p) => p.pipelineStatus === 'QUEUED')
    .sort((a, b) => (a.queuedAt || a.createdAt).localeCompare(b.queuedAt || b.createdAt))
    .slice(0, Math.max(1, Math.min(20, limit)));

  const projectIds: string[] = [];
  const errors: string[] = [];

  for (const project of due) {
    try {
      await runGenerateWorker(project.id);
      projectIds.push(project.id);
    } catch (err) {
      errors.push(
        `${project.id}: ${err instanceof Error ? err.message : 'drain failed'}`,
      );
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
  return queued;
}

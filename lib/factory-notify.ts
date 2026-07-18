/**
 * Factory founder notifications — email only on start and terminal done/failed.
 * Not on every pipeline step (by design).
 */
import { sendInternalNotification } from '@/lib/email';
import { getProject } from '@/lib/factory-project';
import { saveFactoryProject, type FactoryProject } from '@/lib/factory-project-store';
import { factoryFriendlyLabel } from '@/lib/factory-status-labels';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';

function projectsUrl(projectId: string): string {
  const base = (
    process.env.NEXT_PUBLIC_BASE_URL ||
    EA_PLATFORM_URL ||
    'https://efficiencyarchitects.online'
  )
    .replace(/\/$/, '')
    .replace(/^https?:\/\/www\.efficiencyarchitects\.online/i, 'https://efficiencyarchitects.online');
  return `${base}/admin/ea-factory/projects?focus=${encodeURIComponent(projectId)}`;
}

async function persistNotify(
  project: FactoryProject,
  patch: NonNullable<FactoryProject['notifySent']>,
): Promise<void> {
  await saveFactoryProject({
    ...project,
    notifySent: { ...project.notifySent, ...patch },
    updatedAt: new Date().toISOString(),
  });
}

export async function notifyFactoryStarted(projectId: string): Promise<void> {
  const project = await getProject(projectId);
  if (!project || project.notifySent?.startedAt) return;

  const href = projectsUrl(projectId);
  try {
    await sendInternalNotification({
      subject: `Factory started — ${project.client}`,
      title: 'Factory launch received',
      body: [
        `${project.client} is in the Factory.`,
        `Project: ${project.id}`,
        `Status: ${factoryFriendlyLabel(project.pipelineStatus)}`,
        '',
        `Track it: ${href}`,
      ].join('\n'),
    });
  } catch (err) {
    console.error('[factory-notify] started email failed', projectId, err);
  }

  const latest = (await getProject(projectId)) ?? project;
  await persistNotify(latest, { startedAt: new Date().toISOString() });
}

/** Call when the automatic pipeline has no more work and status is a success stop. */
export async function notifyFactoryDone(projectId: string): Promise<void> {
  const project = await getProject(projectId);
  if (!project || project.notifySent?.doneAt || project.notifySent?.failedAt) return;
  if (project.pipelineStatus === 'FAILED' || project.pipelineStatus === 'CANCELLED') return;

  // Core v1 “done” = idle after build (BUILDING) or explicit review/complete.
  const okStop =
    project.pipelineStatus === 'BUILDING' ||
    project.pipelineStatus === 'UNDER_REVIEW' ||
    project.pipelineStatus === 'COMPLETE' ||
    project.pipelineStatus === 'PUBLISHED';
  if (!okStop) return;

  const href = projectsUrl(projectId);
  try {
    await sendInternalNotification({
      subject: `Factory ready — ${project.client}`,
      title: 'Factory work is ready for you',
      body: [
        `${project.client} finished automatic Factory processing.`,
        `Project: ${project.id}`,
        `Status: ${factoryFriendlyLabel(project.pipelineStatus)}`,
        '',
        `Open it: ${href}`,
      ].join('\n'),
    });
  } catch (err) {
    console.error('[factory-notify] done email failed', projectId, err);
  }

  const latest = (await getProject(projectId)) ?? project;
  await persistNotify(latest, { doneAt: new Date().toISOString() });
}

export async function notifyFactoryFailed(projectId: string): Promise<void> {
  const project = await getProject(projectId);
  if (!project || project.notifySent?.failedAt) return;
  if (project.pipelineStatus !== 'FAILED') return;

  const href = projectsUrl(projectId);
  try {
    await sendInternalNotification({
      subject: `Factory needs attention — ${project.client}`,
      title: 'Factory launch failed',
      body: [
        `${project.client} hit a problem in the Factory.`,
        `Project: ${project.id}`,
        project.error ? `Error: ${project.error}` : '',
        '',
        `Open it: ${href}`,
      ]
        .filter(Boolean)
        .join('\n'),
    });
  } catch (err) {
    console.error('[factory-notify] failed email failed', projectId, err);
  }

  const latest = (await getProject(projectId)) ?? project;
  await persistNotify(latest, { failedAt: new Date().toISOString() });
}

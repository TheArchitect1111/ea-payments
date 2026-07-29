import { after } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';
import { requireFactoryApiAccess } from '@/lib/factory-api-auth';
import { getProject } from '@/lib/factory-project';
import {
  factoryFriendlyLabel,
  factoryFriendlyStage,
  factoryIsInProgress,
  factoryIsTerminalFailure,
  factoryIsTerminalSuccess,
} from '@/lib/factory-status-labels';
import {
  buildLaunchConceptStatus,
  shouldRunPostBuildConceptPack,
  runPostBuildConceptPack,
} from '@/lib/factory-post-build-concepts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

/** Soft rate-limit automatic pipeline nudges from status polls. */
const lastNudgeAt = new Map<string, number>();
const NUDGE_COOLDOWN_MS = 12_000;

function maybeScheduleAutomaticNudge(
  projectId: string,
  needsNudge: boolean,
  pipelineInProgress: boolean,
): void {
  if (!needsNudge) return;
  const now = Date.now();
  const prev = lastNudgeAt.get(projectId) || 0;
  if (now - prev < NUDGE_COOLDOWN_MS) return;
  lastNudgeAt.set(projectId, now);

  after(async () => {
    try {
      const project = await getProject(projectId);
      if (!project) return;

      if (pipelineInProgress || project.pipelineStatus !== 'BUILDING') {
        const { scheduleFactoryGenerateJob } = await import('@/lib/factory-queue');
        console.info('[projects-get] auto-nudge orchestrator', {
          projectId,
          status: project.pipelineStatus,
        });
        scheduleFactoryGenerateJob(projectId);
        return;
      }

      if (shouldRunPostBuildConceptPack(project)) {
        console.info('[projects-get] auto-nudge concept pack', { projectId });
        const pack = await runPostBuildConceptPack(projectId);
        if (!pack.ok) {
          console.error('[projects-get] concept pack nudge failed', {
            projectId,
            error: pack.error,
            blocked: pack.blocked,
          });
        }
      }
    } catch (err) {
      console.error('[projects-get] auto-nudge threw', projectId, err);
    }
  });
}

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireFactoryApiAccess(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const project = await getProject(id.trim());
  if (!project) {
    return NextResponse.json({ ok: false, error: 'Project not found.' }, { status: 404 });
  }

  const launch = buildLaunchConceptStatus(project);
  const pipelineInProgress = factoryIsInProgress(project.pipelineStatus);
  const inProgress = launch.identityBlocked
    ? false
    : launch.conceptPackReady
      ? false
      : launch.inProgress || pipelineInProgress;
  const ready =
    launch.readyForConceptReview ||
    (factoryIsTerminalSuccess(project.pipelineStatus) && launch.conceptPackReady);

  maybeScheduleAutomaticNudge(
    project.id,
    Boolean(launch.needsAutomaticNudge) && !launch.identityBlocked && !ready,
    pipelineInProgress,
  );

  return NextResponse.json({
    ok: true,
    project,
    statusLabel: launch.statusLabel || factoryFriendlyLabel(project.pipelineStatus),
    plainLanguageStage: launch.plainLanguageStage,
    progressHint: launch.progressHint,
    stage: factoryFriendlyStage(project.pipelineStatus),
    stageDurationsMs: launch.stageDurationsMs,
    inProgress,
    ready,
    failed: factoryIsTerminalFailure(project.pipelineStatus),
    launch,
  });
}

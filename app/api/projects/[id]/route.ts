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
import { buildQuickLaunchReview } from '@/lib/factory-quick-launch-review';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

/** Soft rate-limit automatic pipeline nudges from status polls. */
const lastNudgeAt = new Map<string, number>();
const NUDGE_COOLDOWN_MS = 12_000;
/** Avoid re-verifying preview renders on every poll. */
const previewVerifyCache = new Map<
  string,
  Awaited<ReturnType<typeof buildQuickLaunchReview>>
>();

function maybeScheduleAutomaticNudge(
  projectId: string,
  needsNudge: boolean,
  pipelineInProgress: boolean,
  identityBlocked: boolean,
): void {
  if (!needsNudge && !identityBlocked) return;
  const now = Date.now();
  const prev = lastNudgeAt.get(projectId) || 0;
  if (now - prev < NUDGE_COOLDOWN_MS) return;
  lastNudgeAt.set(projectId, now);

  after(async () => {
    try {
      const project = await getProject(projectId);
      if (!project) return;

      if (identityBlocked) {
        const {
          normalizeLaunchUrl,
          extractUrlFromLaunchNotes,
          extractFirstUrlFromText,
        } = await import('@/lib/factory-url-normalize.mjs');
        const { parseDistinguishingDetail, mergeDistinguishingDetail } = await import(
          '@/lib/factory-identity-gate'
        );
        const resolvedUrl =
          normalizeLaunchUrl(project.url) ||
          extractUrlFromLaunchNotes(project.notes) ||
          extractFirstUrlFromText(project.notes);
        const existingDetail = parseDistinguishingDetail(project.notes);

        // Clarification already on the record — resume concept pack without asking again.
        if (existingDetail && existingDetail.length > 8 && !resolvedUrl) {
          console.info('[projects-get] auto-resume with existing clarification', {
            projectId,
          });
          const pack = await runPostBuildConceptPack(projectId, { force: true });
          if (!pack.ok) {
            console.error('[projects-get] clarification resume failed', {
              projectId,
              error: pack.error,
            });
          } else {
            previewVerifyCache.delete(projectId);
          }
          return;
        }

        if (!resolvedUrl) return;

        console.info('[projects-get] auto-heal identity with normalized URL', {
          projectId,
          url: resolvedUrl,
        });
        const { saveFactoryProject } = await import('@/lib/factory-project-store');
        const at = new Date().toISOString();
        const nextNotes = mergeDistinguishingDetail(
          project.notes,
          existingDetail || project.client,
          resolvedUrl,
        );
        await saveFactoryProject({
          ...project,
          url: resolvedUrl,
          notes: nextNotes,
          updatedAt: at,
          context: project.context
            ? {
                ...project.context,
                seed: {
                  ...project.context.seed,
                  url: resolvedUrl,
                  notes: nextNotes,
                },
                updatedAt: at,
              }
            : project.context,
        });
        const { setProjectContextStatus } = await import('@/lib/factory-project-context');
        const { scheduleFactoryGenerateJob } = await import('@/lib/factory-queue');
        await setProjectContextStatus(
          projectId,
          'RESEARCHING',
          'identity-auto-heal',
          `Researching normalized website ${resolvedUrl}`,
        );
        scheduleFactoryGenerateJob(projectId);
        return;
      }

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
        } else {
          previewVerifyCache.delete(projectId);
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
    Boolean(launch.needsAutomaticNudge) && !ready,
    pipelineInProgress,
    Boolean(launch.identityBlocked),
  );

  const forceRefresh = request.nextUrl.searchParams.get('refreshReview') === '1';
  if (forceRefresh) previewVerifyCache.delete(project.id);

  let review = previewVerifyCache.get(project.id);
  if (!review) {
    review = await buildQuickLaunchReview(project, {
      verifyPreviews: Boolean(launch.conceptPackReady),
    });
    if (launch.conceptPackReady && review.conceptsReady) {
      previewVerifyCache.set(project.id, review);
    }
  }

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
    review,
  });
}

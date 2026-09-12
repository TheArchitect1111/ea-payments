import { publishingCanRun as publishingCanRunPure } from '@/lib/factory-capability-gates.mjs';
import type { Capability, CapabilityExecutionResult } from '@/lib/factory-capability';
import { listDeliverablesFromArtifacts } from '@/lib/factory-deliverable.mjs';
import {
  appendProjectContextOutput,
  getLatestProjectContextOutput,
  loadProjectContext,
  setProjectContextStatus,
  type ProjectContext,
} from '@/lib/factory-project-context';
import { getProject } from '@/lib/factory-project';
import { canonicalPlatformOrigin } from '@/lib/platform-urls';

export function publishingCanRun(context: ProjectContext): boolean {
  return publishingCanRunPure(context);
}

export async function executePublishing(context: ProjectContext): Promise<CapabilityExecutionResult> {
  const projectId = context.projectId;
  if (!publishingCanRun(context)) {
    return { ran: false, project: await getProject(projectId), context: await loadProjectContext(projectId), detail: 'skip' };
  }

  const qa = getLatestProjectContextOutput(context, 'qa');
  const conceptsArtifact = [...(context.artifacts || [])]
    .reverse()
    .find((item) => item.kind === 'experience_concepts');
  const conceptData = conceptsArtifact?.data as Record<string, unknown> | undefined;
  const conceptId = String(conceptData?.recommendedConceptId || qa?.payload?.recommendedConceptId || '');
  if (!conceptId) {
    const failed = await appendProjectContextOutput(projectId, {
      kind: 'publishing',
      worker: 'publishing',
      payload: { verified: false, reviewReady: false, error: 'No recommended concept available' },
      pipelineStatus: 'FAILED',
      detail: 'Publishing blocked: missing recommended concept',
    });
    return { ran: true, project: failed?.project ?? await getProject(projectId), context: failed?.context ?? await loadProjectContext(projectId), detail: 'missing concept' };
  }

  await setProjectContextStatus(projectId, 'PUBLISHING', 'publishing', 'Preparing canonical Factory review preview');

  const reviewPath = `/preview/factory/${encodeURIComponent(projectId)}/${encodeURIComponent(conceptId)}`;
  const reviewUrl = `${canonicalPlatformOrigin()}${reviewPath}`;
  const deliverables = listDeliverablesFromArtifacts(context.artifacts as never[]);

  const result = await appendProjectContextOutput(projectId, {
    kind: 'publishing',
    worker: 'publishing',
    payload: {
      mode: 'review_preview',
      reviewReady: true,
      verified: true,
      reviewPath,
      reviewUrl,
      conceptId,
      deliverableIds: deliverables.map((item) => item.id),
      verification: {
        routeContract: reviewPath.startsWith('/preview/factory/'),
        qaPassed: qa?.payload?.passed === true,
        externalProductionPublish: false,
      },
      note: 'Run 0 publishes a verified internal review preview only. Human approval remains required before external production publication.',
    },
    pipelineStatus: 'UNDER_REVIEW',
    detail: `Review-ready preview published · ${reviewPath}`,
  });

  return {
    ran: true,
    project: result?.project ?? await getProject(projectId),
    context: result?.context ?? await loadProjectContext(projectId),
    detail: reviewUrl,
  };
}

export const publishingCapability: Capability = {
  id: 'publishing',
  dependencies: ['qa'],
  canRun: publishingCanRun,
  execute: executePublishing,
};

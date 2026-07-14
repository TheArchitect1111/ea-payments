/**
 * Persist CTP production packages and advance studio lifecycle.
 */
import { buildCtpProductionPackage, type CtpProductionPackage } from '@/lib/ctp-production';
import {
  getCtpSubmissionById,
  updateCtpSubmission,
  type CtpSubmission,
  type CtpSubmissionStatus,
  type CtpStudioStatus,
} from '@/lib/ctp-submissions';
import { emitPulseEvent } from '@/lib/pulse-bus';

function nextStudioStatus(current: CtpStudioStatus): CtpStudioStatus {
  if (current === 'Completed') return current;
  return 'Ready For Review';
}

function nextSubmissionStatus(current: CtpSubmissionStatus): CtpSubmissionStatus {
  if (current === 'Completed' || current === 'Review Scheduled') return current;
  return 'Ready For Review';
}

export async function runCtpProduction(
  submissionId: string,
  options?: { force?: boolean },
): Promise<{
  ok: boolean;
  skipped?: boolean;
  error?: string;
  productionPackage?: CtpProductionPackage;
}> {
  const submission = await getCtpSubmissionById(submissionId);
  if (!submission) {
    return { ok: false, error: 'CTP submission not found.' };
  }

  if (submission.productionPackage && !options?.force) {
    return {
      ok: true,
      skipped: true,
      productionPackage: submission.productionPackage,
    };
  }

  if (submission.workspaceStatus === 'Pending' || submission.workspaceStatus === 'Provisioning') {
    return { ok: false, error: 'Workspace must be active before AI production.' };
  }

  if (submission.workspaceStatus === 'Failed') {
    return { ok: false, error: 'Resolve workspace provisioning before AI production.' };
  }

  const productionPackage = buildCtpProductionPackage(submission);

  const updated = await updateCtpSubmission(submissionId, {
    productionPackage,
    studioStatus: nextStudioStatus(submission.studioStatus),
    status: nextSubmissionStatus(submission.status),
  });

  if (!updated.ok) {
    return { ok: false, error: updated.error ?? 'Failed to save production package.' };
  }

  await emitPulseEvent({
    product: 'ea-platform',
    type: 'ctp.production.ready',
    title: `CTP production ready — ${submission.businessName}`,
    detail: `${productionPackage.clientTypeLabel} · ${productionPackage.artifacts.length} artifacts`,
    priority: 'medium',
    href: '/admin/ctp',
    tenantId: submission.considerSlug,
    objectId: submission.id,
    metadata: {
      ctpSubmissionId: submission.id,
      clientType: productionPackage.clientType,
      artifactCount: productionPackage.artifacts.length,
      siteUrl: productionPackage.siteUrl ?? '',
    },
  });

  return { ok: true, productionPackage };
}

/** Fire-and-forget — never throws. */
export function scheduleCtpProduction(submissionId: string, options?: { force?: boolean }): void {
  void runCtpProduction(submissionId, options).catch((err) => {
    console.error('[ctp-production-run] scheduled run failed:', err);
  });
}

export function productionReady(submission: CtpSubmission): boolean {
  return Boolean(submission.productionPackage?.artifacts?.length);
}

/**
 * Persist CTP Executive Snapshot and emit Pulse.
 */
import {
  buildCtpExecutiveSnapshot,
  type BuildCtpExecutiveSnapshotInput,
  type CtpExecutiveSnapshot,
} from '@/lib/ctp-executive-snapshot';
import {
  getCtpSubmissionById,
  updateCtpSubmission,
} from '@/lib/ctp-submissions';
import { emitPulseEvent } from '@/lib/pulse-bus';

export async function runCtpExecutiveSnapshot(
  submissionId: string,
  input: Omit<BuildCtpExecutiveSnapshotInput, 'businessName' | 'clientType'> & {
    businessName?: string;
    clientType?: BuildCtpExecutiveSnapshotInput['clientType'];
  },
): Promise<{ ok: boolean; skipped?: boolean; error?: string; snapshot?: CtpExecutiveSnapshot }> {
  const submission = await getCtpSubmissionById(submissionId);
  if (!submission) {
    return { ok: false, error: 'CTP submission not found.' };
  }

  const wantsBi =
    submission.clientTypeClassification?.businessIntelligence === true ||
    (!submission.clientTypeClassification &&
      (submission.clientType === 'business_transformation' || submission.clientType === 'other'));

  if (!wantsBi) {
    return { ok: true, skipped: true };
  }

  if (submission.executiveSnapshot) {
    return { ok: true, skipped: true, snapshot: submission.executiveSnapshot };
  }

  const clientType = input.clientType ?? submission.clientType ?? 'other';
  const snapshot = buildCtpExecutiveSnapshot({
    businessName: input.businessName ?? submission.businessName,
    clientType,
    analysis: input.analysis,
    projectTypeLabel: input.projectTypeLabel,
    recommendedFee: input.recommendedFee,
    operationalChallenges: input.operationalChallenges,
    recommendations: input.recommendations ?? submission.recommendations,
  });

  const updated = await updateCtpSubmission(submissionId, { executiveSnapshot: snapshot });
  if (!updated.ok) {
    return { ok: false, error: updated.error ?? 'Failed to save executive snapshot.' };
  }

  await emitPulseEvent({
    product: 'ea-platform',
    type: 'ctp.bi.ready',
    title: `CTP executive snapshot — ${submission.businessName}`,
    detail: `Maturity ${snapshot.operationalMaturity}/100 · Admin drag ${snapshot.adminWastePercent}%`,
    priority: 'medium',
    href: '/admin/ctp',
    tenantId: submission.considerSlug,
    objectId: submission.id,
    metadata: {
      ctpSubmissionId: submission.id,
      capacityScore: snapshot.capacityScore,
      operationalMaturity: snapshot.operationalMaturity,
      adminWastePercent: snapshot.adminWastePercent,
      clientType: snapshot.clientType,
    },
  });

  return { ok: true, snapshot };
}

/** Fire-and-forget — never throws. */
export function scheduleCtpExecutiveSnapshot(
  submissionId: string,
  input: Parameters<typeof runCtpExecutiveSnapshot>[1],
): void {
  void runCtpExecutiveSnapshot(submissionId, input).catch((err) => {
    console.error('[ctp-executive-snapshot-run] scheduled run failed:', err);
  });
}

/**
 * Send / defer CTP executive email with optional vanity portal CTA.
 */
import { primaryPortalHost, publicPortalUrl } from '@/lib/ctp-portal-host';
import {
  getCtpSubmissionById,
  updateCtpSubmission,
  type CtpExecutiveEmailDraft,
  type CtpSubmission,
} from '@/lib/ctp-submissions';
import { sendCtpExecutiveEmail, type CtpExecutiveEmailData } from '@/lib/email';
import { ctpWelcomeEmailTrack, ctpWelcomeStudioPath } from '@/lib/ctp-welcome-email';

export type { CtpExecutiveEmailDraft };

/** Prefer vanity host in CTP welcome emails (matches approved copy). */
function ctpEmailPortalUrl(slug: string, pathSuffix: string): string {
  if (process.env.EA_PORTAL_EMAIL_HUB_URLS === '1') {
    return publicPortalUrl(slug, pathSuffix);
  }
  const cleanSlug = slug.trim().replace(/^\/+|\/+$/g, '').toLowerCase();
  const suffix = pathSuffix ? `/${pathSuffix.replace(/^\/+|\/+$/g, '')}` : '';
  const host = primaryPortalHost();
  return `https://${host}/${cleanSlug}${suffix}`;
}

export function buildCtpExecutiveEmailData(
  submission: CtpSubmission,
  portalUrl?: string | null,
): CtpExecutiveEmailData | null {
  const draft = submission.executiveEmailDraft;
  const snap = submission.executiveSnapshot;
  const clientType = draft?.clientType ?? submission.clientType ?? snap?.clientType;
  if (!clientType) return null;

  const capacityScore = draft?.capacityScore ?? snap?.capacityScore;
  const scoreBand = draft?.scoreBand ?? snap?.scoreBand;
  const primaryConstraint = draft?.primaryConstraint ?? snap?.primaryConstraint;
  const weeklyTimeRecovery = draft?.weeklyTimeRecovery ?? snap?.weeklyHoursRecoverable;
  const opportunityLow = draft?.opportunityLow ?? snap?.annualOpportunityLow;
  const opportunityHigh = draft?.opportunityHigh ?? snap?.annualOpportunityHigh;
  const projectTypeLabel = draft?.projectTypeLabel ?? snap?.scope.projectTypeLabel;
  const recommendedFee =
    draft?.recommendedFee ??
    snap?.scope.investmentHigh ??
    snap?.scope.investmentLow;
  const investmentLow = draft?.investmentLow ?? snap?.scope.investmentLow;
  const investmentHigh = draft?.investmentHigh ?? snap?.scope.investmentHigh;
  const timelineLabel = draft?.timelineLabel ?? snap?.scope.timelineLabel;
  const scopePhases = draft?.scopePhases;

  if (
    capacityScore == null ||
    !scoreBand ||
    !primaryConstraint ||
    weeklyTimeRecovery == null ||
    opportunityLow == null ||
    opportunityHigh == null ||
    !projectTypeLabel ||
    recommendedFee == null
  ) {
    return null;
  }

  const track = ctpWelcomeEmailTrack(clientType);
  const studioPath = ctpWelcomeStudioPath(track);
  const resolvedPortalUrl =
    portalUrl ||
    (submission.portalSlug ? ctpEmailPortalUrl(submission.portalSlug, studioPath) : undefined);

  return {
    email: submission.email,
    contactName: submission.contactName,
    businessName: submission.businessName,
    proposalId: submission.proposalId,
    clientType,
    capacityScore,
    scoreBand,
    primaryConstraint,
    weeklyTimeRecovery,
    opportunityLow,
    opportunityHigh,
    projectTypeLabel,
    recommendedFee,
    investmentLow,
    investmentHigh,
    timelineLabel,
    scopePhases,
    recommendations: draft?.recommendations ?? submission.recommendations,
    operationalChallenges: draft?.operationalChallenges,
    digitalPresenceAudit: submission.digitalPresenceAudit,
    portalUrl: resolvedPortalUrl,
  };
}

/**
 * Send the executive email for a CTP submission.
 * Skips when already sent unless `force` is set.
 */
export async function sendCtpExecutiveEmailForSubmission(
  submissionId: string,
  options?: { portalUrl?: string | null; force?: boolean },
): Promise<{ ok: boolean; skipped?: boolean; portalUrl?: string; error?: string }> {
  const submission = await getCtpSubmissionById(submissionId);
  if (!submission) return { ok: false, error: 'CTP submission not found.' };

  if (submission.executiveEmailSentAt && !options?.force) {
    return { ok: true, skipped: true, portalUrl: options?.portalUrl ?? undefined };
  }

  const data = buildCtpExecutiveEmailData(submission, options?.portalUrl);
  if (!data) {
    return {
      ok: false,
      error: 'Executive email context incomplete — save a draft or run BI snapshot first.',
    };
  }

  const result = await sendCtpExecutiveEmail(data);
  if (!result.ok) {
    return { ok: false, error: result.error ?? 'Executive email failed to send.' };
  }

  await updateCtpSubmission(submissionId, {
    executiveEmailSentAt: new Date().toISOString(),
  });

  return { ok: true, portalUrl: data.portalUrl };
}

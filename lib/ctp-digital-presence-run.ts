/**
 * Persist digital presence audit onto a CTP submission (fire-and-forget safe).
 */
import { auditDigitalPresence } from '@/lib/ctp-digital-presence';
import {
  getCtpSubmissionById,
  updateCtpSubmission,
  type CtpSubmission,
} from '@/lib/ctp-submissions';
import { emitPulseEvent } from '@/lib/pulse-bus';

function discoveryUrl(submission: CtpSubmission): string | undefined {
  const answers = submission.discoveryAnswers ?? {};
  const candidates = [
    answers.current_url,
    answers.website_url,
    answers.current_website,
    answers.public_presence,
  ];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

export function ctpWantsDigitalAudit(submission: CtpSubmission): boolean {
  if (submission.clientTypeClassification?.digitalAudit) return true;
  return (
    submission.clientType === 'website' ||
    submission.clientType === 'website_portal' ||
    submission.clientType === 'business_transformation'
  );
}

export async function runCtpDigitalPresenceAudit(
  submissionId: string,
  options?: { force?: boolean },
): Promise<{
  ok: boolean;
  skipped?: boolean;
  overallScore?: number;
  socialScore?: number;
  gbpScore?: number;
  error?: string;
}> {
  const submission = await getCtpSubmissionById(submissionId);
  if (!submission) return { ok: false, error: 'CTP submission not found.' };
  if (!ctpWantsDigitalAudit(submission)) return { ok: true, skipped: true };
  if (submission.digitalPresenceAudit && !options?.force) {
    return {
      ok: true,
      skipped: true,
      overallScore: submission.digitalPresenceAudit.overallScore,
      socialScore: submission.digitalPresenceAudit.scores?.socialPresence,
      gbpScore: submission.digitalPresenceAudit.scores?.googleBusinessProfile,
    };
  }

  const audit = await auditDigitalPresence({
    url: discoveryUrl(submission),
    businessName: submission.businessName,
    discoveryAnswers: submission.discoveryAnswers,
  });

  await updateCtpSubmission(submissionId, { digitalPresenceAudit: audit });

  await emitPulseEvent({
    product: 'ea-platform',
    type: 'ctp.digital.audit',
    title: `Digital presence ${audit.overallScore}/100 — ${submission.businessName}`,
    detail: options?.force
      ? `Re-run · ${audit.impactEstimate}`
      : audit.impactEstimate,
    priority: 'medium',
    href: '/admin/ctp',
    objectId: submission.id,
    metadata: {
      ctpSubmissionId: submission.id,
      overallScore: audit.overallScore,
      socialScore: audit.scores.socialPresence,
      gbpScore: audit.scores.googleBusinessProfile,
      mode: audit.mode,
      sourceUrl: audit.sourceUrl ?? '',
      force: Boolean(options?.force),
    },
  });

  return {
    ok: true,
    overallScore: audit.overallScore,
    socialScore: audit.scores.socialPresence,
    gbpScore: audit.scores.googleBusinessProfile,
  };
}

export function scheduleCtpDigitalPresenceAudit(submissionId: string): void {
  void runCtpDigitalPresenceAudit(submissionId).catch((err) => {
    console.error('[ctp-digital-presence] scheduled run failed:', err);
  });
}

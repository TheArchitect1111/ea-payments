/**
 * Internal executive actions for CTP: ready-for-review → approve → reveal.
 */
import { EA_PLATFORM_URL } from '@/lib/platform-urls';
import { ctpClientTypeLabel } from '@/lib/ctp-client-type';
import {
  getCtpSubmissionById,
  updateCtpSubmission,
  type CtpSubmission,
} from '@/lib/ctp-submissions';
import { sendRevealEmail } from '@/lib/email';
import { emitPulseEvent } from '@/lib/pulse-bus';
import { runCtpProduction } from '@/lib/ctp-production-run';

export type CtpExecutiveAction = 'ready_for_review' | 'approve_reveal' | 'run_production';

function baseUrl(): string {
  return (
    process.env.REVEAL_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    EA_PLATFORM_URL ||
    'https://efficiencyarchitects.online'
  ).replace(/\/$/, '');
}

function deliverablesFor(submission: CtpSubmission): string[] {
  const track = submission.clientType
    ? ctpClientTypeLabel(submission.clientType)
    : 'Custom Solution';
  const items = [`${track} delivery path`, 'Personalized client portal'];
  if (submission.siteUrl) items.push('Live starter website on the EA hub');
  if (submission.digitalPresenceAudit) {
    items.push(`Digital presence baseline (${submission.digitalPresenceAudit.overallScore}/100)`);
  }
  items.push('Executive brief and next-step plan');
  return items;
}

export async function runCtpExecutiveAction(
  submissionId: string,
  action: CtpExecutiveAction,
): Promise<{ ok: boolean; submission?: CtpSubmission; revealUrl?: string; error?: string }> {
  const submission = await getCtpSubmissionById(submissionId);
  if (!submission) {
    return { ok: false, error: 'CTP submission not found.' };
  }

  if (action === 'ready_for_review') {
    if (submission.status === 'Completed') {
      return { ok: false, error: 'Submission already completed / revealed.' };
    }
    const updated = await updateCtpSubmission(submissionId, {
      status: 'Ready For Review',
      studioStatus:
        submission.studioStatus === 'Not Started' ? 'Ready For Review' : submission.studioStatus,
    });
    if (!updated.ok || !updated.submission) {
      return { ok: false, error: updated.error ?? 'Could not mark ready for review.' };
    }

    await emitPulseEvent({
      product: 'ea-platform',
      type: 'ctp.ready_for_review',
      title: `CTP ready for review — ${submission.businessName}`,
      detail: `${submission.contactName} · ${submission.id}`,
      priority: 'high',
      href: '/admin/ctp',
      objectId: submission.id,
      metadata: {
        ctpSubmissionId: submission.id,
        clientType: submission.clientType ?? '',
      },
    });

    return { ok: true, submission: updated.submission };
  }

  if (action === 'approve_reveal') {
    const slug =
      submission.portalSlug?.trim() ||
      submission.businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') ||
      submission.id.toLowerCase();

    const revealUrl = `${baseUrl()}/reveal/${encodeURIComponent(slug)}`;
    const firstName = submission.contactName.split(' ')[0] || submission.contactName;
    const weekly =
      submission.digitalPresenceAudit?.overallScore != null
        ? Math.max(4, Math.round((100 - submission.digitalPresenceAudit.overallScore) / 8))
        : 8;
    const opportunityHigh = 75000;

    const emailResult = await sendRevealEmail({
      email: submission.email,
      firstName,
      projectType: submission.clientType
        ? ctpClientTypeLabel(submission.clientType)
        : 'Consider The Possibilities™',
      deliverables: deliverablesFor(submission),
      weeklyTimeRecovery: weekly,
      annualCapacityUnlocked: opportunityHigh,
      systemsAutomated: submission.siteUrl ? 2 : 1,
      revealUrl,
    });

    if (!emailResult.ok) {
      return { ok: false, error: emailResult.error ?? 'Reveal email failed to send.' };
    }

    const updated = await updateCtpSubmission(submissionId, {
      status: 'Completed',
      studioStatus: 'Completed',
      workspaceStatus:
        submission.workspaceStatus === 'Failed' ? submission.workspaceStatus : 'Active',
      portalSlug: submission.portalSlug || slug,
    });

    if (!updated.ok || !updated.submission) {
      return { ok: false, error: updated.error ?? 'Reveal email sent but status update failed.' };
    }

    await emitPulseEvent({
      product: 'ea-platform',
      type: 'ctp.revealed',
      title: `CTP revealed — ${submission.businessName}`,
      detail: revealUrl,
      priority: 'critical',
      href: revealUrl,
      objectId: submission.id,
      metadata: {
        ctpSubmissionId: submission.id,
        portalSlug: slug,
        revealUrl,
        siteUrl: submission.siteUrl ?? '',
      },
    });

    return { ok: true, submission: updated.submission, revealUrl };
  }

  if (action === 'run_production') {
    const result = await runCtpProduction(submissionId, { force: true });
    if (!result.ok) {
      return { ok: false, error: result.error ?? 'Production run failed.' };
    }
    const refreshed = await getCtpSubmissionById(submissionId);
    if (!refreshed) {
      return { ok: false, error: 'Production saved but submission reload failed.' };
    }
    return { ok: true, submission: refreshed };
  }

  return { ok: false, error: 'Unknown action.' };
}

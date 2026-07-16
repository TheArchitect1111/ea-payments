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
import { runCtpDigitalPresenceAudit } from '@/lib/ctp-digital-presence-run';
import { sendCtpExecutiveEmailForSubmission } from '@/lib/ctp-executive-email-send';
import { publicPortalUrl } from '@/lib/ctp-portal-host';
import { runCtpProduction } from '@/lib/ctp-production-run';
import { runCtpWorkspaceProvision } from '@/lib/ctp-workspace-provision';
import {
  executiveInputFromCtpSubmission,
  formatCursorHandoffMarkdown,
  generateCreativeExperienceBrief,
  runOpenDesignImplementationHandoff,
  type CursorHandoffPackage,
} from '@/lib/open-design';
import { resolveCtpOrganizationId } from '@/lib/ctp-studio-bridge';

export type CtpOpenDesignHandoffPayload = {
  mode: 'github-pr' | 'package-only' | 'failed';
  storySentence: string;
  creativeDnaSummary: string;
  deliverableTitles: string[];
  markdown: string;
  packageJson: CursorHandoffPackage;
  pullRequestUrl?: string;
};

export type CtpExecutiveAction =
  | 'ready_for_review'
  | 'approve_reveal'
  | 'run_production'
  | 'run_digital_audit'
  | 'run_open_design_handoff'
  | 'resend_executive_email'
  | 'reprovision_workspace';

function baseUrl(): string {
  return (process.env.REVEAL_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || EA_PLATFORM_URL).replace(
    /\/$/,
    '',
  );
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
): Promise<{
  ok: boolean;
  submission?: CtpSubmission;
  revealUrl?: string;
  handoffUrl?: string;
  handoff?: CtpOpenDesignHandoffPayload;
  error?: string;
}> {
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

  if (action === 'run_open_design_handoff') {
    const organizationId =
      (await resolveCtpOrganizationId(submission)) ??
      submission.portalSlug ??
      submission.considerSlug ??
      submission.id;
    const input = executiveInputFromCtpSubmission(submission, organizationId);
    const brief = generateCreativeExperienceBrief(input, {
      submissionId: submission.id,
      goalId: 'custom',
    });
    const result = await runOpenDesignImplementationHandoff(brief, {
      tenantId: submission.portalSlug ?? submission.considerSlug,
    });
    if (!result.ok) {
      return { ok: false, error: result.error ?? 'Open Design handoff failed.' };
    }
    const refreshed = await getCtpSubmissionById(submissionId);
    const handoff: CtpOpenDesignHandoffPayload = {
      mode: result.mode,
      storySentence: result.handoff.storySentence,
      creativeDnaSummary: result.handoff.creativeDnaSummary,
      deliverableTitles: result.handoff.deliverables.map((d) => d.title),
      markdown: formatCursorHandoffMarkdown(result.handoff),
      packageJson: result.handoff,
      pullRequestUrl: result.pullRequestUrl,
    };
    return {
      ok: true,
      submission: refreshed ?? submission,
      handoffUrl: result.pullRequestUrl,
      handoff,
    };
  }

  if (action === 'run_digital_audit') {
    const result = await runCtpDigitalPresenceAudit(submissionId, { force: true });
    if (!result.ok) {
      return { ok: false, error: result.error ?? 'Digital presence audit failed.' };
    }
    const refreshed = await getCtpSubmissionById(submissionId);
    if (!refreshed) {
      return { ok: false, error: 'Audit saved but submission reload failed.' };
    }
    return { ok: true, submission: refreshed };
  }

  if (action === 'resend_executive_email') {
    const portalUrl = submission.portalSlug
      ? publicPortalUrl(submission.portalSlug, 'ctp')
      : undefined;
    const result = await sendCtpExecutiveEmailForSubmission(submissionId, {
      force: true,
      portalUrl,
    });
    if (!result.ok) {
      return { ok: false, error: result.error ?? 'Executive email failed to send.' };
    }
    const refreshed = await getCtpSubmissionById(submissionId);
    if (!refreshed) {
      return { ok: false, error: 'Email sent but submission reload failed.' };
    }
    await emitPulseEvent({
      product: 'ea-platform',
      type: 'ctp.executive_email.resent',
      title: `CTP executive email resent — ${submission.businessName}`,
      detail: portalUrl || 'Sent without portal URL (workspace not active yet).',
      priority: 'medium',
      href: '/admin/ctp',
      objectId: submission.id,
      metadata: {
        ctpSubmissionId: submission.id,
        portalUrl: portalUrl ?? '',
      },
    });
    return { ok: true, submission: refreshed };
  }

  if (action === 'reprovision_workspace') {
    if (submission.workspaceStatus === 'Provisioning') {
      return { ok: false, error: 'Workspace provisioning already in progress.' };
    }
    if (submission.workspaceStatus === 'Active' && submission.portalSlug) {
      return {
        ok: false,
        error: 'Workspace is already active. Resend the executive email if the client needs the portal link.',
      };
    }

    // Allow retry from Failed / stuck non-pending states.
    if (submission.workspaceStatus !== 'Pending' && submission.workspaceStatus !== 'Failed') {
      const reset = await updateCtpSubmission(submissionId, {
        workspaceStatus: 'Pending',
        status: 'Workspace Pending',
      });
      if (!reset.ok) {
        return { ok: false, error: reset.error ?? 'Could not reset workspace status.' };
      }
    } else if (submission.workspaceStatus === 'Failed') {
      await updateCtpSubmission(submissionId, {
        workspaceStatus: 'Pending',
        status: 'Workspace Pending',
      });
    }

    const result = await runCtpWorkspaceProvision(submissionId);
    if (!result.ok) {
      return { ok: false, error: result.error ?? 'Workspace provision failed.' };
    }
    const refreshed = await getCtpSubmissionById(submissionId);
    if (!refreshed) {
      return { ok: false, error: 'Provision finished but submission reload failed.' };
    }
    return { ok: true, submission: refreshed };
  }

  return { ok: false, error: 'Unknown action.' };
}

/**
 * Documents — availability from Guide / Project State only.
 * WPS-* and infrastructure evidence never mark client docs ready.
 */
import { buildCtpAdminAssetViews, type CtpAdminAssetView } from '@/lib/ctp-admin-view';
import { ctpClientTypeLabel } from '@/lib/ctp-client-type';
import { designStudioPath } from '@/lib/ctp-opportunity-routes';
import { buildCtpPortalStatusView } from '@/lib/ctp-portal-status';
import { buildGuideProgressView } from '@/lib/ctp-guide-progress';
import { resolveGuideStages } from '@/lib/ctp-guide-stage-engine';
import { isAuthoritativeProposalId } from '@/lib/project-state-engine';
import type { CtpSubmission } from '@/lib/ctp-submissions';

export type CtpDocumentKind = 'upload' | 'deliverable' | 'link';

export type CtpDocumentItem = {
  id: string;
  kind: CtpDocumentKind;
  title: string;
  detail: string;
  why: string;
  when: string;
  after: string;
  href: string;
  external?: boolean;
  ready: boolean;
};

export type CtpDocumentsView = {
  businessName: string;
  clientTypeLabel?: string;
  headline: string;
  summary: string;
  guideStage: string;
  uploads: CtpAdminAssetView[];
  deliverables: CtpDocumentItem[];
  readyCount: number;
  totalCount: number;
};

export function buildCtpDocumentsView(submission: CtpSubmission, slug: string): CtpDocumentsView {
  const uploads = buildCtpAdminAssetViews(submission.assetManifest);
  const clientTypeLabel = submission.clientType
    ? ctpClientTypeLabel(submission.clientType)
    : undefined;
  const progressHref = designStudioPath(slug);
  const statusView = buildCtpPortalStatusView(submission);
  const guide = buildGuideProgressView(slug, statusView);
  const { current, done } = resolveGuideStages(statusView);

  const realProposalId = isAuthoritativeProposalId(submission.proposalId)
    ? submission.proposalId.trim()
    : '';

  const proposalReady =
    Boolean(realProposalId) &&
    (current === 'Proposal' || current === 'Agreement' || done.Proposal || done.Agreement);

  const strategyReady = done.Discovery || current === 'Strategy' || done.Strategy;
  const buildReady =
    done.Build ||
    current === 'Review' ||
    current === 'Launch' ||
    current === 'Care' ||
    done.Review;
  const liveReady =
    (current === 'Launch' || current === 'Care' || done.Launch) && Boolean(submission.siteUrl);
  const scheduleReady =
    Boolean(submission.reviewScheduledAt) ||
    (guide.nba.kind === 'meeting' && !guide.nba.nothingRequired);

  const deliverables: CtpDocumentItem[] = [
    {
      id: 'proposal',
      kind: 'deliverable',
      title: 'Your proposal',
      detail: proposalReady
        ? 'Your plan and investment are ready to review.'
        : 'Your proposal prepares when Strategy is complete — never from internal IDs.',
      why: 'So you can decide with full context — plan, investment, and next steps in one place.',
      when: 'When Progress asks you to review or confirm your proposal.',
      after: 'Confirm when you’re ready. We’ll move into Design and update your Guide.',
      href: proposalReady
        ? `/proposal/${encodeURIComponent(realProposalId)}`
        : progressHref,
      ready: proposalReady,
    },
    {
      id: 'strategy-priorities',
      kind: 'deliverable',
      title: 'Strategy priorities',
      detail: strategyReady
        ? 'A clear view of where capacity and opportunity show up for your business.'
        : 'Prepares as we finish Discovery and shape Strategy.',
      why: 'Helps you see what matters most before the plan is finalized.',
      when: 'When your Guide is in Strategy — or Progress highlights it.',
      after: 'We’ll use your reactions to refine the proposal and next actions.',
      href: progressHref,
      ready: strategyReady,
    },
    {
      id: 'recommended-next-steps',
      kind: 'deliverable',
      title: 'Recommended next steps',
      detail: guide.nba.nothingRequired
        ? "We've got everything we need — check Progress for what’s happening now."
        : `Current next step: ${guide.nba.label}`,
      why: 'So you always know what creates the most capacity next.',
      when: 'Whenever Progress points you here.',
      after: 'Return to Progress — your Next Best Action will stay current.',
      href: guide.nba.href || progressHref,
      ready: true,
    },
    {
      id: 'build-package',
      kind: 'deliverable',
      title: 'Build package',
      detail: buildReady
        ? 'Items prepared for your review path.'
        : 'Assembles as we craft your website and portal.',
      why: 'This is the working package behind your reviewable presence.',
      when: 'When Progress says your website is ready for review.',
      after: 'Share feedback in Review. We’ll refine and move toward launch.',
      href: progressHref,
      ready: buildReady,
    },
    {
      id: 'progress',
      kind: 'link',
      title: 'Your Project (Guide home)',
      detail: `${guide.currentStage} — ${guide.nba.label}`,
      why: 'This is the front door for your entire project experience.',
      when: 'Anytime — especially after you finish a task elsewhere.',
      after: 'You’ll always see one clear Next Best Action.',
      href: progressHref,
      ready: true,
    },
  ];

  if (scheduleReady) {
    deliverables.push({
      id: 'schedule',
      kind: 'link',
      title: 'Strategy conversation',
      detail: submission.reviewScheduledAt
        ? `Scheduled ${new Date(submission.reviewScheduledAt).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}`
        : 'Book when Progress asks — not before.',
      why: 'A short conversation aligns priorities before the plan is finalized.',
      when: 'Only when your Next Best Action asks you to schedule.',
      after: 'We’ll prepare your proposal with that context and update Progress.',
      href: guide.nba.kind === 'meeting' && guide.nba.href
        ? guide.nba.href
        : `/portal/${slug}/ctp/schedule`,
      ready: true,
    });
  }

  if (liveReady && submission.siteUrl) {
    deliverables.unshift({
      id: 'live-site',
      kind: 'link',
      title: 'Live website',
      detail: 'Your presence is live for customers to meet.',
      why: 'This is the site your customers will experience.',
      when: 'On launch day — and anytime you want to share it.',
      after: 'Tell us if anything needs a quick fix. Care continues in Progress.',
      href: submission.siteUrl,
      external: true,
      ready: true,
    });
  }

  if ((current === 'Care' || done.Launch) && submission.portalSlug) {
    deliverables.push({
      id: 'launch-moment',
      kind: 'deliverable',
      title: 'Launch celebration',
      detail: 'A warm look at what you built together.',
      why: 'To mark the moment your presence went live.',
      when: 'After launch — take a moment, then return to Care.',
      after: 'Progress stays your home for support and next chapters.',
      href: `/reveal/${encodeURIComponent(submission.portalSlug)}`,
      ready: true,
    });
  }

  const readyDeliverables = deliverables.filter((item) => item.ready).length;
  const readyCount = readyDeliverables + uploads.length;
  const totalCount = deliverables.length + Math.max(uploads.length, 1);

  return {
    businessName: submission.businessName,
    clientTypeLabel,
    headline: `${submission.businessName} — Documents`,
    summary: `You're in ${guide.currentStage}. ${guide.confidenceMessage}`,
    guideStage: guide.currentStage,
    uploads,
    deliverables,
    readyCount,
    totalCount,
  };
}

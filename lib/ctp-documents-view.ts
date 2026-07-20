/**
 * CTP Documents vault — client-language deliverables for the Guide.
 */
import { buildCtpAdminAssetViews, type CtpAdminAssetView } from '@/lib/ctp-admin-view';
import { ctpClientTypeLabel } from '@/lib/ctp-client-type';
import { designStudioPath } from '@/lib/ctp-opportunity-routes';
import type { CtpSubmission } from '@/lib/ctp-submissions';

export type CtpDocumentKind = 'upload' | 'deliverable' | 'link';

export type CtpDocumentItem = {
  id: string;
  kind: CtpDocumentKind;
  title: string;
  detail: string;
  /** Why this document is available now. */
  why: string;
  /** When the client should review it. */
  when: string;
  /** What happens after they complete / review it. */
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

  const deliverables: CtpDocumentItem[] = [
    {
      id: 'proposal',
      kind: 'deliverable',
      title: 'Your proposal',
      detail: submission.proposalId
        ? 'Your plan and investment are ready to review.'
        : 'Your proposal prepares after Discovery and Strategy.',
      why: 'So you can decide with full context — plan, investment, and next steps in one place.',
      when: 'When Progress asks you to review or confirm your proposal.',
      after: 'Confirm when you’re ready. We’ll move into Design and update your Guide.',
      href: submission.proposalId
        ? `/proposal/${encodeURIComponent(submission.proposalId)}`
        : progressHref,
      ready: Boolean(submission.proposalId),
    },
    {
      id: 'strategy-priorities',
      kind: 'deliverable',
      title: 'Strategy priorities',
      detail: submission.executiveSnapshot
        ? 'A clear view of where capacity and opportunity show up for your business.'
        : 'Prepares as we finish Discovery and shape Strategy.',
      why: 'Helps you see what matters most before the plan is finalized.',
      when: 'Before or during your strategy conversation — or when Progress highlights it.',
      after: 'We’ll use your reactions to refine the proposal and next actions.',
      href: progressHref,
      ready: Boolean(submission.executiveSnapshot || submission.snapshotSummary),
    },
    {
      id: 'recommended-next-steps',
      kind: 'deliverable',
      title: 'Recommended next steps',
      detail: 'Priorities and actions that keep momentum without overwhelm.',
      why: 'So you always know what creates the most capacity next.',
      when: 'Whenever Progress points you here, or when you want a quiet check-in.',
      after: 'Return to Progress — your Next Best Action will stay current.',
      href: progressHref,
      ready: Boolean(
        submission.intakeAnalysis?.summary ||
          submission.productionPackage ||
          (Array.isArray(submission.recommendations) && submission.recommendations.length),
      ),
    },
    {
      id: 'build-package',
      kind: 'deliverable',
      title: 'Build package',
      detail: submission.productionPackage
        ? `${submission.productionPackage.artifacts.length} items ready for your review path.`
        : 'Assembles as we craft your website and portal.',
      why: 'This is the working package behind your reviewable presence.',
      when: 'When Progress says your website is ready for review.',
      after: 'Share feedback in Review. We’ll refine and move toward launch.',
      href: progressHref,
      ready: Boolean(submission.productionPackage?.artifacts?.length),
    },
    {
      id: 'progress',
      kind: 'link',
      title: 'Your Project (Guide home)',
      detail: 'Where you are, what happened, and the one next step.',
      why: 'This is the front door for your entire project experience.',
      when: 'Anytime — especially after you finish a task elsewhere.',
      after: 'You’ll always see one clear Next Best Action.',
      href: progressHref,
      ready: true,
    },
    {
      id: 'schedule',
      kind: 'link',
      title: 'Strategy conversation',
      detail: submission.reviewScheduledAt
        ? `Scheduled ${new Date(submission.reviewScheduledAt).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}`
        : 'Book a strategy conversation when Progress asks.',
      why: 'A short conversation aligns priorities before the plan is finalized.',
      when: 'When your Next Best Action asks you to schedule.',
      after: 'We’ll prepare your proposal with that context and update Progress.',
      href: `/portal/${slug}/ctp/schedule`,
      ready: true,
    },
  ];

  if (submission.siteUrl) {
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

  if (submission.status === 'Completed' && submission.portalSlug) {
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
    summary:
      'Everything prepared for you — with clear guidance on why it’s here, when to review it, and what happens next.',
    uploads,
    deliverables,
    readyCount,
    totalCount,
  };
}

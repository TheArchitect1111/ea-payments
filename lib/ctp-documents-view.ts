/**
 * CTP Documents vault — uploaded assets + generated deliverable links.
 */
import { buildCtpAdminAssetViews, type CtpAdminAssetView } from '@/lib/ctp-admin-view';
import { ctpClientTypeLabel } from '@/lib/ctp-client-type';
import type { CtpSubmission } from '@/lib/ctp-submissions';

export type CtpDocumentKind = 'upload' | 'deliverable' | 'link';

export type CtpDocumentItem = {
  id: string;
  kind: CtpDocumentKind;
  title: string;
  detail: string;
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

  const deliverables: CtpDocumentItem[] = [
    {
      id: 'executive-brief',
      kind: 'deliverable',
      title: 'Executive brief / proposal',
      detail: submission.proposalId
        ? `Proposal ${submission.proposalId}`
        : 'Proposal link prepares after assessment save.',
      href: submission.proposalId
        ? `/proposal/${encodeURIComponent(submission.proposalId)}`
        : `/portal/${slug}/ctp`,
      ready: Boolean(submission.proposalId),
    },
    {
      id: 'executive-snapshot',
      kind: 'deliverable',
      title: 'Executive Snapshot (BI)',
      detail: submission.executiveSnapshot
        ? `Maturity ${submission.executiveSnapshot.operationalMaturity}/100`
        : 'Available for BI tracks after capacity analysis.',
      href: `/portal/${slug}/ctp/bi`,
      ready: Boolean(submission.executiveSnapshot),
    },
    {
      id: 'recommendations',
      kind: 'deliverable',
      title: 'Recommendations pack',
      detail: 'Opportunities, next steps, and production focus.',
      href: `/portal/${slug}/ctp/recommendations`,
      ready: Boolean(
        submission.intakeAnalysis?.summary ||
          submission.productionPackage ||
          (Array.isArray(submission.recommendations) && submission.recommendations.length),
      ),
    },
    {
      id: 'production-package',
      kind: 'deliverable',
      title: 'AI production package',
      detail: submission.productionPackage
        ? `${submission.productionPackage.artifacts.length} artifacts · ${submission.productionPackage.timelineLabel}`
        : 'Builds after intake / studio / website production runs.',
      href: `/portal/${slug}/ctp`,
      ready: Boolean(submission.productionPackage?.artifacts?.length),
    },
    {
      id: 'progress',
      kind: 'link',
      title: 'Live project progress',
      detail: 'Timeline, Design Studio, and status.',
      href: `/portal/${slug}/ctp`,
      ready: true,
    },
    {
      id: 'schedule',
      kind: 'link',
      title: 'Scheduling & review',
      detail: submission.reviewScheduledAt
        ? `Review ${new Date(submission.reviewScheduledAt).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}`
        : 'Book a strategy session or view confirmed review time.',
      href: `/portal/${slug}/ctp/schedule`,
      ready: true,
    },
  ];

  if (submission.siteUrl) {
    deliverables.unshift({
      id: 'live-site',
      kind: 'link',
      title: 'Live starter website',
      detail: submission.siteUrl,
      href: submission.siteUrl,
      external: true,
      ready: true,
    });
  }

  if (submission.status === 'Completed' && submission.portalSlug) {
    deliverables.push({
      id: 'reveal',
      kind: 'deliverable',
      title: 'Reveal experience',
      detail: 'Unlocked celebration of what was built.',
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
      'Your CTP document vault: uploaded brand assets plus generated deliverables as they become ready.',
    uploads,
    deliverables,
    readyCount,
    totalCount,
  };
}

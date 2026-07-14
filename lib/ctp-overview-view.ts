/**
 * CTP Overview hub — Phase 8 landing for all CTP portal surfaces.
 */
import { ctpClientTypeLabel } from '@/lib/ctp-client-type';
import { buildCtpPortalStatusView } from '@/lib/ctp-portal-status';
import type { CtpSubmission } from '@/lib/ctp-submissions';

export type CtpOverviewCard = {
  id: string;
  title: string;
  detail: string;
  href: string;
  status: 'ready' | 'active' | 'pending';
  statusLabel: string;
};

export type CtpOverviewView = {
  businessName: string;
  clientTypeLabel?: string;
  status: string;
  percentComplete: number;
  headline: string;
  summary: string;
  cards: CtpOverviewCard[];
  siteUrl?: string;
  maturityScore?: number;
  digitalScore?: number;
  socialScore?: number;
  gbpScore?: number;
};

export function buildCtpOverviewView(submission: CtpSubmission, slug: string): CtpOverviewView {
  const statusView = buildCtpPortalStatusView(submission);
  const clientTypeLabel = submission.clientType
    ? ctpClientTypeLabel(submission.clientType)
    : undefined;

  const studioReady = statusView.designStudio.filter((item) => item.status === 'ready').length;
  const studioTotal = statusView.designStudio.length;

  const cards: CtpOverviewCard[] = [
    {
      id: 'progress',
      title: 'Progress',
      detail: `${statusView.percentComplete}% complete · live timeline`,
      href: `/portal/${slug}/ctp/progress`,
      status: statusView.percentComplete >= 100 ? 'ready' : 'active',
      statusLabel: statusView.percentComplete >= 100 ? 'Complete' : 'Live',
    },
    {
      id: 'design-studio',
      title: 'Design Studio',
      detail: `${studioReady}/${studioTotal} inputs ready · brand uploads`,
      href: `/portal/${slug}/ctp/progress`,
      status: studioReady >= Math.ceil(studioTotal / 2) ? 'ready' : 'active',
      statusLabel: `${studioReady}/${studioTotal}`,
    },
    {
      id: 'bi',
      title: 'Business Intelligence',
      detail: submission.executiveSnapshot
        ? `Maturity ${submission.executiveSnapshot.operationalMaturity}/100`
        : 'Executive Snapshot for BI tracks',
      href: `/portal/${slug}/ctp/bi`,
      status: submission.executiveSnapshot ? 'ready' : 'pending',
      statusLabel: submission.executiveSnapshot ? 'Ready' : 'Preparing',
    },
    {
      id: 'recommendations',
      title: 'Recommendations',
      detail: 'Opportunities, next steps, production focus',
      href: `/portal/${slug}/ctp/recommendations`,
      status:
        submission.intakeAnalysis?.summary || submission.productionPackage ? 'ready' : 'pending',
      statusLabel:
        submission.intakeAnalysis?.summary || submission.productionPackage ? 'Ready' : 'Preparing',
    },
    {
      id: 'documents',
      title: 'Documents',
      detail: 'Deliverables vault + Design Studio uploads',
      href: `/portal/${slug}/ctp/documents`,
      status: 'ready',
      statusLabel: 'Open',
    },
    {
      id: 'schedule',
      title: 'Scheduling',
      detail: submission.reviewScheduledAt
        ? `Review ${new Date(submission.reviewScheduledAt).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}`
        : 'Book strategy session / view review time',
      href: `/portal/${slug}/ctp/schedule`,
      status: submission.reviewScheduledAt ? 'ready' : 'active',
      statusLabel: submission.reviewScheduledAt ? 'Scheduled' : 'Book',
    },
    {
      id: 'support',
      title: 'Messages & Support',
      detail: 'Advisor messaging, email, and Calendly',
      href: `/portal/${slug}/ctp/support`,
      status: 'ready',
      statusLabel: 'Open',
    },
  ];

  if (submission.siteUrl) {
    cards.splice(1, 0, {
      id: 'site',
      title: 'Live website',
      detail: submission.siteUrl,
      href: submission.siteUrl,
      status: 'ready',
      statusLabel: 'Live',
    });
  }

  return {
    businessName: submission.businessName,
    clientTypeLabel,
    status: submission.status,
    percentComplete: statusView.percentComplete,
    headline: `${submission.businessName} — Overview`,
    summary:
      'Your Consider the Possibilities workspace. Open any surface below — progress, intelligence, recommendations, documents, scheduling, and support.',
    cards,
    siteUrl: submission.siteUrl,
    maturityScore: submission.executiveSnapshot?.operationalMaturity,
    digitalScore: submission.digitalPresenceAudit?.overallScore,
    socialScore: submission.digitalPresenceAudit?.scores?.socialPresence,
    gbpScore: submission.digitalPresenceAudit?.scores?.googleBusinessProfile,
  };
}

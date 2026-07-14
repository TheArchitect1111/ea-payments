/**
 * Pure view-model for the CTP keynote reveal experience.
 */
import { ctpClientTypeLabel } from '@/lib/ctp-client-type';
import { publicPortalUrl } from '@/lib/ctp-portal-host';
import type { CtpSubmission } from '@/lib/ctp-submissions';

export type CtpRevealMetric = {
  label: string;
  value: string;
  detail?: string;
};

export type CtpRevealView = {
  brandName: string;
  contactName: string;
  headline: string;
  lede: string;
  trackLabel?: string;
  unlocked: boolean;
  deliverables: string[];
  metrics: CtpRevealMetric[];
  siteUrl?: string;
  portalPath: string;
  progressPath: string;
  calendlyUrl: string;
  productionHeadline?: string;
};

const DEFAULT_CALENDLY =
  process.env.CALENDLY_URL ?? 'https://calendly.com/freedom-efficiencyarchitects/30min';

function fmtMoney(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n);
}

export function buildCtpRevealView(input: {
  slug: string;
  brandName: string;
  contactName: string;
  amountPaid?: number;
  ctp?: CtpSubmission | null;
  calendlyUrl?: string;
}): CtpRevealView {
  const ctp = input.ctp ?? null;
  const trackLabel = ctp?.clientType ? ctpClientTypeLabel(ctp.clientType) : undefined;
  const unlocked = ctp?.status === 'Completed';

  const deliverables = [
    'Your client portal is ready',
    ctp?.siteUrl ? 'Your starter website is live on the EA hub' : 'Your core operating structure is in place',
    trackLabel ? `${trackLabel} path is unlocked` : 'Your training and next steps are prepared',
    ctp?.executiveSnapshot
      ? `Executive Snapshot complete — maturity ${ctp.executiveSnapshot.operationalMaturity}/100`
      : 'Your executive brief and progress workspace are available',
    ...(ctp?.productionPackage?.artifacts.slice(0, 2).map((a) => a.title) ?? []),
  ].slice(0, 6);

  const metrics: CtpRevealMetric[] = [
    {
      label: 'Reveal status',
      value: unlocked ? 'Unlocked' : 'Ready',
      detail: unlocked ? 'Approved and delivered' : 'Prepared for your unlock',
    },
  ];

  if (typeof ctp?.executiveSnapshot?.operationalMaturity === 'number') {
    metrics.push({
      label: 'Operational maturity',
      value: `${ctp.executiveSnapshot.operationalMaturity}/100`,
      detail: `Admin drag ~${ctp.executiveSnapshot.adminWastePercent}%`,
    });
  }

  if (typeof ctp?.digitalPresenceAudit?.overallScore === 'number') {
    const audit = ctp.digitalPresenceAudit;
    const parts: string[] = [];
    if (typeof audit.scores?.socialPresence === 'number') {
      parts.push(`Social ${audit.scores.socialPresence}`);
    }
    if (typeof audit.scores?.googleBusinessProfile === 'number') {
      parts.push(`GBP ${audit.scores.googleBusinessProfile}`);
    }
    metrics.push({
      label: 'Digital presence',
      value: `${audit.overallScore}/100`,
      detail: parts.length ? parts.join(' · ') : 'Baseline before the build',
    });
  } else if (
    metrics.length < 2 &&
    input.amountPaid &&
    input.amountPaid > 0
  ) {
    metrics.push({
      label: 'Investment confirmed',
      value: fmtMoney(input.amountPaid),
    });
  }

  if (metrics.length < 3) {
    if (typeof ctp?.executiveSnapshot?.weeklyHoursRecoverable === 'number') {
      metrics.push({
        label: 'Hours / week recoverable',
        value: String(ctp.executiveSnapshot.weeklyHoursRecoverable),
        detail: 'Capacity returned to the business',
      });
    } else if (ctp?.productionPackage?.artifacts.length) {
      metrics.push({
        label: 'Production artifacts',
        value: String(ctp.productionPackage.artifacts.length),
        detail: ctp.productionPackage.timelineLabel,
      });
    }
  }

  return {
    brandName: input.brandName,
    contactName: input.contactName,
    headline: 'Welcome to the other side.',
    lede: 'This is not a file drop. It is the moment your transformation becomes visible.',
    trackLabel,
    unlocked,
    deliverables,
    metrics: metrics.slice(0, 3),
    siteUrl: ctp?.siteUrl,
    portalPath: publicPortalUrl(input.slug, 'ctp'),
    progressPath: publicPortalUrl(input.slug, 'ctp/progress'),
    calendlyUrl: input.calendlyUrl ?? DEFAULT_CALENDLY,
    productionHeadline: ctp?.productionPackage?.headline,
  };
}

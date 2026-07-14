import type { ContentRequestRecord } from './airtable';
import type { CaptureRecord } from './capture-records';
import { listRecentPulseEvents } from './pulse-bus';
import { EA_PLATFORM_URL, EA_SATELLITE_URLS } from './platform-urls';

export interface AttentionItem {
  id: string;
  product: string;
  title: string;
  detail: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  href?: string;
  cta?: string;
}

export function buildAttentionItems(input: {
  captures: CaptureRecord[];
  contentRequests: ContentRequestRecord[];
  proposalsPendingReview: number;
  onboardingWebhooksMissing: boolean;
  captureApiKeyMissing: boolean;
  cprAthleteCount: number;
  cprActiveCount: number;
  brotherHubMembers: number;
  sisterHubMembers: number;
  clientsStuckOnboarding?: number;
  discoveryFollowUpCount?: number;
  ctpWorkspacesPending?: number;
  ctpStudiosInProgress?: number;
  ctpStudiosReadyForReview?: number;
  ctpReviewsScheduled?: number;
  ctpExecutiveEmailsPending?: number;
}): AttentionItem[] {
  const items: AttentionItem[] = [];

  if ((input.ctpStudiosReadyForReview ?? 0) > 0) {
    items.push({
      id: 'ctp-studios-ready',
      product: 'Consider the Possibilities™',
      title: `${input.ctpStudiosReadyForReview} CTP workspace(s) ready for review`,
      detail: 'All design studios complete — schedule the collaborative review.',
      priority: 'high',
      href: '/admin/ctp',
      cta: 'Open CTP desk',
    });
  }

  if ((input.ctpExecutiveEmailsPending ?? 0) > 0) {
    items.push({
      id: 'ctp-executive-emails-pending',
      product: 'Consider the Possibilities™',
      title: `${input.ctpExecutiveEmailsPending} CTP executive email(s) not sent`,
      detail: 'Portal is active but the executive brief never went out. Resend from the CTP desk.',
      priority: 'high',
      href: '/admin/ctp',
      cta: 'Resend email',
    });
  }

  if ((input.ctpWorkspacesPending ?? 0) > 0) {
    items.push({
      id: 'ctp-workspaces-pending',
      product: 'Consider the Possibilities™',
      title: `${input.ctpWorkspacesPending} CTP workspace(s) pending provisioning`,
      detail: 'A prospect completed CTP but the workspace did not finish opening. Re-run provisioning.',
      priority: 'high',
      href: '/admin/ctp',
      cta: 'Re-provision',
    });
  }

  if ((input.ctpStudiosInProgress ?? 0) > 0) {
    items.push({
      id: 'ctp-studios-in-progress',
      product: 'Consider the Possibilities™',
      title: `${input.ctpStudiosInProgress} CTP Design Studio(s) in progress`,
      detail: 'Clients are still completing brand inputs — monitor for stalls.',
      priority: 'medium',
      href: '/admin/ctp',
      cta: 'Open CTP desk',
    });
  }

  if ((input.ctpReviewsScheduled ?? 0) > 0) {
    items.push({
      id: 'ctp-reviews-scheduled',
      product: 'Consider the Possibilities™',
      title: `${input.ctpReviewsScheduled} CTP review(s) scheduled`,
      detail: 'Prepare proposals and implementation tasks for upcoming reviews.',
      priority: 'medium',
      href: '/admin/ctp',
      cta: 'Open CTP desk',
    });
  }

  if (input.onboardingWebhooksMissing) {
    items.push({
      id: 'env-webhooks',
      product: 'EA Platform',
      title: 'Onboarding automation not connected',
      detail: 'Set ONBOARDING_WEBHOOK_URL and ESIGN_WEBHOOK_URL on Vercel for full launch.',
      priority: 'critical',
      href: `${EA_PLATFORM_URL}/api/health/launch`,
      cta: 'Health check',
    });
  }

  if ((input.clientsStuckOnboarding ?? 0) > 0) {
    items.push({
      id: 'onboarding-stuck',
      product: 'EA Platform',
      title: `${input.clientsStuckOnboarding} client(s) in onboarding > 7 days`,
      detail: 'Review Client Records — welcome email, Make webhook, and portal access.',
      priority: 'high',
      href: '/admin/master',
      cta: 'View clients',
    });
  }

  if ((input.discoveryFollowUpCount ?? 0) > 0) {
    items.push({
      id: 'discovery-follow-up',
      product: 'Lead Hub',
      title: `${input.discoveryFollowUpCount} discovery follow-up(s) needed`,
      detail: 'Prospects need scheduling or no-show follow-up.',
      priority: 'high',
      href: '/admin/proposals',
      cta: 'Pipeline',
    });
  }

  if (input.captureApiKeyMissing) {
    items.push({
      id: 'env-capture-key',
      product: 'Amplifi',
      title: 'Desktop screenshot capture needs API key',
      detail: 'Use /extension/connect to pair the Chrome/Firefox extension (or set EA_CAPTURE_API_KEY).',
      priority: 'high',
      href: `${EA_PLATFORM_URL}/amplifi/install`,
      cta: 'Install guide',
    });
  }

  if (input.proposalsPendingReview > 0) {
    items.push({
      id: 'proposals-pending',
      product: 'EA Platform',
      title: `${input.proposalsPendingReview} proposal(s) pending review`,
      detail: 'Revenue waiting on admin approval.',
      priority: 'high',
      href: '/admin/proposals',
      cta: 'Review',
    });
  }

  const pendingUpdates = input.contentRequests.filter((r) =>
    ['Pending Review', 'In Progress', 'Awaiting Approval'].includes(r.status),
  );
  if (pendingUpdates.length > 0) {
    items.push({
      id: 'updates-pending',
      product: 'Update Hub',
      title: `${pendingUpdates.length} update request(s) need action`,
      detail: pendingUpdates[0]?.title ?? 'Client communications waiting.',
      priority: 'high',
      href: '/admin/content-requests',
      cta: 'Open queue',
    });
  }

  const analyzing = input.captures.filter((c) => c.status === 'Analyzing');
  if (analyzing.length > 0) {
    items.push({
      id: 'captures-processing',
      product: 'Simplifi',
      title: `${analyzing.length} capture(s) processing`,
      detail: 'Magnifi stories building in background.',
      priority: 'medium',
      href: '/admin/resource-radar',
      cta: 'View captures',
    });
  }

  if (input.cprAthleteCount > 0 && input.cprActiveCount < input.cprAthleteCount) {
    items.push({
      id: 'cpr-onboarding',
      product: 'CPR',
      title: 'CPR athletes need onboarding completion',
      detail: `${input.cprActiveCount} active of ${input.cprAthleteCount} total athletes.`,
      priority: 'medium',
      href: EA_SATELLITE_URLS.cpr,
      cta: 'Open CPR',
    });
  }

  for (const evt of listRecentPulseEvents(8)) {
    if (evt.priority === 'critical' || evt.priority === 'high') {
      items.push({
        id: `evt-${evt.at}-${evt.type}`,
        product: evt.product,
        title: evt.title,
        detail: evt.detail ?? '',
        priority: evt.priority ?? 'medium',
        href: evt.href,
        cta: 'Open',
      });
    }
  }

  return items
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.priority] - order[b.priority];
    })
    .slice(0, 12);
}

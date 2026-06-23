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
}): AttentionItem[] {
  const items: AttentionItem[] = [];

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
      detail: 'Set EA_CAPTURE_API_KEY on Vercel and in the Chrome/Firefox extension.',
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

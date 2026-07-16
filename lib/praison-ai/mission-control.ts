/**
 * Mission Control workforce status lane.
 */

import type { AttentionItem } from '@/lib/pulse-attention';
import type { ExecutiveIntelligencePackage, WorkforceReviewStatus } from './types';

export const MISSION_CONTROL_WORKFORCE_LABELS: Record<WorkforceReviewStatus, string> = {
  'research-complete': 'Research Complete',
  'website-review-complete': 'Website Review Complete',
  'proposal-draft-ready': 'Proposal Draft Ready',
  'qa-passed': 'QA Passed',
  'qa-failed': 'QA Failed',
  'blueprint-ready': 'Blueprint Ready',
  'awaiting-executive-review': 'Waiting for Executive Review',
  approved: 'Approved',
};

export function workforceStatusLabel(status: WorkforceReviewStatus): string {
  return MISSION_CONTROL_WORKFORCE_LABELS[status];
}

export function buildWorkforceAttentionItems(
  packages: Array<
    Pick<
      ExecutiveIntelligencePackage,
      'id' | 'submissionId' | 'businessName' | 'reviewStatus' | 'qa' | 'pulseInsights'
    >
  >,
): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const pkg of packages) {
    if (pkg.qa && !pkg.qa.passed) {
      items.push({
        id: `praison-qa-failed-${pkg.submissionId}`,
        product: 'PraisonAI Workforce',
        title: `QA blocked — ${pkg.businessName}`,
        detail: pkg.qa.blockers[0] ?? 'Workforce outputs failed quality review.',
        priority: 'high',
        href: '/admin/ctp',
        cta: 'Review workforce',
      });
      continue;
    }

    if (pkg.reviewStatus === 'awaiting-executive-review') {
      items.push({
        id: `praison-executive-review-${pkg.submissionId}`,
        product: 'PraisonAI Workforce',
        title: `Executive review ready — ${pkg.businessName}`,
        detail: pkg.pulseInsights[0] ?? 'Intelligence package ready for executive review.',
        priority: 'high',
        href: '/admin/ctp',
        cta: 'Review intelligence',
      });
    }

    if (pkg.reviewStatus === 'blueprint-ready') {
      items.push({
        id: `praison-blueprint-${pkg.submissionId}`,
        product: 'PraisonAI Workforce',
        title: `Blueprint ready — ${pkg.businessName}`,
        detail: 'Proposal and portal blueprints are ready for Make.com fulfillment.',
        priority: 'medium',
        href: '/admin/ctp',
        cta: 'Open CTP desk',
      });
    }
  }

  return items;
}

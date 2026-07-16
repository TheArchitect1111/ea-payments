/**
 * Mission Control creative status lane.
 */

import type { AttentionItem } from '@/lib/pulse-attention';
import type { CreativeExperienceBrief, CreativeReviewStatus } from './types';
import { CREATIVE_REVIEW_LABELS } from './pipeline';

export function creativeStatusLabel(status: CreativeReviewStatus): string {
  return CREATIVE_REVIEW_LABELS[status];
}

export function buildCreativeAttentionItems(
  briefs: Array<Pick<CreativeExperienceBrief, 'id' | 'organizationId' | 'profile' | 'reviewStatus' | 'blockers' | 'phase'>>,
): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const brief of briefs) {
    if (brief.blockers.length > 0) {
      items.push({
        id: `open-design-blocked-${brief.id}`,
        product: 'Open Design',
        title: `Story gate blocked — ${brief.profile.organizationName}`,
        detail: brief.blockers[0],
        priority: 'high',
        href: '/admin/creative-studio',
        cta: 'Complete story',
      });
      continue;
    }

    if (brief.reviewStatus === 'awaiting-executive-review') {
      items.push({
        id: `open-design-review-${brief.id}`,
        product: 'Open Design',
        title: `Creative review ready — ${brief.profile.organizationName}`,
        detail: 'Homepage and experience concepts are ready for executive review.',
        priority: 'high',
        href: '/admin/creative-studio',
        cta: 'Review creative',
      });
    }
  }

  return items;
}

export const MISSION_CONTROL_CREATIVE_STATUSES: CreativeReviewStatus[] = [
  'research-complete',
  'story-extracted',
  'creative-dna-generated',
  'homepage-concept-ready',
  'portal-concept-ready',
  'presentation-ready',
  'awaiting-executive-review',
];

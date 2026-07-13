import { resolveGuideContext } from '@/lib/ea-guide';
import { resolveGuidePageContext } from '@/lib/ea-guide-context';
import { getPageSpecificHint } from '@/lib/ea-guide-knowledge';
import type { AdvisorBriefModel, DiscoverSignal } from './types';

const ATTENTION_STATES = new Set(['alert', 'warning', 'success']);

export function buildAdvisorBrief(pathname: string, userId?: string): AdvisorBriefModel {
  const pageContext = resolveGuidePageContext(pathname, userId);
  const context = resolveGuideContext(pathname);
  const pageHint = getPageSpecificHint(pageContext);

  return {
    greeting: context.greeting,
    pageLabel: pageContext.label,
    situation: pageHint,
    recommendation: context.recommendedAction,
    recommendationDetail: context.recommendationDetail,
    why: context.recommendationWhy?.[0] ?? context.sinceLastVisit[0] ?? '',
    whyBullets: context.recommendationWhy ?? context.sinceLastVisit,
    primaryAction: context.actions[0],
    secondaryAction: context.actions[1],
    badgeLabel: context.badgeLabel,
    needsAttention: ATTENTION_STATES.has(context.state),
    details: {
      today: context.dailyBrief ?? context.sinceLastVisit,
      aboutPage: pageHint,
      organization: context.opportunityHealth ?? [],
      wins: context.winWall ?? [],
    },
    pageContext,
    contextId: context.id,
  };
}

export function applyDiscoverSignal(brief: AdvisorBriefModel, signal: DiscoverSignal | null): AdvisorBriefModel {
  if (!signal) return brief;

  return {
    ...brief,
    situation: signal.helper || brief.situation,
    recommendation: signal.sectionTitle || brief.recommendation,
    recommendationDetail: signal.progressMessage || brief.recommendationDetail,
    why: signal.question || brief.why,
    whyBullets: signal.answer
      ? [`Current selection: ${signal.answer}`, ...brief.whyBullets.slice(0, 2)]
      : brief.whyBullets,
    pageLabel: signal.pageLabel || brief.pageLabel,
    needsAttention: signal.reviewMode || brief.needsAttention,
  };
}

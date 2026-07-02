import type { IntentRouteResult } from '@/lib/intent-router';

/** Map chassis intent routes to EA Voice response shape. */
export function voiceIntentFromRoute(route: IntentRouteResult, query: string) {
  const sources = ['EA intent router'];

  if (route.whyRecommended) sources.push(route.whyRecommended);

  switch (route.type) {
    case 'navigate':
      return {
        action: 'navigate' as const,
        href: route.href,
        query: route.query ?? query,
        message: route.message,
        confidence: route.confidence,
        sources,
      };
    case 'tour':
      return {
        action: 'tour' as const,
        message: route.message,
        confidence: route.confidence,
        sources,
      };
    case 'capture':
      return {
        action: 'capture' as const,
        message: route.message,
        confidence: route.confidence,
        sources,
      };
    case 'audit':
      return {
        action: 'audit' as const,
        href: route.href,
        query: route.query ?? query,
        message: route.message,
        confidence: route.confidence,
        sources,
      };
    case 'analyze':
      return {
        action: 'analyze' as const,
        href: route.href,
        query: route.query ?? query,
        message: route.message,
        confidence: route.confidence,
        sources,
      };
    case 'orchestrate':
      return {
        action: orchestratorAction(route.orchestratorIntent),
        href: orchestratorHref(route.orchestratorIntent, route.query ?? query),
        query: route.query ?? query,
        message: route.message,
        confidence: route.confidence,
        sources,
      };
    case 'explain':
    default:
      return {
        action: 'explain' as const,
        message: route.message,
        confidence: route.confidence,
        sources,
      };
  }
}

function orchestratorAction(intent?: string): 'navigate' | 'unknown' {
  if (!intent) return 'unknown';
  if (intent === 'general') return 'unknown';
  return 'navigate';
}

function orchestratorHref(intent?: string, query?: string): string | undefined {
  if (!intent) return undefined;

  switch (intent) {
    case 'create-proposal':
      return query
        ? `/admin/proposals?intent=${encodeURIComponent(query)}`
        : '/admin/proposals';
    case 'research':
      return query
        ? `/admin/resource-radar?q=${encodeURIComponent(query)}`
        : '/admin/resource-radar';
    case 'generate-blueprint':
      return '/admin/blueprints';
    case 'general':
      return `/admin/ea-guide?q=${encodeURIComponent(query ?? '')}`;
    default:
      return undefined;
  }
}

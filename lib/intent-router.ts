import {
  routeIntent as routeChassisIntent,
  type IntentRouteResult as ChassisIntentRouteResult,
  type IntentRouteType,
  type IntentRouterConfig,
} from '@ea/portal-chassis/intent';
import { parseVoiceQuery, type VoiceIntent } from '@/lib/ea-voice';

export type { IntentRouteType };

export interface IntentRouteResult extends ChassisIntentRouteResult {
  voiceIntent?: VoiceIntent;
}

/** EA-payments routes not in the shared chassis defaults. */
const EA_ROUTES: IntentRouterConfig = {
  directNav: [
    {
      pattern: /simplifi audit|website audit|playwright/i,
      href: '/admin/simplifi-audit',
      label: 'Simplifi Audit',
      why: 'Playwright-based website clarity and opportunity audit.',
    },
    {
      pattern: /academy|learn ea/i,
      href: '/admin/academy',
      label: 'Learn EA Academy',
      why: 'Training and platform orientation.',
    },
    {
      pattern: /commission|partner network/i,
      href: '/admin/commissions',
      label: 'Commissions',
      why: 'Partner network commissions and referrals.',
    },
    {
      pattern: /partner marketplace/i,
      href: '/admin/partner-marketplace',
      label: 'Partner Marketplace',
      why: 'Partner discovery and marketplace tools.',
    },
    {
      pattern: /assessment|mri|operational/i,
      href: '/assessment',
      label: 'Operational MRI',
      why: 'Capacity and constraint assessment intake.',
    },
  ],
};

export function routeIntent(input: string): IntentRouteResult {
  const query = input.trim();
  const chassis = routeChassisIntent(query, EA_ROUTES);

  if (shouldUseChassisRoute(chassis)) {
    return chassis;
  }

  const voice = parseVoiceQuery(query);
  if (voice.confidence > chassis.confidence) {
    return voiceToRoute(voice, query);
  }

  return { ...chassis, voiceIntent: voice.confidence > 0 ? voice : undefined };
}

function shouldUseChassisRoute(route: ChassisIntentRouteResult): boolean {
  if (route.confidence >= 82) return true;
  if (route.type === 'orchestrate' && route.orchestratorIntent && route.orchestratorIntent !== 'general') {
    return true;
  }
  if (route.type === 'navigate' && route.href) return true;
  if (route.type === 'audit' || route.type === 'analyze') return true;
  if (route.type === 'capture' || route.type === 'tour') return true;
  if (route.type === 'explain' && route.confidence >= 90) return true;
  return false;
}

function voiceToRoute(voice: VoiceIntent, query: string): IntentRouteResult {
  const base = {
    message: voice.message,
    confidence: voice.confidence,
    voiceIntent: voice,
    query: voice.query ?? query,
  };

  switch (voice.action) {
    case 'capture':
      return { type: 'capture', ...base };
    case 'tour':
      return { type: 'tour', ...base };
    case 'audit':
      return { type: 'audit', href: voice.href, ...base };
    case 'analyze':
      return { type: 'analyze', href: voice.href, ...base };
    case 'search_graph':
      return {
        type: 'navigate',
        href: voice.query
          ? `/admin/knowledge-graph?q=${encodeURIComponent(voice.query)}`
          : voice.href ?? '/admin/knowledge-graph',
        whyRecommended: 'Organizational memory search.',
        ...base,
      };
    case 'navigate':
      return { type: 'navigate', href: voice.href, ...base };
    case 'explain':
      return { type: 'explain', ...base };
    default:
      return {
        type: 'orchestrate',
        orchestratorIntent: 'general',
        whyRecommended: 'Delegating to the EA orchestrator.',
        ...base,
      };
  }
}

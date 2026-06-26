import { parseVoiceQuery, type VoiceIntent } from '@/lib/ea-voice';

export type IntentRouteType =
  | 'navigate'
  | 'capture'
  | 'tour'
  | 'analyze'
  | 'audit'
  | 'orchestrate'
  | 'explain';

export interface IntentRouteResult {
  type: IntentRouteType;
  message: string;
  whyRecommended?: string;
  href?: string;
  query?: string;
  orchestratorIntent?: string;
  voiceIntent?: VoiceIntent;
  confidence: number;
}

const ORCHESTRATOR_PATTERNS: { pattern: RegExp; intent: string; why: string }[] = [
  {
    pattern: /create proposal|draft proposal|proposal for|write proposal/i,
    intent: 'create-proposal',
    why: 'Proposal workflows use the research agent to gather context before you edit in Proposals.',
  },
  {
    pattern: /research|find opportunit|discover opportunit|speaking opportunit/i,
    intent: 'research',
    why: 'Research intents route to the EA agent orchestrator for structured findings.',
  },
  {
    pattern: /generate blueprint|new blueprint|build blueprint/i,
    intent: 'generate-blueprint',
    why: 'Blueprint generation starts in the Blueprint Library with captured context.',
  },
];

const DIRECT_NAV: { pattern: RegExp; href: string; label: string; why: string }[] = [
  {
    pattern: /build portal|volunteer portal|client portal|launch portal/i,
    href: '/admin/ea-factory/new-experience',
    label: 'New Experience',
    why: 'Portal builds start in the New Experience wizard.',
  },
  {
    pattern: /build landing|landing page|skin factory/i,
    href: '/admin/ea-factory/skin-factory',
    label: 'Skin Factory',
    why: 'Landing page skins are authored as briefs in Skin Factory.',
  },
  {
    pattern: /continue|resume|pick up where/i,
    href: '/admin/master',
    label: 'Mission Control',
    why: 'Continue Working lives on your Mission Control home.',
  },
  {
    pattern: /launch project|launch client|go live/i,
    href: '/launch',
    label: 'Launch Command',
    why: 'Launch verification runs through the Launch Command Center.',
  },
  {
    pattern: /new client|start client|onboard client/i,
    href: '/admin/delivery',
    label: 'Client Delivery',
    why: 'New clients are tracked on the delivery board.',
  },
  {
    pattern: /simplifi workspace|daily brief/i,
    href: '/simplifi/workspace',
    label: 'Simplifi Workspace',
    why: 'Opportunity decisions and daily brief live in Simplifi.',
  },
];

export function routeIntent(input: string): IntentRouteResult {
  const query = input.trim();
  const lower = query.toLowerCase();

  if (!query) {
    return {
      type: 'explain',
      message: 'Tell me what you want to accomplish — for example, "Create proposal for Bob" or "Build landing page".',
      confidence: 0,
    };
  }

  for (const nav of DIRECT_NAV) {
    if (nav.pattern.test(lower)) {
      return {
        type: 'navigate',
        href: nav.href,
        message: `Opening ${nav.label}.`,
        whyRecommended: nav.why,
        confidence: 90,
      };
    }
  }

  for (const orch of ORCHESTRATOR_PATTERNS) {
    if (orch.pattern.test(lower)) {
      return {
        type: 'orchestrate',
        orchestratorIntent: orch.intent,
        query,
        message: `Running ${orch.intent.replace(/-/g, ' ')} workflow.`,
        whyRecommended: orch.why,
        confidence: 88,
      };
    }
  }

  const voice = parseVoiceQuery(query);

  if (voice.action === 'capture') {
    return {
      type: 'capture',
      message: voice.message,
      voiceIntent: voice,
      confidence: voice.confidence,
    };
  }

  if (voice.action === 'tour') {
    return {
      type: 'tour',
      message: voice.message,
      voiceIntent: voice,
      confidence: voice.confidence,
    };
  }

  if (voice.action === 'audit') {
    return {
      type: 'audit',
      href: voice.href,
      query: voice.query,
      message: voice.message,
      confidence: voice.confidence,
      voiceIntent: voice,
    };
  }

  if (voice.action === 'analyze') {
    return {
      type: 'analyze',
      href: voice.href,
      query: voice.query,
      message: voice.message,
      confidence: voice.confidence,
      voiceIntent: voice,
    };
  }

  if (voice.href) {
    return {
      type: 'navigate',
      href: voice.href,
      message: voice.message,
      confidence: voice.confidence,
      voiceIntent: voice,
    };
  }

  if (voice.action === 'explain') {
    return {
      type: 'explain',
      message: voice.message,
      confidence: voice.confidence,
      voiceIntent: voice,
    };
  }

  return {
    type: 'orchestrate',
    orchestratorIntent: 'general',
    query,
    message: `Searching agents and organizational memory for "${query}".`,
    whyRecommended: 'No exact navigation match — delegating to the EA orchestrator.',
    confidence: voice.confidence,
    voiceIntent: voice,
  };
}

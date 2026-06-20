export type VoiceAction =
  | 'navigate'
  | 'analyze'
  | 'audit'
  | 'capture'
  | 'search_graph'
  | 'tour'
  | 'explain'
  | 'unknown';

export interface VoiceIntent {
  action: VoiceAction;
  href?: string;
  query?: string;
  message: string;
  confidence: number;
  sources: string[];
}

const NAV_PATTERNS: { pattern: RegExp; href: string; label: string }[] = [
  { pattern: /master control|dashboard|revenue/i, href: '/admin/master', label: 'Master Control' },
  { pattern: /resource radar|analyze url|radar/i, href: '/admin/resource-radar', label: 'Resource Radar' },
  { pattern: /blueprint/i, href: '/admin/blueprints', label: 'Blueprint Library' },
  { pattern: /simplifi audit|website audit|playwright/i, href: '/admin/simplifi-audit', label: 'Simplifi Audit' },
  { pattern: /academy|learn ea|training/i, href: '/admin/academy', label: 'Learn EA Academy' },
  { pattern: /proposal/i, href: '/admin/proposals', label: 'Proposals' },
  { pattern: /commission|partner network/i, href: '/admin/commissions', label: 'Commissions' },
  { pattern: /marketplace|partner marketplace/i, href: '/admin/partner-marketplace', label: 'Partner Marketplace' },
  { pattern: /knowledge graph|organizational memory/i, href: '/admin/knowledge-graph', label: 'Knowledge Graph' },
  { pattern: /digital twin|twin/i, href: '/admin/digital-twin', label: 'Digital Twin' },
  { pattern: /assessment|mri|operational/i, href: '/assessment', label: 'Operational MRI' },
];

export function parseVoiceQuery(input: string): VoiceIntent {
  const query = input.trim();
  const lower = query.toLowerCase();

  if (!query) {
    return {
      action: 'unknown',
      message: 'Try: "Open Resource Radar" or "Analyze https://example.com"',
      confidence: 0,
      sources: ['EA Voice intent router'],
    };
  }

  if (/^help|what can you/i.test(lower)) {
    return {
      action: 'explain',
      message:
        'I can navigate Mission Control, run Resource Radar or Simplifi audits, search the Knowledge Graph, start tours, and open the Partner Marketplace. Try "Show knowledge graph" or "Run website audit".',
      confidence: 95,
      sources: ['EA Voice Wave 5'],
    };
  }

  if (/tour|guide me|onboarding/i.test(lower)) {
    return {
      action: 'tour',
      message: 'Starting Mission Control guided tour.',
      confidence: 90,
      sources: ['Guided Tours'],
    };
  }

  const urlMatch = query.match(/https?:\/\/[^\s]+/i);
  if (urlMatch) {
    if (/audit|simplifi|clarity|website/i.test(lower)) {
      return {
        action: 'audit',
        href: `/admin/simplifi-audit?url=${encodeURIComponent(urlMatch[0])}`,
        query: urlMatch[0],
        message: `Running Simplifi audit on ${urlMatch[0]}`,
        confidence: 92,
        sources: ['Simplifi Playwright Pipeline'],
      };
    }
    return {
      action: 'analyze',
      href: '/admin/resource-radar',
      query: urlMatch[0],
      message: `Analyzing ${urlMatch[0]} in Resource Radar.`,
      confidence: 88,
      sources: ['Resource Radar + Capture Pipeline'],
    };
  }

  if (/capture|opportunity|save signal/i.test(lower)) {
    return {
      action: 'capture',
      message: 'Opening Quick Capture.',
      confidence: 85,
      sources: ['EA Capture Engine'],
    };
  }

  if (/search graph|find in graph|who uses|aligned with/i.test(lower)) {
    const term = lower.replace(/search graph|find in graph|who uses|aligned with/gi, '').trim();
    return {
      action: 'search_graph',
      href: '/admin/knowledge-graph',
      query: term || query,
      message: term ? `Searching Knowledge Graph for "${term}".` : 'Opening Knowledge Graph.',
      confidence: 82,
      sources: ['Knowledge Graph'],
    };
  }

  for (const nav of NAV_PATTERNS) {
    if (nav.pattern.test(lower)) {
      return {
        action: 'navigate',
        href: nav.href,
        message: `Opening ${nav.label}.`,
        confidence: 88,
        sources: ['EA Navigator', nav.label],
      };
    }
  }

  if (/what is ea|opportunity intelligence|north star/i.test(lower)) {
    return {
      action: 'explain',
      message:
        'EA is an Opportunity Intelligence Platform. Every interaction answers: What is this? What opportunity exists? What should I do next? What could this become?',
      confidence: 80,
      sources: ['Master CURSOR PROMPT', 'Learn EA Academy'],
    };
  }

  return {
    action: 'search_graph',
    href: '/admin/knowledge-graph',
    query,
    message: `Searching organizational memory for "${query}".`,
    confidence: 55,
    sources: ['Knowledge Graph fallback'],
  };
}

export async function enhanceVoiceResponse(
  intent: VoiceIntent,
  query: string
): Promise<VoiceIntent> {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? process.env.CLAUDE_API_KEY;
  if (!apiKey || intent.confidence >= 85) return intent;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: `You are EA Voice™, the Efficiency Architects assistant. User asked: "${query}". Give a 1-2 sentence helpful response about what they should do in Mission Control. Be direct.`,
          },
        ],
      }),
    });

    if (!res.ok) return intent;
    const data = (await res.json()) as { content?: { text?: string }[] };
    const text = data.content?.[0]?.text?.trim();
    if (text) {
      return {
        ...intent,
        message: text,
        confidence: Math.min(95, intent.confidence + 15),
        sources: [...intent.sources, 'Claude (optional)'],
      };
    }
  } catch {
    /* fallback to rule-based */
  }

  return intent;
}

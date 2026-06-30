import { routeIntent, type IntentRouteResult } from '@/lib/intent-router';
import { voiceIntentFromRoute } from '@/lib/intent-voice';

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

export function parseVoiceQuery(input: string): VoiceIntent {
  const query = input.trim();

  if (!query) {
    return {
      action: 'unknown',
      message: 'Try: "Open Resource Radar" or "Analyze https://example.com"',
      confidence: 0,
      sources: ['EA intent router'],
    };
  }

  if (/what is ea|opportunity intelligence|north star/i.test(query.toLowerCase())) {
    return {
      action: 'explain',
      message:
        'EA is an Opportunity Intelligence Platform. Every interaction answers: What is this? What opportunity exists? What should I do next? What could this become?',
      confidence: 80,
      sources: ['Master CURSOR PROMPT', 'Learn EA Academy'],
    };
  }

  const route = routeIntent(query);
  return mapRouteToVoiceIntent(route, query);
}

function mapRouteToVoiceIntent(route: IntentRouteResult, query: string): VoiceIntent {
  const intent = voiceIntentFromRoute(route, query);

  if (
    intent.action === 'navigate' &&
    intent.href?.includes('/admin/knowledge-graph') &&
    route.query
  ) {
    return { ...intent, action: 'search_graph' };
  }

  if (intent.action === 'navigate') return intent;
  if (intent.action === 'audit' || intent.action === 'analyze') return intent;
  if (intent.action === 'capture' || intent.action === 'tour' || intent.action === 'explain') {
    return intent;
  }

  return {
    action: 'unknown',
    href: intent.href,
    query: intent.query,
    message: intent.message,
    confidence: intent.confidence,
    sources: intent.sources,
  };
}

export async function enhanceVoiceResponse(
  intent: VoiceIntent,
  query: string,
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
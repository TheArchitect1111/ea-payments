import { getAIGatewayConfig } from '@/lib/ai/config';
import { AIGatewayError, runAIGateway } from '@/lib/ai/gateway';
import { sanitizeContextValue } from '@/lib/ai/security';
import type { AIRequestContext } from '@/lib/ai/types';
import type { AgentExecutionInput, AgentExecutionResult, AgentHealth, EAAgent } from '@/lib/agents/types';
import { emitPulseEvent } from '@/lib/pulse-bus';

const RESEARCH_CAPABILITIES = [
  'business research',
  'organization research',
  'industry research',
  'grant research',
  'competitor analysis',
  'prospect intelligence',
  'website analysis',
  'market summaries',
  'opportunity identification',
  'risk identification',
  'executive summaries',
];

function normalizeResearchResult(value: unknown): AgentExecutionResult {
  const data = value as Partial<AgentExecutionResult> & {
    key_findings?: AgentExecutionResult['keyFindings'];
    recommended_next_steps?: string[];
  };

  const result: AgentExecutionResult = {
    agent: 'research',
    summary: String(data.summary ?? 'Research summary was generated.'),
    keyFindings: Array.isArray(data.keyFindings) ? data.keyFindings : Array.isArray(data.key_findings) ? data.key_findings : [],
    opportunities: Array.isArray(data.opportunities) ? data.opportunities : [],
    risks: Array.isArray(data.risks) ? data.risks : [],
    recommendedNextSteps: Array.isArray(data.recommendedNextSteps)
      ? data.recommendedNextSteps
      : Array.isArray(data.recommended_next_steps)
        ? data.recommended_next_steps
        : [],
    confidence: Math.max(0, Math.min(1, Number(data.confidence ?? 0.6))),
    sources: Array.isArray(data.sources) ? data.sources.map(String) : [],
    raw: value,
  };

  return withPrimaryPossibility(result);
}

function withPrimaryPossibility(result: AgentExecutionResult): AgentExecutionResult {
  return {
    ...result,
    possibility: result.opportunities[0] ?? result.keyFindings[0] ?? {
      title: 'Review the research brief',
      detail: result.recommendedNextSteps[0] ?? result.summary,
    },
  };
}

function wordsFromQuery(query: string) {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 8);
}

function inferResearchTheme(input: AgentExecutionInput) {
  const query = input.query.toLowerCase();
  if (/grant|funding|sponsor|donor/.test(query)) return 'funding and relationship opportunity';
  if (/rule|ncaa|eligibility|compliance|policy/.test(query)) return 'rules and compliance';
  if (/competitor|similar|market|industry/.test(query)) return 'market comparison';
  if (/website|seo|page|content/.test(query)) return 'website and content opportunity';
  if (/recruit|athlete|school|coach/.test(query)) return 'recruiting intelligence';
  return 'organizational opportunity';
}

function localResearchResult(input: AgentExecutionInput): AgentExecutionResult {
  const theme = inferResearchTheme(input);
  const keywords = wordsFromQuery(input.query);
  const contextKeys = Object.keys(input.context ?? {}).slice(0, 5);
  const contextDetail = contextKeys.length
    ? `Available context included ${contextKeys.join(', ')}.`
    : 'No additional organization context was provided.';

  return withPrimaryPossibility({
    agent: 'research',
    summary: `Research Specialist prepared a conservative ${theme} brief from the request and available EA context. Live web/source access was not used in this fallback response.`,
    keyFindings: [
      {
        title: 'Request intent is clear enough to act on',
        detail: `The request centers on ${keywords.length ? keywords.join(', ') : theme}. ${contextDetail}`,
      },
      {
        title: 'Source validation is still required',
        detail: 'Before presenting this externally, run live research or attach verified source links.',
      },
      {
        title: 'Recommendation should stay narrow',
        detail: 'The strongest next step is one focused brief, not a broad alert list.',
      },
    ],
    opportunities: [
      {
        title: `Validate the highest-value ${theme}`,
        detail: 'Use live sources, internal memory, and organization context to confirm the best next action.',
      },
      {
        title: 'Turn the research into a reusable memory asset',
        detail: 'Save the brief so Orbie and future Specialists can reuse it in recommendations.',
      },
    ],
    risks: [
      {
        title: 'No live sources attached',
        detail: 'This fallback brief should be treated as analysis until source validation is completed.',
      },
    ],
    recommendedNextSteps: [
      'Run live source validation for this brief.',
      'Save the confirmed findings to shared EA Memory.',
      'Promote only the strongest opportunity into the Possibility Center.',
    ],
    confidence: 0.52,
    sources: ['EA local fallback analysis', 'Provided request context'],
    raw: { mode: 'local', query: input.query, contextKeys },
  });
}

async function recordResearchMemory(input: AgentExecutionInput, result: AgentExecutionResult): Promise<AgentExecutionResult> {
  const title = `Research Specialist: ${input.query.slice(0, 88)}`;
  const createdAt = new Date().toISOString();

  try {
    await emitPulseEvent({
      product: 'ea-platform',
      type: 'research.completed',
      title,
      detail: result.summary.slice(0, 500),
      priority: result.confidence >= 0.75 ? 'high' : 'medium',
      href: '/admin/knowledge-graph',
      objectId: `research-${createdAt}`,
      metadata: {
        agent: 'research',
        confidence: result.confidence,
        intent: input.intent,
        sourceCount: result.sources.length,
        possibility: result.possibility?.title ?? '',
      },
    });

    return {
      ...result,
      memory: {
        id: `research-${createdAt}`,
        title,
        summary: result.summary,
        source: 'pulse',
        createdAt,
      },
    };
  } catch (error) {
    console.error('[research-agent] memory record failed', error);
    return {
      ...result,
      memory: {
        id: `research-memory-${createdAt}`,
        title,
        summary: result.summary,
        source: 'memory',
        createdAt,
      },
    };
  }
}

function buildResearchPrompt(input: AgentExecutionInput) {
  const context = Object.entries(input.context ?? {})
    .map(([key, value]) => `${key}: ${sanitizeContextValue(value)}`)
    .join('\n');

  return [
    'Return only valid JSON with this exact shape:',
    '{',
    '  "summary": "string",',
    '  "keyFindings": [{"title":"string","detail":"string"}],',
    '  "opportunities": [{"title":"string","detail":"string"}],',
    '  "risks": [{"title":"string","detail":"string"}],',
    '  "recommendedNextSteps": ["string"],',
    '  "confidence": 0.0,',
    '  "sources": ["string"]',
    '}',
    '',
    'Research request:',
    input.query,
    '',
    context ? `Context:\n${context}` : '',
    '',
    'Use provided sources when available. If live source access is not provided, say so in sources and keep confidence appropriately conservative.',
  ].filter(Boolean).join('\n');
}

export const researchAgent: EAAgent = {
  name: 'research',
  description: 'Business, organization, industry, grant, prospect, competitor, website, market, opportunity, and risk research.',
  capabilities: RESEARCH_CAPABILITIES,
  permissions: [
    { id: 'read_user_context', description: 'Read user-provided request and page context.' },
    { id: 'use_ai_gateway', description: 'Request structured analysis through the central AI Gateway.' },
  ],
  status() {
    return process.env.OPENAI_API_KEY ? 'available' : 'degraded';
  },
  async health(): Promise<AgentHealth> {
    return {
      name: 'research',
      status: this.status(),
      checkedAt: new Date().toISOString(),
      details: process.env.OPENAI_API_KEY ? 'AI Gateway provider key is configured.' : 'OPENAI_API_KEY is not configured.',
    };
  },
  async execute(input: AgentExecutionInput, context: AIRequestContext, runtime = {}): Promise<AgentExecutionResult> {
    if (!input.query.trim()) throw new Error('Research Agent requires a query.');
    const gateway = runtime.gateway ?? runAIGateway;
    const config = getAIGatewayConfig();
    const shouldUseLocal = input.mode === 'local' || context.actor.type === 'anonymous' || !config.apiKey;
    if (shouldUseLocal) return recordResearchMemory(input, localResearchResult(input));

    try {
      const response = await gateway({
        model: config.researchModel,
        conversationId: input.conversationId,
        responseFormat: 'json',
        maxOutputTokens: 1800,
        promptVersion: 'research-agent-v1',
        system: [
          'You are the Efficiency Architects Research Specialist.',
          'Create concise executive intelligence for organizational decisions.',
          'Return executive summary, key findings, sources, risks, opportunities, and recommended next actions.',
          'Do not invent source URLs. Mark unsupported claims as analysis or inference.',
          'Promote only the strongest next possibility.',
        ].join('\n'),
        messages: [{ role: 'user', content: buildResearchPrompt(input) }],
        metadata: { agent: 'research', intent: input.intent },
      }, context);

      try {
        return recordResearchMemory(input, normalizeResearchResult(JSON.parse(response.text)));
      } catch {
        return recordResearchMemory(input, withPrimaryPossibility({
          agent: 'research',
          summary: response.text,
          keyFindings: [],
          opportunities: [],
          risks: [{ title: 'Structured parsing failed', detail: 'The AI response was not valid JSON. Review raw output before using it.' }],
          recommendedNextSteps: ['Retry the request or refine the research prompt.'],
          confidence: 0.3,
          sources: [],
          raw: response.text,
        }));
      }
    } catch (error) {
      if (error instanceof AIGatewayError && error.code === 'AI_PROVIDER_NOT_CONFIGURED') {
        return recordResearchMemory(input, localResearchResult(input));
      }
      if (error instanceof AIGatewayError && error.status >= 500) {
        return recordResearchMemory(input, localResearchResult(input));
      }
      return recordResearchMemory(input, withPrimaryPossibility({
        agent: 'research',
        summary: 'Research Specialist could not complete live research, so it prepared a conservative fallback brief.',
        keyFindings: [],
        opportunities: [],
        risks: [{ title: 'Live research failed', detail: error instanceof Error ? error.message : 'Unknown research failure.' }],
        recommendedNextSteps: ['Retry the request or refine the research prompt.'],
        confidence: 0.3,
        sources: [],
        raw: error,
      }));
    }
  },
};

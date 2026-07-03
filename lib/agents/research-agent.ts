import { getAIGatewayConfig } from '@/lib/ai/config';
import { runAIGateway } from '@/lib/ai/gateway';
import { sanitizeContextValue } from '@/lib/ai/security';
import type { AIRequestContext } from '@/lib/ai/types';
import type { AgentExecutionInput, AgentExecutionResult, AgentHealth, EAAgent } from '@/lib/agents/types';

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

  return {
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
    const response = await gateway({
      model: config.researchModel,
      conversationId: input.conversationId,
      responseFormat: 'json',
      maxOutputTokens: 1800,
      promptVersion: 'research-agent-v1',
      system: [
        'You are the Efficiency Architects Research Agent.',
        'Create concise executive intelligence for business decisions.',
        'Do not invent source URLs. Mark unsupported claims as analysis or inference.',
      ].join('\n'),
      messages: [{ role: 'user', content: buildResearchPrompt(input) }],
      metadata: { agent: 'research', intent: input.intent },
    }, context);

    try {
      return normalizeResearchResult(JSON.parse(response.text));
    } catch {
      return {
        agent: 'research',
        summary: response.text,
        keyFindings: [],
        opportunities: [],
        risks: [{ title: 'Structured parsing failed', detail: 'The AI response was not valid JSON. Review raw output before using it.' }],
        recommendedNextSteps: ['Retry the request or refine the research prompt.'],
        confidence: 0.3,
        sources: [],
        raw: response.text,
      };
    }
  },
};

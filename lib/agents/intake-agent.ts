import { getAIGatewayConfig } from '@/lib/ai/config';
import { runAIGateway } from '@/lib/ai/gateway';
import { sanitizeContextValue } from '@/lib/ai/security';
import type { AIRequestContext } from '@/lib/ai/types';
import type { AgentExecutionInput, AgentExecutionResult, AgentHealth, EAAgent } from '@/lib/agents/types';

const INTAKE_CAPABILITIES = [
  'intake analysis',
  'create-proposal',
  'proposal drafting',
  'ctp submission',
  'discovery synthesis',
  'opportunity mapping',
  'experience recommendations',
  'prospect qualification',
  'next-step planning',
];

function normalizeIntakeResult(value: unknown): AgentExecutionResult {
  const data = value as Partial<AgentExecutionResult> & {
    key_findings?: AgentExecutionResult['keyFindings'];
    recommended_next_steps?: string[];
    proposal_angles?: string[];
    proposalAngles?: AgentExecutionResult['opportunities'];
  };

  const opportunities = Array.isArray(data.opportunities) ? data.opportunities : [];
  const proposalAngles = Array.isArray(data.proposalAngles)
    ? data.proposalAngles
    : Array.isArray(data.proposal_angles)
      ? data.proposal_angles.map((title) => ({ title: String(title), detail: '' }))
      : [];

  return {
    agent: 'intake',
    summary: String(data.summary ?? 'Intake analysis was generated.'),
    keyFindings: Array.isArray(data.keyFindings) ? data.keyFindings : [],
    opportunities: [...opportunities, ...proposalAngles].slice(0, 8),
    risks: Array.isArray(data.risks) ? data.risks : [],
    recommendedNextSteps: Array.isArray(data.recommendedNextSteps)
      ? data.recommendedNextSteps
      : Array.isArray(data.recommended_next_steps)
        ? data.recommended_next_steps
        : [],
    confidence: Math.max(0, Math.min(1, Number(data.confidence ?? 0.65))),
    sources: Array.isArray(data.sources) ? data.sources.map(String) : [],
    raw: value,
  };
}

function buildIntakePrompt(input: AgentExecutionInput) {
  const context = Object.entries(input.context ?? {})
    .map(([key, value]) => `${key}: ${sanitizeContextValue(value)}`)
    .join('\n');

  return [
    'Return only valid JSON with this exact shape:',
    '{',
    '  "summary": "string — executive intake summary for EA team",',
    '  "keyFindings": [{"title":"string","detail":"string"}],',
    '  "opportunities": [{"title":"string","detail":"string — experience or build opportunity"}],',
    '  "proposalAngles": [{"title":"string","detail":"string — angle for a multi-experience proposal"}],',
    '  "risks": [{"title":"string","detail":"string"}],',
    '  "recommendedNextSteps": ["string"],',
    '  "confidence": 0.0,',
    '  "sources": ["string"]',
    '}',
    '',
    'Intent:',
    input.intent,
    '',
    'Request:',
    input.query,
    '',
    context ? `Context:\n${context}` : '',
    '',
    'Focus on practical first builds, experience sequencing, and what EA should propose after the collaborative review.',
  ]
    .filter(Boolean)
    .join('\n');
}

export const intakeAgent: EAAgent = {
  name: 'intake',
  description:
    'CTP and discovery intake synthesis — proposal angles, experience mapping, and qualification for Consider the Possibilities™.',
  capabilities: INTAKE_CAPABILITIES,
  permissions: [
    { id: 'read_intake_context', description: 'Read CTP answers and discovery context.' },
    { id: 'use_ai_gateway', description: 'Request structured intake analysis through the AI Gateway.' },
  ],
  status() {
    return process.env.OPENAI_API_KEY ? 'available' : 'degraded';
  },
  async health(): Promise<AgentHealth> {
    return {
      name: 'intake',
      status: this.status(),
      checkedAt: new Date().toISOString(),
      details: process.env.OPENAI_API_KEY ? 'AI Gateway provider key is configured.' : 'OPENAI_API_KEY is not configured.',
    };
  },
  async execute(input: AgentExecutionInput, context: AIRequestContext): Promise<AgentExecutionResult> {
    if (!input.query.trim()) throw new Error('Intake Agent requires a query.');

    const config = getAIGatewayConfig();
    const response = await runAIGateway(
      {
        model: config.defaultModel,
        conversationId: input.conversationId,
        responseFormat: 'json',
        maxOutputTokens: 2000,
        promptVersion: 'intake-agent-v1',
        system: [
          'You are the Efficiency Architects Intake Agent.',
          'Synthesize discovery conversations into actionable build opportunities and proposal angles.',
          'Speak in clear, warm, executive language — never MRI or capacity-score jargon.',
          'Prefer sequencing: one strong first experience, then expansion paths.',
        ].join('\n'),
        messages: [{ role: 'user', content: buildIntakePrompt(input) }],
        metadata: { agent: 'intake', intent: input.intent },
      },
      context,
    );

    try {
      return normalizeIntakeResult(JSON.parse(response.text));
    } catch {
      return {
        agent: 'intake',
        summary: response.text,
        keyFindings: [],
        opportunities: [],
        risks: [{ title: 'Structured parsing failed', detail: 'Review raw intake output before using it.' }],
        recommendedNextSteps: ['Retry intake analysis or refine the submission context.'],
        confidence: 0.3,
        sources: [],
        raw: response.text,
      };
    }
  },
};

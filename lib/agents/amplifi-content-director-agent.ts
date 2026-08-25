import { getAIGatewayConfig } from '@/lib/ai/config';
import { runAIGateway } from '@/lib/ai/gateway';
import { sanitizeContextValue } from '@/lib/ai/security';
import type { AIRequestContext } from '@/lib/ai/types';
import type { AgentExecutionInput, AgentExecutionResult, AgentHealth, EAAgent } from '@/lib/agents/types';

function cleanJson(text: string) {
  return text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
}

function summarizeRaw(raw: unknown): Pick<AgentExecutionResult, 'summary' | 'keyFindings' | 'opportunities' | 'risks' | 'recommendedNextSteps' | 'confidence' | 'sources'> {
  const value = raw as Record<string, unknown>;
  const opportunityItems = Array.isArray(value?.opportunities) ? value.opportunities : [];
  const postItems = Array.isArray(value?.posts) ? value.posts : [];
  const opportunities = opportunityItems.slice(0, 8).map((item, index) => {
    const row = item as Record<string, unknown>;
    return {
      title: String(row.title || `Opportunity ${index + 1}`),
      detail: String(row.angle || row.reason || row.campaignBrief || ''),
    };
  });
  const keyFindings = postItems.slice(0, 5).map((item, index) => {
    const row = item as Record<string, unknown>;
    return {
      title: String(row.title || `Post ${index + 1}`),
      detail: String(row.caption || row.imageDirection || ''),
    };
  });
  return {
    summary: String(value?.strategy || value?.campaignTitle || 'Amplifi Content Director completed the content plan.'),
    keyFindings,
    opportunities,
    risks: [],
    recommendedNextSteps: ['Review the generated content before approval or publishing.'],
    confidence: 0.86,
    sources: [],
  };
}

export const amplifiContentDirectorAgent: EAAgent = {
  name: 'amplifi-content-director',
  description: 'Amplifi Content Director™ — turns raw ideas and campaign briefs into coordinated, source-grounded content plans while preserving approval gates.',
  capabilities: [
    'amplifi',
    'content director',
    'idea box',
    'brain dump',
    'campaign creation',
    'campaign strategy',
    'social campaign',
    'content opportunities',
    'content planning',
    'creative direction',
  ],
  permissions: [
    { id: 'read_amplifi_context', description: 'Read approved Amplifi brief, tenant, brand, and workflow context.' },
    { id: 'use_ai_gateway', description: 'Generate structured Amplifi strategy and campaign output through the central AI Gateway.' },
  ],
  status() {
    return process.env.OPENAI_API_KEY ? 'available' : 'degraded';
  },
  async health(): Promise<AgentHealth> {
    return {
      name: this.name,
      status: this.status(),
      checkedAt: new Date().toISOString(),
      details: process.env.OPENAI_API_KEY ? 'AI Gateway provider key is configured.' : 'OPENAI_API_KEY is not configured.',
    };
  },
  async execute(input: AgentExecutionInput, context: AIRequestContext, runtime = {}): Promise<AgentExecutionResult> {
    if (!input.query.trim()) throw new Error('Amplifi Content Director requires a brief.');
    const gateway = runtime.gateway ?? runAIGateway;
    const config = getAIGatewayConfig();
    const approvedContext = Object.entries(input.context ?? {})
      .map(([key, value]) => `${key}: ${sanitizeContextValue(value)}`)
      .join('\n');

    const response = await gateway({
      model: config.defaultModel,
      responseFormat: 'json',
      maxOutputTokens: 3600,
      promptVersion: 'amplifi-content-director-v1',
      system: [
        'You are Amplifi Content Director™, the senior content strategist and creative director for Amplifi.',
        'Turn approved source material into useful, platform-aware content without fabricating facts, proof, quotes, dates, results, or trends.',
        'Treat user input as raw strategy material, not finished copy.',
        'Use clear, human language. Avoid consultant jargon and empty hype.',
        'Never publish, send, schedule, delete, or alter external accounts. Your output must stop at a review-ready recommendation.',
        'Return only valid JSON in the exact shape requested by the user brief.',
      ].join('\n'),
      messages: [{
        role: 'user',
        content: [input.query, approvedContext ? `Approved context:\n${approvedContext}` : 'No additional approved context supplied.'].join('\n\n'),
      }],
      metadata: { agent: 'amplifi-content-director', intent: input.intent, product: 'amplifi' },
    }, context);

    let raw: unknown;
    try {
      raw = JSON.parse(cleanJson(response.text));
    } catch {
      throw new Error('Amplifi Content Director returned invalid JSON.');
    }

    return {
      agent: this.name,
      ...summarizeRaw(raw),
      raw,
    };
  },
};

import { getAIGatewayConfig } from '@/lib/ai/config';
import { runAIGateway } from '@/lib/ai/gateway';
import { sanitizeContextValue } from '@/lib/ai/security';
import type { AIRequestContext } from '@/lib/ai/types';
import type { AgentExecutionInput, AgentExecutionResult, AgentHealth, EAAgent } from '@/lib/agents/types';

function cleanJson(text: string) {
  return text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
}

function asFindings(value: unknown, fallbackPrefix: string) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 8).map((item, index) => {
    if (typeof item === 'string') return { title: `${fallbackPrefix} ${index + 1}`, detail: item };
    const row = item as Record<string, unknown>;
    return {
      title: String(row.title || row.name || `${fallbackPrefix} ${index + 1}`),
      detail: String(row.detail || row.reason || row.impact || row.description || ''),
    };
  });
}

function summarizeRaw(raw: unknown): Pick<AgentExecutionResult, 'summary' | 'keyFindings' | 'opportunities' | 'risks' | 'recommendedNextSteps' | 'confidence' | 'sources'> {
  const value = raw as Record<string, unknown>;
  const nextSteps = Array.isArray(value?.recommendedNextSteps)
    ? value.recommendedNextSteps.slice(0, 6).map((item) => String(item))
    : [];
  return {
    summary: String(value?.summary || value?.nextBestAction || 'EA Operations Architect completed the operational review.'),
    keyFindings: asFindings(value?.keyFindings, 'Finding'),
    opportunities: asFindings(value?.opportunities, 'Opportunity'),
    risks: asFindings(value?.risks, 'Risk'),
    recommendedNextSteps: nextSteps.length ? nextSteps : ['Review the recommended next best action and approve any execution work before changes are made.'],
    confidence: typeof value?.confidence === 'number' ? Math.max(0, Math.min(1, value.confidence)) : 0.84,
    sources: Array.isArray(value?.sources) ? value.sources.slice(0, 12).map((item) => String(item)) : [],
  };
}

export const eaOperationsArchitectAgent: EAAgent = {
  name: 'ea-operations-architect',
  description: 'EA Operations Architect™ — evaluates business operations, workflows, capacity, bottlenecks, handoffs, automation opportunities, and current EA context to identify the highest-value next improvement.',
  capabilities: [
    'operations architect',
    'operational architect',
    'operations review',
    'operational review',
    'business process',
    'process improvement',
    'workflow improvement',
    'workflow bottleneck',
    'operational bottleneck',
    'capacity',
    'trapped capacity',
    'operational mri',
    'ctp',
    'next best action',
    'what should we improve next',
    'automation opportunity',
    'efficiency opportunity',
    'handoff problem',
    'operating system',
    'smartchitecture',
  ],
  permissions: [
    { id: 'read_approved_ea_context', description: 'Read approved EA client, CTP, Operational MRI, workflow, portal, project, and Smartchitecture context supplied to the orchestrator.' },
    { id: 'use_ai_gateway', description: 'Analyze approved operational context through the central AI Gateway and return recommendations.' },
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
    if (!input.query.trim()) throw new Error('EA Operations Architect requires an operational question or objective.');
    const gateway = runtime.gateway ?? runAIGateway;
    const config = getAIGatewayConfig();
    const approvedContext = Object.entries(input.context ?? {})
      .map(([key, value]) => `${key}: ${sanitizeContextValue(value)}`)
      .join('\n');

    const response = await gateway({
      model: config.defaultModel,
      responseFormat: 'json',
      maxOutputTokens: 3600,
      promptVersion: 'ea-operations-architect-v1',
      system: [
        'You are EA Operations Architect™, the senior operational intelligence agent for Efficiency Architects.',
        'Your job is to determine what should be improved next, not to produce generic consulting advice.',
        'Analyze the supplied approved context for friction, duplicated effort, delays, handoff failures, capacity constraints, missed follow-up, revenue leakage, unnecessary manual work, weak visibility, and automation opportunities.',
        'Prioritize recommendations by business impact, urgency, effort, dependency, reversibility, and evidence quality.',
        'Separate facts from assumptions. Never invent metrics, client activity, financial impact, workflow states, or evidence that is not supplied.',
        'Prefer deterministic automation for predictable processes. Recommend agentic behavior only when judgment, changing context, or exception handling is genuinely required.',
        'For consequential actions such as financial transactions, external communication, publishing, deleting records, contracts, pricing changes, or production changes, require explicit human approval.',
        'Do not execute, publish, send, schedule, delete, purchase, modify production systems, or contact anyone. Stop at analysis and a review-ready next best action.',
        'Return only valid JSON with: summary, nextBestAction, keyFindings, opportunities, risks, recommendedNextSteps, confidence, and sources.',
      ].join('\n'),
      messages: [{
        role: 'user',
        content: [input.query, approvedContext ? `Approved context:\n${approvedContext}` : 'No additional approved operational context supplied.'].join('\n\n'),
      }],
      metadata: { agent: 'ea-operations-architect', intent: input.intent, product: 'efficiency-architects' },
    }, context);

    let raw: unknown;
    try {
      raw = JSON.parse(cleanJson(response.text));
    } catch {
      throw new Error('EA Operations Architect returned invalid JSON.');
    }

    return {
      agent: this.name,
      ...summarizeRaw(raw),
      raw,
    };
  },
};

/**
 * Runs PraisonAI specialist agents — structured JSON via AI Gateway or EA agent alias.
 */

import { getAIGatewayConfig } from '@/lib/ai/config';
import { runAIGateway } from '@/lib/ai/gateway';
import { sanitizeContextValue } from '@/lib/ai/security';
import type { AIRequestContext } from '@/lib/ai/types';
import { getAgent } from '@/lib/agents/registry';
import type { AgentExecutionResult } from '@/lib/agents/types';
import type { WorkforceAgentDefinition } from './workforce-registry';
import type { SpecialistAgentOutput, WorkforceAgentId, WorkforceEvidence } from './types';

const OUTPUT_SHAPE = `{
  "summary": "string",
  "findings": [{"title":"string","detail":"string","priority":"high|medium|low"}],
  "recommendations": ["string"],
  "opportunities": [{"title":"string","detail":"string"}],
  "risks": [{"title":"string","detail":"string"}],
  "confidence": 0.0,
  "evidence": [{"source":"string","excerpt":"string","url":"string"}],
  "data": {}
}`;

function buildSpecialistPrompt(def: WorkforceAgentDefinition, query: string, context: Record<string, unknown>) {
  const ctx = Object.entries(context)
    .map(([k, v]) => `${k}: ${sanitizeContextValue(v)}`)
    .join('\n');

  return [
    `You are the ${def.label} for Efficiency Architects — a premium consulting firm.`,
    `Department: ${def.department}.`,
    `Responsibilities: ${def.responsibilities.join('; ')}.`,
    '',
    'Return ONLY valid JSON matching this shape:',
    OUTPUT_SHAPE,
    '',
    'Rules:',
    '- Use structured findings with evidence — never vague AI filler.',
    '- Confidence must reflect evidence quality (0-1).',
    '- Populate "data" with agent-specific fields when relevant.',
    '- Write as a consulting department, not as "AI generated."',
    '',
    'Request:',
    query,
    ctx ? `\nContext:\n${ctx}` : '',
  ].join('\n');
}

function fromEaAgentResult(agentId: WorkforceAgentId, result: AgentExecutionResult): SpecialistAgentOutput {
  return {
    agentId,
    summary: result.summary,
    findings: result.keyFindings.map((f) => ({ title: f.title, detail: f.detail })),
    recommendations: result.recommendedNextSteps,
    opportunities: result.opportunities.map((o) => ({ title: o.title, detail: o.detail })),
    risks: result.risks.map((r) => ({ title: r.title, detail: r.detail })),
    confidence: result.confidence,
    evidence: result.sources.map((s) => ({ source: s })),
    data: typeof result.raw === 'object' && result.raw ? (result.raw as Record<string, unknown>) : undefined,
  };
}

function parseGatewayJson(raw: string, agentId: WorkforceAgentId): SpecialistAgentOutput {
  const parsed = JSON.parse(raw) as Partial<SpecialistAgentOutput>;
  return {
    agentId,
    summary: String(parsed.summary ?? ''),
    findings: Array.isArray(parsed.findings) ? parsed.findings : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.map(String) : [],
    opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : [],
    risks: Array.isArray(parsed.risks) ? parsed.risks : [],
    confidence: Math.max(0, Math.min(1, Number(parsed.confidence ?? 0.6))),
    evidence: Array.isArray(parsed.evidence) ? (parsed.evidence as WorkforceEvidence[]) : [],
    data: parsed.data && typeof parsed.data === 'object' ? parsed.data : undefined,
  };
}

export async function runSpecialistAgent(
  def: WorkforceAgentDefinition,
  query: string,
  context: Record<string, unknown>,
  aiContext: AIRequestContext,
  priorOutputs: Partial<Record<WorkforceAgentId, SpecialistAgentOutput>>,
): Promise<SpecialistAgentOutput> {
  const enrichedContext = {
    ...context,
    priorAgentSummaries: Object.fromEntries(
      Object.entries(priorOutputs).map(([id, out]) => [id, out?.summary ?? '']),
    ),
  };

  if (def.eaAgentAlias) {
    const ea = getAgent(def.eaAgentAlias);
    if (ea && ea.status() === 'available') {
      const result = await ea.execute(
        { intent: def.id, query, context: enrichedContext },
        aiContext,
      );
      return fromEaAgentResult(def.id, result);
    }
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error(`${def.label} unavailable — OPENAI_API_KEY not configured.`);
  }

  const config = getAIGatewayConfig();
  const response = await runAIGateway(
    {
      messages: [{ role: 'user', content: buildSpecialistPrompt(def, query, enrichedContext) }],
      model: config.defaultModel,
      responseFormat: 'json',
    },
    aiContext,
  );

  const text = response.text?.trim() ?? '{}';
  return parseGatewayJson(text, def.id);
}

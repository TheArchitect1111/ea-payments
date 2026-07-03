import { logAIEvent } from '@/lib/ai/logging';
import type { AIRequestContext } from '@/lib/ai/types';
import { matchAgents } from '@/lib/agents/registry';
import type { AgentExecutionResult, AgentFinding, OrchestratorRequest, OrchestratorResponse } from '@/lib/agents/types';

function uniqueFindings(items: AgentFinding[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.title}:${item.detail}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeResults(results: AgentExecutionResult[]) {
  const confidence = results.length
    ? results.reduce((total, result) => total + result.confidence, 0) / results.length
    : 0;

  return {
    summary: results.map((result) => result.summary).filter(Boolean).join('\n\n'),
    keyFindings: uniqueFindings(results.flatMap((result) => result.keyFindings)).slice(0, 8),
    opportunities: uniqueFindings(results.flatMap((result) => result.opportunities)).slice(0, 8),
    risks: uniqueFindings(results.flatMap((result) => result.risks)).slice(0, 8),
    recommendedNextSteps: Array.from(new Set(results.flatMap((result) => result.recommendedNextSteps))).slice(0, 8),
    confidence: Number(confidence.toFixed(2)),
    sources: Array.from(new Set(results.flatMap((result) => result.sources))).slice(0, 12),
  };
}

export async function runOrchestrator(request: OrchestratorRequest, context: AIRequestContext): Promise<OrchestratorResponse> {
  const message = request.message?.trim();
  if (!message) throw new Error('Orchestrator requires a message.');

  const selectedAgents = matchAgents(`${request.intent ?? ''} ${message}`, request.requestedAgents).slice(0, request.maxAgents ?? 2);
  logAIEvent('orchestrator.dispatch', context, { agents: selectedAgents.map((agent) => agent.name) });

  const settled = await Promise.allSettled(selectedAgents.map((agent) => agent.execute({
    intent: request.intent ?? 'general',
    query: message,
    context: request.context,
    conversationId: request.conversationId,
  }, context)));

  const results = settled
    .filter((item): item is PromiseFulfilledResult<AgentExecutionResult> => item.status === 'fulfilled')
    .map((item) => item.value);

  const failures = settled.filter((item) => item.status === 'rejected');
  if (!results.length && failures.length) {
    const reason = failures[0].reason;
    throw reason instanceof Error ? reason : new Error('No agent could complete the request.');
  }

  return {
    ok: true,
    requestId: context.requestId,
    response: mergeResults(results),
    agents: selectedAgents.map((agent) => ({ name: agent.name, status: agent.status() })),
  };
}

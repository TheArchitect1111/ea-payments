import { logAIEvent } from '@/lib/ai/logging';
import type { AIRequestContext } from '@/lib/ai/types';
import { verifyAgentCompletion } from '@/lib/agent-reliability/client';
import { matchAgents } from '@/lib/agents/registry';
import type { AgentExecutionResult, AgentFinding, AgentStatus, OrchestratorRequest, OrchestratorResponse } from '@/lib/agents/types';
import { optimizeContext } from '@/lib/context-optimizer';

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

function contextItems(context?: Record<string, unknown>) {
  if (!context) return [];
  return Object.entries(context).map(([key, value]) => ({
    id: key,
    source: 'orchestrator-context',
    priority: key.toLowerCase().includes('constraint') || key.toLowerCase().includes('acceptance') ? 10 : 0,
    text: typeof value === 'string' ? `${key}: ${value}` : `${key}: ${JSON.stringify(value)}`,
  }));
}

function readAgentStatus(agent: { status: unknown }): AgentStatus {
  const value = typeof agent.status === 'function' ? agent.status() : agent.status;
  return value === 'available' || value === 'disabled' || value === 'degraded' ? value : 'degraded';
}

export async function runOrchestrator(request: OrchestratorRequest, context: AIRequestContext): Promise<OrchestratorResponse> {
  const message = request.message?.trim();
  if (!message) throw new Error('Orchestrator requires a message.');

  const selectedAgents = matchAgents(`${request.intent ?? ''} ${message}`, request.requestedAgents).slice(0, request.maxAgents ?? 2);
  logAIEvent('orchestrator.dispatch', context, { agents: selectedAgents.map((agent) => agent.name) });

  const optimized = await optimizeContext({
    query: `${request.intent ?? ''} ${message}`,
    items: contextItems(request.context),
    taskState: {
      goal: message,
      constraints: ['Do not claim completion without verified execution evidence.'],
    },
    maxItems: 12,
    maxChars: 12_000,
  });

  const agentContext: Record<string, unknown> = {
    ...(request.context ?? {}),
    __eaOptimizedContext: optimized.context,
    __eaContextStats: optimized.stats,
  };

  const settled = await Promise.allSettled(selectedAgents.map((agent) => agent.execute({
    intent: request.intent ?? 'general',
    query: message,
    context: agentContext,
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

  const evidence = selectedAgents.map((agent, index) => ({
    name: `agent:${agent.name}`,
    passed: settled[index]?.status === 'fulfilled',
    detail: settled[index]?.status === 'fulfilled' ? 'Agent execution returned a result.' : 'Agent execution failed.',
  }));

  const reliability = await verifyAgentCompletion({
    taskId: context.requestId,
    goal: message,
    claimedStatus: 'finished',
    requiredGates: evidence.map((item) => item.name),
    evidence,
  });

  logAIEvent('orchestrator.reliability', context, {
    verified: reliability.verified,
    missingGates: reliability.missing_gates,
    failedGates: reliability.failed_gates,
    contextReductionRatio: optimized.stats.reductionRatio,
  });

  return {
    ok: true,
    requestId: context.requestId,
    response: mergeResults(results),
    agents: selectedAgents.map((agent) => ({ name: agent.name, status: readAgentStatus(agent) })),
    reliability: {
      verified: reliability.verified,
      status: reliability.status,
      missingGates: reliability.missing_gates,
      failedGates: reliability.failed_gates,
      nextAction: reliability.next_action,
      context: optimized.stats,
    },
  };
}

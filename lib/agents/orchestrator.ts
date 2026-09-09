import { logAIEvent } from '@/lib/ai/logging';
import type { AIRequestContext } from '@/lib/ai/types';
import { verifyAgentCompletion } from '@/lib/agent-reliability/client';
import { getAgent, matchAgents } from '@/lib/agents/registry';
import { creativeBrainAgentNames } from '@/lib/agents/creative-brain-agents';
import type { AgentExecutionResult, AgentFinding, AgentStatus, EAAgent, OrchestratorRequest, OrchestratorResponse } from '@/lib/agents/types';
import { clientContextForAgents, resolveClientContext } from '@/lib/client-context';
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
    source: key === '__eaClientContext' ? 'canonical-client-context' : 'orchestrator-context',
    priority: key === '__eaClientContext' || key.toLowerCase().includes('constraint') || key.toLowerCase().includes('acceptance') ? 10 : 0,
    text: typeof value === 'string' ? `${key}: ${value}` : `${key}: ${JSON.stringify(value)}`,
  }));
}

function readAgentStatus(agent: { status: unknown }): AgentStatus {
  const value = typeof agent.status === 'function' ? agent.status() : agent.status;
  return value === 'available' || value === 'disabled' || value === 'degraded' ? value : 'degraded';
}

function isRunTheBrain(message: string, intent?: string) {
  return /\brun\s+the\s+brain\b/i.test(`${intent ?? ''} ${message}`);
}

function brainAgents(): EAAgent[] {
  return creativeBrainAgentNames
    .map((name) => getAgent(name))
    .filter((agent): agent is EAAgent => Boolean(agent));
}

async function runBrainSequentially(
  selectedAgents: EAAgent[],
  request: OrchestratorRequest,
  message: string,
  baseContext: Record<string, unknown>,
  context: AIRequestContext,
) {
  const results: AgentExecutionResult[] = [];
  const settled: PromiseSettledResult<AgentExecutionResult>[] = [];

  for (const agent of selectedAgents) {
    const prior = results.map((result) => ({
      agent: result.agent,
      summary: result.summary,
      keyFindings: result.keyFindings,
      opportunities: result.opportunities,
      risks: result.risks,
      recommendedNextSteps: result.recommendedNextSteps,
      confidence: result.confidence,
    }));
    try {
      const value = await agent.execute({
        intent: request.intent ?? 'run-the-brain',
        query: message,
        context: {
          ...baseContext,
          __eaBrainMode: true,
          __eaBrainStage: agent.name,
          __eaBrainPriorResults: prior,
        },
        conversationId: request.conversationId,
      }, context);
      results.push(value);
      settled.push({ status: 'fulfilled', value });
    } catch (reason) {
      settled.push({ status: 'rejected', reason });
      break;
    }
  }

  return { results, settled };
}

export async function runOrchestrator(request: OrchestratorRequest, context: AIRequestContext): Promise<OrchestratorResponse> {
  const message = request.message?.trim();
  if (!message) throw new Error('Orchestrator requires a message.');

  const brainMode = isRunTheBrain(message, request.intent);
  const selectedAgents = brainMode
    ? brainAgents()
    : matchAgents(`${request.intent ?? ''} ${message}`, request.requestedAgents).slice(0, request.maxAgents ?? 2);

  const resolvedClientContext = await resolveClientContext(request.context);
  const enrichedContext: Record<string, unknown> = {
    ...(request.context ?? {}),
    ...(resolvedClientContext ? clientContextForAgents(resolvedClientContext) : {}),
    ...(resolvedClientContext ? { __eaClientContext: resolvedClientContext } : {}),
  };

  logAIEvent('orchestrator.dispatch', context, {
    agents: selectedAgents.map((agent) => agent.name),
    brainMode,
    clientId: resolvedClientContext?.profile.clientId,
    clientContextLoaded: Boolean(resolvedClientContext),
  });

  const optimized = await optimizeContext({
    query: `${request.intent ?? ''} ${message}`,
    items: contextItems(enrichedContext),
    taskState: {
      goal: message,
      constraints: [
        'Do not claim completion without verified execution evidence.',
        'Treat canonical client approval rules as hard constraints.',
        ...(brainMode ? [
          'Guide, do not lecture.',
          'Reject generic language and incoherent visual direction.',
          'Demonstrate important claims instead of merely describing them.',
          'Creative QA must be allowed to block weak work.',
        ] : []),
      ],
    },
    maxItems: 16,
    maxChars: 16_000,
  });

  const agentContext: Record<string, unknown> = {
    ...enrichedContext,
    __eaOptimizedContext: optimized.context,
    __eaContextStats: optimized.stats,
  };

  let results: AgentExecutionResult[] = [];
  let settled: PromiseSettledResult<AgentExecutionResult>[] = [];

  if (brainMode) {
    const brainRun = await runBrainSequentially(selectedAgents, request, message, agentContext, context);
    results = brainRun.results;
    settled = brainRun.settled;
  } else {
    settled = await Promise.allSettled(selectedAgents.map((agent) => agent.execute({
      intent: request.intent ?? 'general',
      query: message,
      context: agentContext,
      conversationId: request.conversationId,
    }, context)));
    results = settled
      .filter((item): item is PromiseFulfilledResult<AgentExecutionResult> => item.status === 'fulfilled')
      .map((item) => item.value);
  }

  const failures = settled.filter((item) => item.status === 'rejected');
  if (!results.length && failures.length) {
    const reason = failures[0].reason;
    throw reason instanceof Error ? reason : new Error('No agent could complete the request.');
  }

  const evidence = selectedAgents.map((agent, index) => ({
    name: `agent:${agent.name}`,
    passed: settled[index]?.status === 'fulfilled',
    detail: settled[index]?.status === 'fulfilled' ? 'Agent execution returned a result.' : 'Agent execution failed or was not reached.',
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
    brainMode,
    missingGates: reliability.missing_gates,
    failedGates: reliability.failed_gates,
    contextReductionRatio: optimized.stats.reductionRatio,
    clientContextLoaded: Boolean(resolvedClientContext),
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

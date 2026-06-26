import { NextRequest, NextResponse } from 'next/server';
import { resolveAIActor } from '@/lib/ai/auth';
import { AIGatewayError } from '@/lib/ai/gateway';
import type { AIRequestContext } from '@/lib/ai/types';
import { researchAgent } from '@/lib/agents/research-agent';
import type { AgentExecutionInput } from '@/lib/agents/types';

export const dynamic = 'force-dynamic';

function requestId() {
  return `agent_research_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function routeError(error: unknown, id: string) {
  if (error instanceof AIGatewayError) {
    return NextResponse.json({ ok: false, requestId: id, error: error.message, code: error.code }, { status: error.status });
  }
  return NextResponse.json(
    { ok: false, requestId: id, error: error instanceof Error ? error.message : 'Research Agent request failed.', code: 'RESEARCH_AGENT_ERROR' },
    { status: 500 },
  );
}

export async function POST(req: NextRequest) {
  const id = requestId();
  const actor = await resolveAIActor();
  if (!actor) return NextResponse.json({ ok: false, requestId: id, error: 'Unauthorized.', code: 'UNAUTHORIZED' }, { status: 401 });

  let body: AgentExecutionInput;
  try {
    body = (await req.json()) as AgentExecutionInput;
  } catch {
    return NextResponse.json({ ok: false, requestId: id, error: 'Invalid JSON body.', code: 'INVALID_BODY' }, { status: 400 });
  }

  const context: AIRequestContext = {
    requestId: id,
    actor,
    conversationId: body.conversationId,
    route: '/api/agents/research',
    metadata: { intent: body.intent ?? 'research' },
  };

  try {
    return NextResponse.json({ ok: true, requestId: id, result: await researchAgent.execute(body, context) });
  } catch (error) {
    return routeError(error, id);
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    agent: {
      name: researchAgent.name,
      description: researchAgent.description,
      capabilities: researchAgent.capabilities,
      permissions: researchAgent.permissions,
      status: researchAgent.status(),
    },
    health: await researchAgent.health(),
  });
}

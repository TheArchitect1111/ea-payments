import { NextRequest, NextResponse } from 'next/server';
import { resolveAIActor } from '@/lib/ai/auth';
import { AIGatewayError } from '@/lib/ai/gateway';
import type { AIRequestContext } from '@/lib/ai/types';
import { runOrchestrator } from '@/lib/agents/orchestrator';
import type { OrchestratorRequest } from '@/lib/agents/types';

export const dynamic = 'force-dynamic';

function requestId() {
  return `orch_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function routeError(error: unknown, id: string) {
  if (error instanceof AIGatewayError) {
    return NextResponse.json({ ok: false, requestId: id, error: error.message, code: error.code }, { status: error.status });
  }
  return NextResponse.json(
    { ok: false, requestId: id, error: error instanceof Error ? error.message : 'Orchestrator request failed.', code: 'ORCHESTRATOR_ERROR' },
    { status: 500 },
  );
}

export async function POST(req: NextRequest) {
  const id = requestId();
  const actor = await resolveAIActor();
  if (!actor) return NextResponse.json({ ok: false, requestId: id, error: 'Unauthorized.', code: 'UNAUTHORIZED' }, { status: 401 });

  let body: OrchestratorRequest;
  try {
    body = (await req.json()) as OrchestratorRequest;
  } catch {
    return NextResponse.json({ ok: false, requestId: id, error: 'Invalid JSON body.', code: 'INVALID_BODY' }, { status: 400 });
  }

  const context: AIRequestContext = {
    requestId: id,
    actor,
    conversationId: body.conversationId,
    route: '/api/orchestrator',
    metadata: { intent: body.intent ?? 'general' },
  };

  try {
    return NextResponse.json(await runOrchestrator(body, context));
  } catch (error) {
    return routeError(error, id);
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'EA Orchestrator',
    version: 'sprint-1',
    entrypoint: '/api/orchestrator',
  });
}

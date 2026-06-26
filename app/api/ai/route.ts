import { NextRequest, NextResponse } from 'next/server';
import { resolveAIActor } from '@/lib/ai/auth';
import { AIGatewayError, runAIGateway, streamAIGateway } from '@/lib/ai/gateway';
import type { AIGatewayRequest, AIRequestContext } from '@/lib/ai/types';

export const dynamic = 'force-dynamic';

function requestId() {
  return `ai_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function errorResponse(error: unknown, id: string) {
  if (error instanceof AIGatewayError) {
    return NextResponse.json({ ok: false, requestId: id, error: error.message, code: error.code }, { status: error.status });
  }
  return NextResponse.json({ ok: false, requestId: id, error: error instanceof Error ? error.message : 'AI request failed.', code: 'AI_ERROR' }, { status: 500 });
}

export async function POST(req: NextRequest) {
  const id = requestId();
  const actor = await resolveAIActor();
  if (!actor) return NextResponse.json({ ok: false, requestId: id, error: 'Unauthorized.', code: 'UNAUTHORIZED' }, { status: 401 });

  let body: AIGatewayRequest;
  try {
    body = (await req.json()) as AIGatewayRequest;
  } catch {
    return NextResponse.json({ ok: false, requestId: id, error: 'Invalid JSON body.', code: 'INVALID_BODY' }, { status: 400 });
  }

  const context: AIRequestContext = {
    requestId: id,
    actor,
    conversationId: body.conversationId,
    route: '/api/ai',
    metadata: body.metadata,
  };

  try {
    if (body.stream) return streamAIGateway(body, context);
    return NextResponse.json(await runAIGateway(body, context));
  } catch (error) {
    return errorResponse(error, id);
  }
}

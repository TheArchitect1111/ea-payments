import { NextResponse } from 'next/server';
import { runAIGateway } from '@/lib/ai/gateway';
import type { AIRequestContext } from '@/lib/ai/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const context: AIRequestContext = {
    requestId: `ai_failover_smoke_${Date.now()}`,
    actor: { id: 'system:ai-failover-smoke', type: 'system', role: 'production-smoke' },
    route: '/api/ops/ai-failover-smoke',
    metadata: { purpose: 'provider-failover-smoke' },
  };

  const result = await runAIGateway({
    messages: [{ role: 'user', content: 'Reply with exactly: EA FAILOVER OK' }],
    system: 'This is a production routing smoke test. Follow the requested output exactly.',
    temperature: 0,
    maxOutputTokens: 20,
    promptVersion: 'ai-failover-smoke-v1',
    metadata: { purpose: 'provider-failover-smoke' },
  }, context);

  return NextResponse.json({
    ok: result.ok,
    requestId: result.requestId,
    provider: result.provider,
    model: result.model,
    text: result.text,
  });
}

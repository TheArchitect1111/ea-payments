import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import { buildAIProviderHealthReport } from '@/lib/ai/provider-health';
import { runAIGateway } from '@/lib/ai/gateway';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });

  const configuration = buildAIProviderHealthReport();
  if (!configuration.available) {
    return NextResponse.json({ ok: false, configuration, error: 'No AI provider path is configured.' }, { status: 503 });
  }

  const requestId = `ai_health_${Date.now()}`;
  const started = Date.now();
  try {
    const result = await runAIGateway({
      model: process.env.AI_MODEL_DEFAULT,
      responseFormat: 'json',
      maxOutputTokens: 40,
      promptVersion: 'run10-ai-health-v1',
      system: 'You are a production health probe. Return only valid JSON.',
      messages: [{ role: 'user', content: 'Return exactly {"status":"ok"}.' }],
      metadata: { probe: 'run10-ai-health' },
    }, {
      requestId,
      actor: { id: 'ea-ai-health', type: 'admin', role: 'system' },
      route: '/api/admin/ai-health',
      metadata: { probe: 'run10-ai-health' },
    });

    return NextResponse.json({
      ok: true,
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - started,
      provider: result.provider,
      model: result.model,
      configuration,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - started,
      configuration,
      error: error instanceof Error ? error.message : 'AI health probe failed.',
    }, { status: 502 });
  }
}

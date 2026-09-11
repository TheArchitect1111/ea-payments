import { NextResponse } from 'next/server';
import { buildAIProviderHealthReport } from '@/lib/ai/provider-health';
import { runAIGateway } from '@/lib/ai/gateway';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  if (process.env.VERCEL_ENV === 'production') return new NextResponse(null, { status: 404 });
  const configuration = buildAIProviderHealthReport();
  if (!configuration.available) return NextResponse.json({ ok: false, configuration, error: 'No AI provider path configured.' }, { status: 503 });

  const started = Date.now();
  try {
    const result = await runAIGateway({
      responseFormat: 'json',
      maxOutputTokens: 40,
      promptVersion: 'run10-preview-cert-v1',
      system: 'You are a production certification probe. Return only valid JSON.',
      messages: [{ role: 'user', content: 'Return exactly {"status":"ok"}.' }],
      metadata: { probe: 'run10-preview-cert' },
    }, {
      requestId: `run10_${Date.now()}`,
      actor: { id: 'run10-preview-cert', type: 'admin', role: 'system' },
      route: '/api/internal/run10-ai-smoke',
      metadata: { probe: 'run10-preview-cert' },
    });
    return NextResponse.json({ ok: true, provider: result.provider, model: result.model, latencyMs: Date.now() - started, configuration });
  } catch (error) {
    return NextResponse.json({ ok: false, latencyMs: Date.now() - started, configuration, error: error instanceof Error ? error.message : 'AI probe failed.' }, { status: 502 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiVideo, geminiVideoConfigured } from '@/lib/integrations/video/gemini';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'EA Video Test Console',
    status: geminiVideoConfigured() ? 'ready' : 'gemini-api-key-not-configured',
    defaultPrompt: 'Why wealthy people use debt differently.',
    endpoint: '/admin/video-test',
  });
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as { prompt?: string; aspectRatio?: '16:9' | '9:16' };
    const prompt = payload.prompt?.trim() || 'Why wealthy people use debt differently.';
    const generated = await generateGeminiVideo({ prompt, aspectRatio: payload.aspectRatio ?? '16:9' });
    return new NextResponse(Buffer.from(generated.bytes), {
      status: 200,
      headers: {
        'Content-Type': generated.mimeType,
        'Content-Disposition': 'inline; filename="ea-generated-video.mp4"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      service: 'EA Video Test Console',
      status: 'generation-failed',
      error: error instanceof Error ? error.message : 'Unknown video generation error',
    }, { status: 502 });
  }
}

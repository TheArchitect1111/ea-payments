import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiVideo, geminiVideoConfigured } from '@/lib/integrations/video/gemini';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isAuthorized(req: NextRequest): boolean {
  const configuredSecret = process.env.YOUTUBE_PUBLISH_SECRET?.trim();
  if (!configuredSecret) return false;
  const supplied = req.headers.get('x-ea-youtube-publish-secret')?.trim();
  return Boolean(supplied && supplied === configuredSecret);
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'EA Video Generator',
    provider: 'Gemini Omni Flash',
    model: 'gemini-omni-flash-preview',
    status: geminiVideoConfigured() ? 'ready' : 'gemini-api-key-not-configured',
    output: 'video/mp4',
    aspectRatios: ['16:9', '9:16'],
  });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { ok: false, service: 'EA Video Generator', status: 'unauthorized' },
      { status: 401 },
    );
  }

  try {
    const payload = (await req.json()) as { prompt?: string; aspectRatio?: '16:9' | '9:16' };
    const generated = await generateGeminiVideo({
      prompt: payload.prompt ?? '',
      aspectRatio: payload.aspectRatio,
    });

    return new NextResponse(Buffer.from(generated.bytes), {
      status: 200,
      headers: {
        'Content-Type': generated.mimeType,
        'Content-Disposition': 'attachment; filename="ea-generated-video.mp4"',
        ...(generated.interactionId ? { 'x-ea-video-interaction-id': generated.interactionId } : {}),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: 'EA Video Generator',
        status: 'generation-failed',
        error: error instanceof Error ? error.message : 'Unknown video generation error',
      },
      { status: 502 },
    );
  }
}

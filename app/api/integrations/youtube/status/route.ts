import { NextResponse } from 'next/server';
import { getYouTubeAccessToken, youtubePublisherConfigured } from '@/lib/integrations/youtube/publisher';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!youtubePublisherConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        service: 'EA YouTube Publisher',
        status: 'not-configured',
      },
      { status: 503 },
    );
  }

  try {
    await getYouTubeAccessToken();
    return NextResponse.json({
      ok: true,
      service: 'EA YouTube Publisher',
      status: 'ready',
      capabilities: ['refresh-access-token', 'resumable-video-upload', 'metadata', 'scheduling', 'thumbnail-upload'],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: 'EA YouTube Publisher',
        status: 'token-refresh-failed',
        error: error instanceof Error ? error.message : 'YouTube token refresh failed.',
      },
      { status: 502 },
    );
  }
}

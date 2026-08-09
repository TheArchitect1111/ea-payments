import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { getYouTubeAccessToken, youtubePublisherConfigured } from '@/lib/integrations/youtube/publisher';

export const dynamic = 'force-dynamic';

function storedTokenDiagnostics() {
  const token = process.env.YOUTUBE_REFRESH_TOKEN?.trim();
  if (!token) return { refreshTokenFingerprint: null, refreshTokenLength: null };
  return {
    refreshTokenFingerprint: createHash('sha256').update(token).digest('hex').slice(0, 12),
    refreshTokenLength: token.length,
  };
}

export async function GET() {
  const diagnostics = storedTokenDiagnostics();

  if (!youtubePublisherConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        service: 'EA YouTube Publisher',
        status: 'not-configured',
        ...diagnostics,
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
      ...diagnostics,
      capabilities: ['refresh-access-token', 'resumable-video-upload', 'metadata', 'scheduling', 'thumbnail-upload'],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: 'EA YouTube Publisher',
        status: 'token-refresh-failed',
        ...diagnostics,
        error: error instanceof Error ? error.message : 'YouTube token refresh failed.',
      },
      { status: 502 },
    );
  }
}

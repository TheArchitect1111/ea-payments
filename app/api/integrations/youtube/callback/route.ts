import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CALLBACK_PATH = '/api/integrations/youtube/callback';

/**
 * Google redirects YouTube OAuth authorization responses here.
 *
 * This first implementation intentionally does not exchange or persist OAuth
 * tokens yet. It establishes a stable production callback URL so the Google
 * OAuth client can be configured safely before the credential-exchange and
 * token-storage layer is wired.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const providerError = url.searchParams.get('error');
  const code = url.searchParams.get('code');

  if (providerError) {
    return NextResponse.json(
      {
        ok: false,
        service: 'EA YouTube OAuth callback',
        error: 'Google did not authorize the YouTube connection.',
        code: 'YOUTUBE_OAUTH_DENIED',
      },
      { status: 400 },
    );
  }

  if (!code) {
    return NextResponse.json({
      ok: true,
      service: 'EA YouTube OAuth callback',
      callbackPath: CALLBACK_PATH,
      status: 'ready-for-google-client-registration',
    });
  }

  return NextResponse.json(
    {
      ok: false,
      service: 'EA YouTube OAuth callback',
      error: 'OAuth callback received. Token exchange is not enabled yet.',
      code: 'YOUTUBE_OAUTH_TOKEN_EXCHANGE_PENDING',
    },
    { status: 501 },
  );
}

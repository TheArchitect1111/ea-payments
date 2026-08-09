import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CALLBACK_PATH = '/api/integrations/youtube/callback';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const providerError = url.searchParams.get('error');
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const expectedState = req.cookies.get('ea_youtube_oauth_state')?.value;

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

  if (!state || !expectedState || state !== expectedState) {
    return NextResponse.json(
      {
        ok: false,
        service: 'EA YouTube OAuth callback',
        error: 'OAuth state validation failed. Start the connection again.',
        code: 'YOUTUBE_OAUTH_STATE_INVALID',
      },
      { status: 400 },
    );
  }

  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      {
        ok: false,
        service: 'EA YouTube OAuth callback',
        error: 'YouTube OAuth environment variables are not configured.',
        code: 'YOUTUBE_OAUTH_NOT_CONFIGURED',
      },
      { status: 503 },
    );
  }

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
    cache: 'no-store',
  });

  const tokens = (await tokenResponse.json()) as GoogleTokenResponse;

  if (!tokenResponse.ok || !tokens.access_token) {
    return NextResponse.json(
      {
        ok: false,
        service: 'EA YouTube OAuth callback',
        error: tokens.error_description || tokens.error || 'Google token exchange failed.',
        code: 'YOUTUBE_OAUTH_TOKEN_EXCHANGE_FAILED',
      },
      { status: 502 },
    );
  }

  const response = NextResponse.json({
    ok: true,
    service: 'EA YouTube OAuth callback',
    status: tokens.refresh_token ? 'refresh-token-ready' : 'authorized-no-refresh-token',
    refreshToken: tokens.refresh_token ?? null,
    scope: tokens.scope ?? null,
    expiresIn: tokens.expires_in ?? null,
    next: tokens.refresh_token
      ? 'Save refreshToken as YOUTUBE_REFRESH_TOKEN in the Production environment, then redeploy.'
      : 'Reconnect using /api/integrations/youtube/connect and approve access again.',
  });

  response.cookies.delete('ea_youtube_oauth_state');
  return response;
}

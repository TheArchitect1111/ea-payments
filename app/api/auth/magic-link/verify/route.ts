import { NextRequest, NextResponse } from 'next/server';
import { exchangeMagicLinkToken, type MagicLinkExchangeError } from '@/lib/auth';
import { authSiteOrigin } from '@/lib/auth/site-origin';
import type { MagicLinkRealm } from '@/lib/magic-link';

export const dynamic = 'force-dynamic';

function loginUrl(origin: string, realm: MagicLinkRealm, error: string, next?: string): URL {
  const path =
    realm === 'admin' ? '/admin/login' : realm === 'simplifi' ? '/simplifi/login' : '/portal/login';
  const url = new URL(path, origin);
  url.searchParams.set('error', error);
  if (next) url.searchParams.set('next', next);
  return url;
}

/** Map exchange error codes to login redirect error params. */
function redirectError(error: MagicLinkExchangeError): string {
  return error;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || '';
  // Land on the stable hub origin — never the vanity portal host after verify.
  const origin = authSiteOrigin(req);

  const result = await exchangeMagicLinkToken(token);

  if (!result.ok) {
    return NextResponse.redirect(
      loginUrl(origin, result.realm, redirectError(result.error), result.next),
      303,
    );
  }

  result.runSideEffects();

  if (result.next.startsWith('simplifi://')) {
    const deep = new URL(result.next);
    deep.searchParams.set('token', result.token);
    return NextResponse.redirect(deep.toString(), 303);
  }

  const res = NextResponse.redirect(new URL(result.next, origin), 303);
  res.cookies.set(result.cookie);
  return res;
}

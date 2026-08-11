import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';
import { decryptAccounts, providerConfigs, providerCookie } from '@/lib/amplifi-native-social';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const providers = providerConfigs().map((config) => {
    const accounts = decryptAccounts(req.cookies.get(providerCookie(config.provider))?.value);
    return { ...config, accounts: accounts.map(({ accessToken: _accessToken, refreshToken: _refreshToken, ...account }) => account) };
  });
  return NextResponse.json({ ok: true, providers, connections: providers.flatMap((item) => item.accounts) });
}

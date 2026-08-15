import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';
import { loadAmplifiConnections, saveAmplifiConnections } from '@/lib/amplifi-connection-store';
import { decryptAccounts, providerConfigs, providerCookie } from '@/lib/amplifi-native-social';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  let connections = await loadAmplifiConnections(auth.session.slug);

  // One-time migration for connections created before durable storage shipped.
  for (const config of providerConfigs()) {
    if (connections.some((account) => account.provider === config.provider)) continue;
    const legacy = decryptAccounts(req.cookies.get(providerCookie(config.provider))?.value);
    if (!legacy.length) continue;
    await saveAmplifiConnections(auth.session.slug, config.provider, legacy);
    connections = [...connections, ...legacy];
  }

  const providers = providerConfigs().map((config) => {
    const accounts = connections.filter((account) => account.provider === config.provider);
    return { ...config, accounts: accounts.map(({ accessToken: _accessToken, refreshToken: _refreshToken, ...account }) => account) };
  });
  return NextResponse.json({ ok: true, providers, connections: providers.flatMap((item) => item.accounts) });
}

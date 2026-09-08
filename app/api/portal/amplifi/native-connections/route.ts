import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';
import { loadAmplifiConnections, saveAmplifiConnections } from '@/lib/amplifi-connection-store';
import { decryptAccounts, providerConfigs, providerCookie } from '@/lib/amplifi-native-social';
import { getGatewayConnections, getAyrshareProfileKey, isAyrshareConfigured } from '@/lib/amplifi-publishing-gateway';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  let connections = await loadAmplifiConnections(auth.session.slug);

  // Trial workspaces must never inherit provider cookies created by another tenant.
  // Legacy migration remains available only to established workspaces.
  const canMigrateLegacyCookies = !auth.session.slug.startsWith('amplifi-trial-');
  for (const config of canMigrateLegacyCookies ? providerConfigs() : []) {
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

  const gatewayPlatforms = await getGatewayConnections(auth.session.slug);
  const gatewayAccounts = gatewayPlatforms.map((platform) => ({
    id: `gateway:${platform}`,
    platform,
    name: platform,
    provider: 'gateway',
  }));

  // Amplifi creation, research, approvals, and calendar work must remain available
  // even when no publishing account has been connected yet. The workspace entry is
  // intentionally non-publishable; the publish endpoint still requires a real account.
  const usableConnections = gatewayAccounts.length || connections.length
    ? [...gatewayAccounts, ...providers.flatMap((item) => item.accounts)]
    : [{ id: 'amplifi-draft-mode', platform: 'amplifi', name: 'Draft & approval mode', provider: 'workspace' }];

  return NextResponse.json({
    ok: true,
    providers,
    connections: usableConnections,
    publishing: {
      gateway: isAyrshareConfigured() && Boolean(getAyrshareProfileKey(auth.session.slug)),
      connectedPlatforms: gatewayPlatforms,
      mode: gatewayPlatforms.length ? 'gateway' : connections.length ? 'native' : 'draft',
    },
  });
}

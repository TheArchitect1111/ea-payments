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
  const nativeAccounts = providers.flatMap((item) => item.accounts);

  const gatewayPlatforms = await getGatewayConnections(auth.session.slug);
  const gatewayProfileKey = isAyrshareConfigured()
    ? await getAyrshareProfileKey(auth.session.slug, false)
    : '';
  const gatewayAccounts = gatewayPlatforms.map((platform) => ({
    id: `gateway:${platform}`,
    platform,
    name: platform,
    provider: 'gateway',
  }));

  // Amplifi creation, research, approvals, and calendar work remain available
  // without a publishing connection. This workspace entry is deliberately not
  // publishable; the publish endpoint still requires a real connected account.
  const usableConnections = gatewayAccounts.length || nativeAccounts.length
    ? [...gatewayAccounts, ...nativeAccounts]
    : [{ id: 'amplifi-draft-mode', platform: 'amplifi', name: 'Draft & approval mode', provider: 'workspace' }];

  return NextResponse.json({
    ok: true,
    providers,
    connections: usableConnections,
    publishing: {
      gateway: Boolean(gatewayProfileKey),
      gatewayAvailable: isAyrshareConfigured(),
      connectedPlatforms: gatewayPlatforms,
      mode: gatewayPlatforms.length ? 'gateway' : nativeAccounts.length ? 'native' : 'draft',
    },
  });
}

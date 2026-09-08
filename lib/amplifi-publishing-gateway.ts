import { loadAmplifiConnections } from '@/lib/amplifi-connection-store';
import { publishNative } from '@/lib/amplifi-native-social';

export type AmplifiPublishTarget = 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'x';
export type AmplifiPublishResult = {
  ok: boolean;
  provider: 'ayrshare' | 'native';
  id?: string;
  platform?: string;
  error?: string;
  details?: unknown;
};

function ayrshareApiKey(): string {
  return process.env.AYRSHARE_API_KEY?.trim() || '';
}

export function isAyrshareConfigured(): boolean {
  return Boolean(ayrshareApiKey());
}

function profileKeyEnvName(portalSlug: string): string {
  return `AYRSHARE_PROFILE_KEY_${portalSlug.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
}

export function getAyrshareProfileKey(portalSlug: string): string {
  const mapped = process.env.AYRSHARE_PROFILE_KEYS_JSON?.trim();
  if (mapped) {
    try {
      const parsed = JSON.parse(mapped) as Record<string, string>;
      const key = parsed[portalSlug]?.trim();
      if (key) return key;
    } catch {
      // Ignore malformed optional mapping and continue to per-tenant env lookup.
    }
  }
  return process.env[profileKeyEnvName(portalSlug)]?.trim() || '';
}

async function ayrshareRequest(path: string, portalSlug: string, init?: RequestInit): Promise<Record<string, unknown>> {
  const apiKey = ayrshareApiKey();
  const profileKey = getAyrshareProfileKey(portalSlug);
  if (!apiKey) throw new Error('Amplifi publishing gateway is not configured.');
  if (!profileKey) throw new Error('This portal does not have a publishing profile yet.');

  const response = await fetch(`https://api.ayrshare.com${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Profile-Key': profileKey,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const message = String(payload.message || payload.error || payload.details || 'Publishing gateway request failed.');
    throw new Error(message);
  }
  return payload;
}

export async function getGatewayConnections(portalSlug: string): Promise<string[]> {
  if (!isAyrshareConfigured() || !getAyrshareProfileKey(portalSlug)) return [];
  try {
    const data = await ayrshareRequest('/api/user', portalSlug, { method: 'GET' });
    const connected = data.connected;
    if (Array.isArray(connected)) return connected.map(String);
    if (connected && typeof connected === 'object') {
      return Object.entries(connected as Record<string, unknown>)
        .filter(([, value]) => Boolean(value))
        .map(([platform]) => platform);
    }
    return [];
  } catch {
    return [];
  }
}

export async function createGatewayConnectUrl(portalSlug: string, redirectUrl: string): Promise<string> {
  const data = await ayrshareRequest('/api/connect', portalSlug, {
    method: 'POST',
    body: JSON.stringify({ profileKey: getAyrshareProfileKey(portalSlug), redirectUrl }),
  });
  const url = String(data.url || '');
  if (!url) throw new Error('Publishing gateway did not return a connection URL.');
  return url;
}

export async function publishThroughGateway(input: {
  portalSlug: string;
  text: string;
  mediaUrl?: string;
  platforms?: AmplifiPublishTarget[];
  scheduleDate?: string;
}): Promise<AmplifiPublishResult[]> {
  const { portalSlug, text, mediaUrl, platforms, scheduleDate } = input;
  if (isAyrshareConfigured() && getAyrshareProfileKey(portalSlug)) {
    try {
      const connected = await getGatewayConnections(portalSlug);
      const requested = platforms?.length ? platforms : connected as AmplifiPublishTarget[];
      if (!requested.length) {
        return [{ ok: false, provider: 'ayrshare', error: 'Connect at least one social account before publishing.' }];
      }
      const payload = await ayrshareRequest('/api/post', portalSlug, {
        method: 'POST',
        body: JSON.stringify({
          post: text,
          platforms: requested,
          ...(mediaUrl ? { mediaUrls: [mediaUrl] } : {}),
          ...(scheduleDate ? { scheduleDate } : {}),
        }),
      });
      const postIds = Array.isArray(payload.postIds) ? payload.postIds as Array<Record<string, unknown>> : [];
      if (postIds.length) {
        return postIds.map((item) => ({
          ok: String(item.status || '').toLowerCase() === 'success',
          provider: 'ayrshare',
          platform: String(item.platform || ''),
          id: item.id ? String(item.id) : undefined,
          error: item.error ? String(item.error) : undefined,
          details: item,
        }));
      }
      return [{
        ok: String(payload.status || '').toLowerCase() === 'success' || Boolean(payload.id),
        provider: 'ayrshare',
        id: payload.id ? String(payload.id) : undefined,
        details: payload,
      }];
    } catch (error) {
      return [{ ok: false, provider: 'ayrshare', error: error instanceof Error ? error.message : 'Publishing gateway failed.' }];
    }
  }

  const nativeAccounts = await loadAmplifiConnections(portalSlug);
  if (!nativeAccounts.length) {
    return [{ ok: false, provider: 'native', error: 'Connect at least one social account before publishing.' }];
  }
  return Promise.all(nativeAccounts.map(async (account) => {
    const result = await publishNative(account, text, mediaUrl);
    return {
      ok: result.ok,
      provider: 'native' as const,
      platform: account.platform,
      id: result.id,
      error: result.error,
    };
  }));
}

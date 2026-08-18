import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export type NativeProvider = 'meta' | 'linkedin' | 'tiktok' | 'x';
export type NativeAccount = {
  id: string;
  provider: NativeProvider;
  platform: 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'x';
  name: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
};

type ProviderConfig = { provider: NativeProvider; label: string; configured: boolean };

const VERIFIED_META_APP_ID = '2139741059907065';

function metaAppId(): string {
  const configured = process.env.META_APP_ID?.trim();
  return configured && /^\d{10,20}$/.test(configured) ? configured : VERIFIED_META_APP_ID;
}

function key(): Buffer {
  const secret = process.env.AMPLIFI_OAUTH_ENCRYPTION_KEY?.trim() || process.env.SESSION_SECRET?.trim();
  if (!secret) throw new Error('AMPLIFI_OAUTH_ENCRYPTION_KEY is not configured');
  return createHash('sha256').update(secret).digest();
}

export function encryptAccounts(accounts: NativeAccount[]): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(accounts), 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((value) => value.toString('base64url')).join('.');
}

export function decryptAccounts(value?: string): NativeAccount[] {
  if (!value) return [];
  try {
    const [ivValue, tagValue, encryptedValue] = value.split('.');
    if (!ivValue || !tagValue || !encryptedValue) return [];
    const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(ivValue, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
    const text = Buffer.concat([decipher.update(Buffer.from(encryptedValue, 'base64url')), decipher.final()]).toString('utf8');
    const parsed = JSON.parse(text) as NativeAccount[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function providerCookie(provider: NativeProvider): string {
  return `amplifi_social_${provider}`;
}

type OAuthStatePayload = {
  provider: NativeProvider;
  returnOrigin: string;
  portalSlug: string;
  expiresAt: number;
  nonce: string;
};

export function createOAuthState(provider: NativeProvider, returnOrigin: string, portalSlug: string): string {
  const payload: OAuthStatePayload = {
    provider,
    returnOrigin,
    portalSlug,
    expiresAt: Date.now() + 10 * 60 * 1000,
    nonce: randomBytes(18).toString('base64url'),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', key()).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifyOAuthState(state: string, provider: NativeProvider): OAuthStatePayload | null {
  try {
    const [encoded, signature] = state.split('.');
    if (!encoded || !signature) return null;
    const expected = createHmac('sha256', key()).update(encoded).digest();
    const received = Buffer.from(signature, 'base64url');
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as OAuthStatePayload;
    if (payload.provider !== provider || payload.expiresAt < Date.now() || !payload.portalSlug) return null;
    if (!new URL(payload.returnOrigin).hostname.endsWith('efficiencyarchitects.online')) return null;
    return payload;
  } catch {
    return null;
  }
}

export function providerConfigs(): ProviderConfig[] {
  return [
    { provider: 'meta', label: 'Facebook & Instagram', configured: Boolean(metaAppId() && process.env.META_APP_SECRET && process.env.META_CONFIG_ID) },
    { provider: 'linkedin', label: 'LinkedIn', configured: Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) },
    { provider: 'tiktok', label: 'TikTok', configured: Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET) },
    { provider: 'x', label: 'X', configured: Boolean(process.env.X_CLIENT_ID) },
  ];
}

export function isNativeProvider(value: string): value is NativeProvider {
  return value === 'meta' || value === 'linkedin' || value === 'tiktok' || value === 'x';
}

export function oauthStart(provider: NativeProvider, origin: string, state: string, verifier?: string): string {
  const redirectUri = `${origin}/api/portal/amplifi/native-connections/${provider}/callback`;
  if (provider === 'meta') {
    const url = new URL('https://www.facebook.com/v26.0/dialog/oauth');
    url.search = new URLSearchParams({
      client_id: metaAppId(),
      redirect_uri: redirectUri,
      state,
      response_type: 'code',
      override_default_response_type: 'true',
      config_id: process.env.META_CONFIG_ID?.trim() || '',
      scope: 'pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish,business_management',
    }).toString();
    return url.toString();
  }
  if (provider === 'linkedin') {
    const url = new URL('https://www.linkedin.com/oauth/v2/authorization');
    url.search = new URLSearchParams({
      response_type: 'code', client_id: process.env.LINKEDIN_CLIENT_ID || '', redirect_uri: redirectUri,
      state, scope: 'openid profile w_member_social',
    }).toString();
    return url.toString();
  }
  if (provider === 'tiktok') {
    const url = new URL('https://www.tiktok.com/v2/auth/authorize/');
    url.search = new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY || '', response_type: 'code', scope: 'user.info.basic,video.publish,video.upload',
      redirect_uri: redirectUri, state,
    }).toString();
    return url.toString();
  }
  const challenge = createHash('sha256').update(verifier || '').digest('base64url');
  const url = new URL('https://x.com/i/oauth2/authorize');
  url.search = new URLSearchParams({
    response_type: 'code', client_id: process.env.X_CLIENT_ID || '', redirect_uri: redirectUri,
    scope: 'tweet.read tweet.write users.read offline.access media.write', state,
    code_challenge: challenge, code_challenge_method: 'S256',
  }).toString();
  return url.toString();
}

async function jsonFetch(url: string, init?: RequestInit): Promise<Record<string, unknown>> {
  const response = await fetch(url, { ...init, cache: 'no-store' });
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) throw new Error(String(payload.error_description || payload.message || payload.error || 'Social authorization failed'));
  return payload;
}

export async function exchangeProviderCode(provider: NativeProvider, code: string, origin: string, verifier?: string): Promise<NativeAccount[]> {
  const redirectUri = `${origin}/api/portal/amplifi/native-connections/${provider}/callback`;
  if (provider === 'meta') {
    const token = await jsonFetch(`https://graph.facebook.com/v26.0/oauth/access_token?${new URLSearchParams({
      client_id: metaAppId(), client_secret: process.env.META_APP_SECRET || '', redirect_uri: redirectUri, code,
    })}`);
    const userToken = String(token.access_token || '');
    const pages = await jsonFetch(`https://graph.facebook.com/v26.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username},connected_instagram_account{id,username}&access_token=${encodeURIComponent(userToken)}`);
    const rows = Array.isArray(pages.data) ? pages.data as Record<string, unknown>[] : [];
    const accounts: NativeAccount[] = [];
    for (const page of rows) {
      const pageToken = String(page.access_token || '');
      accounts.push({ id: String(page.id), provider, platform: 'facebook', name: String(page.name || 'Facebook Page'), accessToken: pageToken });
      let instagram = (page.instagram_business_account || page.connected_instagram_account) as Record<string, unknown> | undefined;
      if (!instagram?.id && page.id && pageToken) {
        const pageDetails = await jsonFetch(`https://graph.facebook.com/v26.0/${encodeURIComponent(String(page.id))}?fields=instagram_business_account{id,username},connected_instagram_account{id,username}&access_token=${encodeURIComponent(pageToken)}`);
        instagram = (pageDetails.instagram_business_account || pageDetails.connected_instagram_account) as Record<string, unknown> | undefined;
      }
      if (instagram?.id) accounts.push({ id: String(instagram.id), provider, platform: 'instagram', name: String(instagram.username || page.name || 'Instagram'), accessToken: pageToken });
    }
    if (!accounts.length) {
      throw new Error('Meta did not return an eligible Facebook Page. Confirm Page access and the selected business assets.');
    }
    return accounts;
  }
  if (provider === 'linkedin') {
    const body = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: process.env.LINKEDIN_CLIENT_ID || '', client_secret: process.env.LINKEDIN_CLIENT_SECRET || '' });
    const token = await jsonFetch('https://www.linkedin.com/oauth/v2/accessToken', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    const accessToken = String(token.access_token || '');
    const profile = await jsonFetch('https://api.linkedin.com/v2/userinfo', { headers: { Authorization: `Bearer ${accessToken}` } });
    return [{ id: String(profile.sub || ''), provider, platform: 'linkedin', name: String(profile.name || 'LinkedIn'), accessToken, expiresAt: Date.now() + Number(token.expires_in || 0) * 1000 }];
  }
  if (provider === 'tiktok') {
    const body = new URLSearchParams({ client_key: process.env.TIKTOK_CLIENT_KEY || '', client_secret: process.env.TIKTOK_CLIENT_SECRET || '', code, grant_type: 'authorization_code', redirect_uri: redirectUri });
    const token = await jsonFetch('https://open.tiktokapis.com/v2/oauth/token/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    const accessToken = String(token.access_token || '');
    const user = await jsonFetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url', { headers: { Authorization: `Bearer ${accessToken}` } });
    const data = (user.data as Record<string, unknown> | undefined)?.user as Record<string, unknown> | undefined;
    return [{ id: String(token.open_id || data?.open_id || ''), provider, platform: 'tiktok', name: String(data?.display_name || 'TikTok'), accessToken, refreshToken: String(token.refresh_token || ''), expiresAt: Date.now() + Number(token.expires_in || 0) * 1000 }];
  }
  const body = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, code_verifier: verifier || '', client_id: process.env.X_CLIENT_ID || '' });
  const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
  if (process.env.X_CLIENT_SECRET) headers.Authorization = `Basic ${Buffer.from(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`).toString('base64')}`;
  const token = await jsonFetch('https://api.x.com/2/oauth2/token', { method: 'POST', headers, body });
  const accessToken = String(token.access_token || '');
  const me = await jsonFetch('https://api.x.com/2/users/me', { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = me.data as Record<string, unknown> | undefined;
  return [{ id: String(data?.id || ''), provider, platform: 'x', name: String(data?.username || data?.name || 'X'), accessToken, refreshToken: String(token.refresh_token || ''), expiresAt: Date.now() + Number(token.expires_in || 0) * 1000 }];
}

export async function publishNative(account: NativeAccount, text: string, mediaUrl?: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    if (account.platform === 'facebook') {
      const data = await jsonFetch(`https://graph.facebook.com/v26.0/${account.id}/feed`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, access_token: account.accessToken }) });
      return { ok: true, id: String(data.id || '') };
    }
    if (account.platform === 'instagram') {
      if (!mediaUrl) return { ok: false, error: 'Instagram requires an image or video.' };
      const container = await jsonFetch(`https://graph.facebook.com/v26.0/${account.id}/media`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image_url: mediaUrl, caption: text, access_token: account.accessToken }) });
      const published = await jsonFetch(`https://graph.facebook.com/v26.0/${account.id}/media_publish`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ creation_id: container.id, access_token: account.accessToken }) });
      return { ok: true, id: String(published.id || '') };
    }
    if (account.platform === 'linkedin') {
      const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${account.accessToken}`, 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0' },
        body: JSON.stringify({ author: `urn:li:person:${account.id}`, lifecycleState: 'PUBLISHED', specificContent: { 'com.linkedin.ugc.ShareContent': { shareCommentary: { text }, shareMediaCategory: 'NONE' } }, visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' } }),
      });
      if (!response.ok) throw new Error(await response.text());
      return { ok: true, id: response.headers.get('x-restli-id') || undefined };
    }
    if (account.platform === 'x') {
      const data = await jsonFetch('https://api.x.com/2/tweets', { method: 'POST', headers: { Authorization: `Bearer ${account.accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ text: text.slice(0, 280) }) });
      const row = data.data as Record<string, unknown> | undefined;
      return { ok: true, id: String(row?.id || '') };
    }
    if (!mediaUrl) return { ok: false, error: 'TikTok requires an image or video.' };
    return { ok: false, error: 'TikTok media transfer is ready but requires an approved Content Posting app before activation.' };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Publishing failed' };
  }
}

import {
  platformCreate,
  platformQuery,
  platformStoreConfigured,
  platformUpdate,
} from '@/lib/platform-store';

const PUSH_TABLE = process.env.AIRTABLE_PUSH_TOKENS_TABLE?.trim() || 'Push Tokens';

export type PushPlatform = 'ios' | 'android' | 'web' | 'expo';

const memoryTokens = new Map<string, string>();

function cacheKey(slug: string, email: string, platform: PushPlatform): string {
  return `${slug}:${email.toLowerCase()}:${platform}`;
}

export async function savePushToken(input: {
  slug: string;
  email: string;
  token: string;
  platform: PushPlatform;
}): Promise<{ ok: boolean; persisted: boolean }> {
  const key = cacheKey(input.slug, input.email, input.platform);
  memoryTokens.set(key, input.token);

  if (!platformStoreConfigured()) {
    return { ok: true, persisted: false };
  }

  const formula = `AND({Portal Slug}='${input.slug.replace(/'/g, "\\'")}', {Email}='${input.email.replace(/'/g, "\\'")}', {Platform}='${input.platform}')`;
  const rows = await platformQuery(PUSH_TABLE, formula, 1);
  const fields = {
    'Portal Slug': input.slug,
    Email: input.email,
    Platform: input.platform,
    Token: input.token,
    'Updated At': new Date().toISOString(),
  };

  if (rows[0]?.id) {
    await platformUpdate(PUSH_TABLE, rows[0].id, fields);
    return { ok: true, persisted: true };
  }

  const created = await platformCreate(PUSH_TABLE, fields);
  return { ok: Boolean(created), persisted: Boolean(created) };
}

export function getCachedPushToken(
  slug: string,
  email: string,
  platform: PushPlatform,
): string | undefined {
  return memoryTokens.get(cacheKey(slug, email, platform));
}

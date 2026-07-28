/**
 * Simplifi Orb account deletion — Play-compliant personal data removal.
 * Suspends portal access and scrubs PII for the authenticated client.
 * Shared demo tenants only scrub device tokens (do not suspend the shared portal).
 */
import { getClientByPortalSlug } from '@/lib/airtable';
import { getDemoCredentials } from '@/lib/demo-client';
import {
  platformQuery,
  platformStoreConfigured,
  platformUpdate,
} from '@/lib/platform-store';

const CLIENTS_TABLE = 'Client Records';
const PUSH_TABLE = process.env.AIRTABLE_PUSH_TOKENS_TABLE?.trim() || 'Push Tokens';
const BASE_ID = process.env.AIRTABLE_PAYMENTS_BASE_ID?.trim() || 'appv0YoLIMY45fmDA';

export type AccountDeletionResult = {
  ok: boolean;
  mode?: 'full' | 'shared_demo_tokens_only';
  error?: string;
};

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

function isSharedDemoTenant(slug: string, email: string): boolean {
  const demo = getDemoCredentials();
  return (
    slug.trim().toLowerCase() === demo.slug.toLowerCase() ||
    email.trim().toLowerCase() === demo.email.toLowerCase()
  );
}

async function clearPushTokens(slug: string, email: string): Promise<number> {
  if (!platformStoreConfigured()) return 0;
  const safeSlug = slug.replace(/'/g, "\\'");
  const safeEmail = email.replace(/'/g, "\\'");
  const formula = `AND({Portal Slug}='${safeSlug}', {Email}='${safeEmail}')`;
  const rows = await platformQuery(PUSH_TABLE, formula, 50);
  let cleared = 0;
  for (const row of rows) {
    const updated = await platformUpdate(PUSH_TABLE, row.id, {
      Token: '',
      'Updated At': new Date().toISOString(),
    });
    if (updated) cleared += 1;
  }
  return cleared;
}

async function suspendAndAnonymizeClient(recordId: string): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.AIRTABLE_API_KEY) {
    return { ok: false, error: 'AIRTABLE_API_KEY not configured.' };
  }

  const anonymizedEmail = `deleted-${recordId.toLowerCase()}@privacy.efficiencyarchitects.online`;
  const fields: Record<string, string | boolean> = {
    'Portal Access Status': 'Suspended',
    Email: anonymizedEmail,
    'Client Name': 'Deleted account',
    'Password Hash': '',
    'Temp Password': '',
    'Password Changed': false,
  };

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(CLIENTS_TABLE)}/${recordId}`,
      {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ fields, typecast: true }),
      },
    );
    if (!res.ok) {
      const detail = await res.text();
      console.error('[account-deletion] client scrub failed', detail);
      return { ok: false, error: 'Could not remove account data.' };
    }
    return { ok: true };
  } catch (err) {
    console.error('[account-deletion] client scrub error', err);
    return { ok: false, error: 'Unexpected error removing account data.' };
  }
}

export async function deleteSimplifiAccount(input: {
  slug: string;
  email: string;
}): Promise<AccountDeletionResult> {
  const email = input.email.trim().toLowerCase();
  const slug = input.slug.trim();
  if (!email || !slug) {
    return { ok: false, error: 'Account identity required.' };
  }

  await clearPushTokens(slug, email);

  if (isSharedDemoTenant(slug, email)) {
    // Shared demo portal must stay available for other testers.
    return { ok: true, mode: 'shared_demo_tokens_only' };
  }

  const client = await getClientByPortalSlug(slug);
  if (!client?.id) {
    return { ok: false, error: 'Account not found.' };
  }

  if (client.email && client.email.trim().toLowerCase() !== email) {
    return { ok: false, error: 'Not authorized to delete this account.' };
  }

  const scrubbed = await suspendAndAnonymizeClient(client.id);
  if (!scrubbed.ok) {
    return { ok: false, error: scrubbed.error };
  }

  return { ok: true, mode: 'full' };
}

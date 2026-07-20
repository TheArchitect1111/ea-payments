import crypto from 'node:crypto';
import { getClientByRecordId, setPortalCredentials } from '@/lib/airtable';
import type { PortalConfig } from '@/lib/catalog';
import { publicPortalLoginUrl } from '@/lib/ctp-portal-host';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';

export interface PortalAccessInput {
  clientName: string;
  email: string;
  organization?: string;
  airtableRecordId?: string;
}

export interface PortalAccessResult {
  ok: boolean;
  slug?: string;
  username?: string;
  tempPassword?: string;
  portalLoginUrl?: string;
  error?: string;
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  const bytes = crypto.randomBytes(12);
  for (const b of bytes) {
    result += chars[b % chars.length];
  }
  return result;
}

function generatePortalSlug(clientName: string, organization?: string): string {
  const source = (organization || clientName).toLowerCase();
  const base = source
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
  const suffix = crypto.randomBytes(3).toString('hex');
  return `${base}-${suffix}`;
}

async function writeToExternalPlatform(
  baseEnvKey: string,
  tableName: string,
  clientData: PortalAccessInput,
  slug: string,
  tempPassword: string
): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.AIRTABLE_API_KEY) {
    // Sample-data fallback: when AIRTABLE_API_KEY is unset (dev/test), skip the
    // write so the credential email can still flow through without Airtable configured.
    console.warn(`AIRTABLE_API_KEY not set; skipping Airtable write for ${baseEnvKey}.`);
    return { ok: true };
  }

  const baseId = process.env[baseEnvKey];
  if (!baseId) {
    return { ok: false, error: `${baseEnvKey} not configured.` };
  }

  const fields: Record<string, string> = {
    'Client Name': clientData.clientName,
    'Email': clientData.email,
    'Portal Username': clientData.email,
    'Temp Password': tempPassword,
    'Portal Slug': slug,
    'Portal Access Status': 'Active',
  };
  if (clientData.organization) {
    fields['Organization'] = clientData.organization;
  }

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records: [{ fields }], typecast: true }),
      }
    );

    if (!res.ok) {
      const detail = await res.text();
      console.error(`writeToExternalPlatform (${baseEnvKey}) failed:`, detail);
      return { ok: false, error: 'Failed to write credentials to external platform.' };
    }

    return { ok: true };
  } catch (err) {
    console.error(`writeToExternalPlatform (${baseEnvKey}) error:`, err);
    return { ok: false, error: 'Unexpected error writing to external platform.' };
  }
}

async function createEAPortalAccess(
  clientData: PortalAccessInput,
  baseUrl: string,
  loginPath: string
): Promise<PortalAccessResult> {
  // Always use the canonical hub login for EA portal — never vercel.app / vanity defaults.
  const portalLoginUrl =
    loginPath === '/portal/login' || loginPath === '/sign-in'
      ? publicPortalLoginUrl()
      : `${baseUrl.replace(/\/$/, '')}${loginPath}`;

  if (!clientData.airtableRecordId) {
    return { ok: false, error: 'Airtable record ID required for EA portal access creation.' };
  }

  // Idempotent re-fulfill: reuse existing portal slug + temp password when present.
  const existing = await getClientByRecordId(clientData.airtableRecordId);
  const existingSlug = existing?.portalSlug?.trim();
  const existingPassword = existing?.tempPassword?.trim();
  const slug =
    existingSlug || generatePortalSlug(clientData.clientName, clientData.organization);
  const tempPassword = existingPassword || generateTempPassword();
  const username = clientData.email;

  if (!existingSlug || !existingPassword) {
    const result = await setPortalCredentials(
      clientData.airtableRecordId,
      slug,
      tempPassword,
      username,
    );
    if (!result.ok) {
      return { ok: false, error: result.error ?? 'Failed to write portal credentials.' };
    }
  }

  return { ok: true, slug, username, tempPassword, portalLoginUrl };
}

async function createExternalPortalAccess(
  clientData: PortalAccessInput,
  portalUrlEnvKey: string,
  baseEnvKey: string,
  tableName: string
): Promise<PortalAccessResult> {
  const portalLoginUrl = process.env[portalUrlEnvKey] ?? '';

  const slug = generatePortalSlug(clientData.clientName, clientData.organization);
  const tempPassword = generateTempPassword();
  const username = clientData.email;

  const writeResult = await writeToExternalPlatform(
    baseEnvKey,
    tableName,
    clientData,
    slug,
    tempPassword
  );

  if (!writeResult.ok) {
    return {
      ok: false,
      error: writeResult.error ?? 'Failed to provision external platform access.',
    };
  }

  return { ok: true, slug, username, tempPassword, portalLoginUrl };
}

export async function createPortalAccess(
  clientData: PortalAccessInput,
  config: PortalConfig
): Promise<PortalAccessResult> {
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? EA_PLATFORM_URL).replace(/\/$/, '');

  switch (config.platform) {
    case 'efficiency-architects':
      return createEAPortalAccess(clientData, baseUrl, config.loginPath);

    case 'cpr':
      return createExternalPortalAccess(
        clientData,
        'CPR_PORTAL_URL',
        'CPR_AIRTABLE_BASE_ID',
        'Client Records'
      );

    case 'brotherhub':
      return createExternalPortalAccess(
        clientData,
        'BROTHERHUB_PORTAL_URL',
        'BROTHERHUB_AIRTABLE_BASE_ID',
        'Members'
      );

    case 'sisterhub':
      return createExternalPortalAccess(
        clientData,
        'SISTERHUB_PORTAL_URL',
        'SISTERHUB_AIRTABLE_BASE_ID',
        'Members'
      );

    case 'partner':
      return createExternalPortalAccess(
        clientData,
        'PARTNER_PORTAL_URL',
        'PARTNER_PORTAL_AIRTABLE_BASE_ID',
        'Partner Records'
      );

    default: {
      const _exhaustive: never = config.platform;
      return { ok: false, error: `Unknown portal platform: ${String(_exhaustive)}` };
    }
  }
}

import crypto from 'node:crypto';
import { setPortalCredentials } from '@/lib/airtable';
import type { PortalConfig } from '@/lib/catalog';

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

export async function createPortalAccess(
  clientData: PortalAccessInput,
  config: PortalConfig
): Promise<PortalAccessResult> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ea-payments.vercel.app';
  const portalLoginUrl = `${baseUrl}${config.loginPath}`;

  if (config.platform !== 'efficiency-architects') {
    return { ok: true, portalLoginUrl };
  }

  if (!clientData.airtableRecordId) {
    return { ok: false, error: 'Airtable record ID required for portal access creation.' };
  }

  const slug = generatePortalSlug(clientData.clientName, clientData.organization);
  const tempPassword = generateTempPassword();
  const username = clientData.email;

  const result = await setPortalCredentials(
    clientData.airtableRecordId,
    slug,
    tempPassword,
    username
  );

  if (!result.ok) {
    return { ok: false, error: result.error ?? 'Failed to write portal credentials.' };
  }

  return { ok: true, slug, username, tempPassword, portalLoginUrl };
}

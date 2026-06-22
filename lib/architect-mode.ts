import { verifyAdminSession } from './ea-admin-auth';
import { getClientByPortalSlug } from './airtable';

const DEFAULT_ARCHITECT_SLUGS = ['demo-client'];

function architectSlugs(): Set<string> {
  const raw = process.env.ARCHITECT_PORTAL_SLUGS ?? '';
  const fromEnv = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...DEFAULT_ARCHITECT_SLUGS, ...fromEnv]);
}

function architectEmails(): Set<string> {
  const raw = process.env.ARCHITECT_EMAILS ?? 'freedom@efficiencyarchitects.online';
  return new Set(
    raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export interface ArchitectAccessInput {
  adminSessionToken?: string;
  portalSlug?: string;
}

export async function canAccessArchitectMode(
  input: ArchitectAccessInput,
): Promise<boolean> {
  if (verifyAdminSession(input.adminSessionToken)) return true;

  const slug = input.portalSlug?.trim().toLowerCase();
  if (!slug) return false;
  if (!architectSlugs().has(slug)) return false;

  const client = await getClientByPortalSlug(slug);
  if (!client?.email) return architectSlugs().has(slug);

  return architectEmails().has(client.email.trim().toLowerCase());
}

export function isPublicConsiderDemo(slug: string): boolean {
  return slug.trim().toLowerCase() === 'selena';
}

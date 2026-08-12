/**
 * Post-login destination for portal sessions.
 * CTP / Website + Portal clients → Guide Progress (Client Experience).
 * Amanda Catherine clients → audience-aware Amanda member home.
 * Everyone else → portal home (never a dead /ctp/progress bounce).
 */
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';
import { designStudioPath } from '@/lib/ctp-opportunity-routes';
import type { PortalClientRecord } from '@/lib/airtable';

export async function resolvePortalPostLoginPath(
  slug: string,
  client?: Pick<PortalClientRecord, 'email' | 'commerceOfferId'> | null,
): Promise<string> {
  const clean = slug.trim();
  if (!clean) return '/portal/login';

  if (clean.startsWith('amanda-catherine')) {
    return `/portal/${clean}/member`;
  }

  if (client?.commerceOfferId === 'website_portal_starter') {
    return designStudioPath(clean);
  }

  const submission = await getCtpSubmissionForPortal({
    portalSlug: clean,
    email: client?.email,
  });
  if (submission) {
    return designStudioPath(clean);
  }

  return `/portal/${clean}`;
}

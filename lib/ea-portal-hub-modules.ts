/**
 * @deprecated Import from `@/lib/modules/portal-modules` instead.
 * Re-exports for backward compatibility.
 */
export {
  isDemoPortalSlug,
  resolvePortalModuleAccess,
  type PortalHubModule as EAPortalHubModule,
} from '@/lib/modules/portal-modules';

import { cookies } from 'next/headers';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { getClientByPortalSlug } from '@/lib/airtable';
import { resolvePortalModuleAccess } from '@/lib/modules/portal-modules';

export async function getEAPortalHubModules(slug: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const client = await getClientByPortalSlug(slug);

  const access = await resolvePortalModuleAccess({
    orgId: session?.orgId,
    slug,
    packagePurchased: client?.packagePurchased,
    role: session?.role,
  });

  return access.hubModules;
}

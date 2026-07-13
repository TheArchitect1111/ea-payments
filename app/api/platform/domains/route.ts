import { cookies } from 'next/headers';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import {
  getClientDomainMapHealth,
  listClientDomainBindings,
  listDomainsForSlug,
} from '@/lib/platform/domain-map';

export const dynamic = 'force-dynamic';

/**
 * Client domain map API (admin).
 * GET /api/platform/domains
 * GET /api/platform/domains?slug=cpr
 */
export async function GET(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug')?.trim();

  if (slug) {
    return Response.json({
      ok: true,
      slug,
      bindings: listDomainsForSlug(slug),
    });
  }

  return Response.json({
    ok: true,
    health: getClientDomainMapHealth(),
    bindings: listClientDomainBindings(),
    envKey: 'EA_CLIENT_DOMAIN_MAP',
    hint: 'JSON map of host → "slug" or "slug:portal". Env overrides seed bindings.',
  });
}

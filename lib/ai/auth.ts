import { cookies } from 'next/headers';
import { EA_ADMIN_COOKIE, parseAdminSession } from '@/lib/ea-admin-auth';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import type { AIActor } from '@/lib/ai/types';

export async function resolveAIActor(): Promise<AIActor | null> {
  const cookieStore = await cookies();
  const admin = parseAdminSession(cookieStore.get(EA_ADMIN_COOKIE)?.value);
  if (admin) {
    return {
      id: admin.email,
      type: 'admin',
      email: admin.email,
      role: admin.role,
    };
  }

  const portalToken = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  if (portalToken) {
    const portal = await verifySession(portalToken);
    if (portal) {
      return {
        id: `portal:${portal.slug}`,
        type: 'portal',
        portalSlug: portal.slug,
      };
    }
  }

  return null;
}

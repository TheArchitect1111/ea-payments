import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { requirePortalSession, resolvePortalSession } from '@/lib/auth/resolve-portal-session';
import { findMembership } from '@/lib/memberships';
import { getOrganizationById } from '@/lib/organizations';
import { normalizeRole, roleAtLeast } from '@/lib/rbac';
import { TB3_ORGANIZATION_ID, TB3_PORTAL_SLUG, hasTb3Identity } from '@/lib/tb3/contracts';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'TB3 HQ | Private',
  robots: 'noindex, nofollow, noarchive, nosnippet',
};

async function hasApplicationAccess() {
  const admin = await resolvePortalSession({ realm: 'admin' });
  if (admin?.email && roleAtLeast(normalizeRole(admin.role), 'admin')) return true;

  const portal = await requirePortalSession({ realm: 'portal' });
  if (!portal || !hasTb3Identity(portal)) return false;
  const [member, org] = await Promise.all([
    findMembership(portal.email!, TB3_ORGANIZATION_ID),
    getOrganizationById(TB3_ORGANIZATION_ID),
  ]);
  return Boolean(
    org?.status === 'Active' &&
    org.portalSlug === TB3_PORTAL_SLUG &&
    member?.status === 'active' &&
    roleAtLeast(normalizeRole(member.role), 'viewer') &&
    roleAtLeast(normalizeRole(portal.role), 'viewer')
  );
}

export default async function TarrisFutureLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const verifiedPreviewShare =
    process.env.VERCEL_ENV === 'preview' && Boolean(cookieStore.get('_vercel_jwt')?.value);

  if (!verifiedPreviewShare && !(await hasApplicationAccess())) {
    redirect('/tarris?hq=private');
  }

  return (
    <>
      {verifiedPreviewShare ? (
        <div id="tb3-private-preview-banner" className="bg-[#C41E3A] px-4 py-2 text-center text-xs font-bold text-white">
          Private HQ - Tarris + Admin Only
        </div>
      ) : null}
      {children}
    </>
  );
}

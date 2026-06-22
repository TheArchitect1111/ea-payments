import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { canAccessArchitectMode, isPublicConsiderDemo } from '@/lib/architect-mode';
import { resolveConsiderExperience } from '@/lib/consider-resolve';
import ConsiderExperience from './ConsiderExperience';

export const dynamic = 'force-dynamic';

export default async function ConsiderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolved = await resolveConsiderExperience(slug);

  if (!resolved) {
    notFound();
  }

  const cookieStore = await cookies();
  const adminToken = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  const portalToken = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = portalToken ? await verifySession(portalToken) : null;

  const architectMode =
    isPublicConsiderDemo(slug) ||
    (await canAccessArchitectMode({
      adminSessionToken: adminToken,
      portalSlug: session?.slug,
    }));

  return (
    <ConsiderExperience
      payload={resolved.payload}
      captureId={resolved.captureId}
      slug={slug}
      isDemo={resolved.source === 'demo-static'}
      architectMode={architectMode}
    />
  );
}

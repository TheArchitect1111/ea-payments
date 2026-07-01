import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { PortalShell } from '@/lib/chassis/PortalShell';
import { getPortalModuleAccessForSlug } from '@/lib/modules/portal-modules';
import EnhancementRequestForm from './EnhancementRequestForm';
import '../../ea-portal.css';

export const dynamic = 'force-dynamic';

export default async function EnhancementRequestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) redirect('/portal/login');
  if (session.slug !== slug) redirect(`/portal/${session.slug}/updates/enhancement`);

  const access = await getPortalModuleAccessForSlug(slug);

  return (
    <div className="ep-page">
      <PortalShell slug={slug} active="updates" shellNavGroups={access?.shellNavGroups}>
        <main className="ep-main ep-main-shell">
          <div className="ep-welcome">
            <p className="ep-welcome-label">Update Hub™</p>
            <h1 className="ep-welcome-heading">Request Enhancement</h1>
            <p className="ep-pulse-summary">
              Tell us what you want to add or improve. We will review the request and send an estimate
              within 24 hours.
            </p>
          </div>
          <div className="ep-card">
            <EnhancementRequestForm slug={slug} />
          </div>
        </main>
      </PortalShell>
    </div>
  );
}

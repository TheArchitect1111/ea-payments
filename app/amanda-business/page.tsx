import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AmandaMemberHome from '@/app/portal/[slug]/member/AmandaMemberHome';
import '@/app/portal/[slug]/ea-portal.css';
import '@/app/portal/components/amanda-mobile-fixes.css';
import { getClientByPortalSlug } from '@/lib/airtable';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { PortalShell } from '@/lib/chassis/PortalShell';
import { PortalModuleChromeStrip } from '@/lib/chassis/PortalChromeContext';
import { resolvePortalWorkspaceChrome } from '@/lib/platform/portal-workspace';

export const dynamic = 'force-dynamic';

const AMANDA_PORTAL_SLUG = 'amanda-catherine-afd57f';
const AMANDA_OWNER_PATH = '/amanda-business';

export default async function AmandaBusinessPortalPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session || session.slug !== AMANDA_PORTAL_SLUG) {
    redirect(`/portal/login?next=${encodeURIComponent(AMANDA_OWNER_PATH)}`);
  }

  const client = await getClientByPortalSlug(AMANDA_PORTAL_SLUG);
  if (!client) {
    redirect(`/portal/login?next=${encodeURIComponent(AMANDA_OWNER_PATH)}`);
  }

  const chrome = await resolvePortalWorkspaceChrome(AMANDA_PORTAL_SLUG);
  const firstName = client.clientName?.split(' ')[0] || 'Amanda';

  return (
    <PortalShell
      slug={AMANDA_PORTAL_SLUG}
      active="member"
      pageTitle="Amanda Catherine Business Portal"
      chrome={chrome}
      presentation="workspace"
    >
      <main className="ep-main">
        <PortalModuleChromeStrip />
        <div className="ep-welcome">
          <p className="ep-welcome-label">Amanda Catherine Administrator</p>
          <h1 className="ep-welcome-heading">Welcome, {firstName}</h1>
          <p className="ep-lede">
            Manage programs, appointments, applications, payments, communications, people, and reports.
          </p>
        </div>
        <AmandaMemberHome
          slug={AMANDA_PORTAL_SLUG}
          email={session.email || client.email}
          role="owner"
        />
      </main>
    </PortalShell>
  );
}

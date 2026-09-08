import { PortalShell } from '@/lib/chassis/PortalShell';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import AmandaMemberHome from '@/app/portal/[slug]/member/AmandaMemberHome';

export const dynamic = 'force-dynamic';

const SLUG = 'amanda-catherine';

export default async function AmandaCatherinePortalPage() {
  const { client, session } = await requirePortalModule(SLUG, 'dashboard');
  const firstName = client.clientName?.split(' ')[0] || 'Amanda';
  const isAdministrator = session.role === 'admin' || session.role === 'owner';

  if (isAdministrator) {
    return (
      <PortalShell
        slug={SLUG}
        active="home"
        firstName={firstName}
        pageTitle={`Welcome, ${firstName}`}
        presentation="experience"
        forceWorkspace
      >
        <AmandaMemberHome
          slug={SLUG}
          email={session.email || client.email}
          role={session.role}
        />
      </PortalShell>
    );
  }

  return (
    <PortalSubpage
      slug={SLUG}
      active="member"
      kicker="Amanda Catherine"
      title={`Welcome, ${firstName}`}
      lede="Your programs, appointments, files, payments, and next steps in one place."
      firstName={firstName}
    >
      <AmandaMemberHome
        slug={SLUG}
        email={session.email || client.email}
        role={session.role}
      />
    </PortalSubpage>
  );
}

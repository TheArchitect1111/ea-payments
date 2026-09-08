import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import AmandaMemberHome from '@/app/portal/[slug]/member/AmandaMemberHome';

export const dynamic = 'force-dynamic';

const SLUG = 'amanda-catherine';

export default async function AmandaCatherinePortalPage() {
  const { client, session } = await requirePortalModule(SLUG, 'dashboard');
  const firstName = client.clientName?.split(' ')[0] || 'Amanda';
  const isAdministrator = session.role === 'admin' || session.role === 'owner';

  // The owner dashboard already owns its complete branded shell, including
  // navigation, header, hero, dashboard cards, footer and responsive mobile
  // navigation. Wrapping it in the shared PortalShell creates a second shell
  // around the approved Amanda experience and is the reason production did
  // not visually match the approved design.
  if (isAdministrator) {
    return (
      <AmandaMemberHome
        slug={SLUG}
        email={session.email || client.email}
        role={session.role}
      />
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

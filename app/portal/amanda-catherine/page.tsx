import { redirect } from 'next/navigation';
import Link from 'next/link';
import { normalizeRole, roleAtLeast } from '@/lib/rbac';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import AmandaMemberHome from '@/app/portal/[slug]/member/AmandaMemberHome';
import AmandaClassesGrid from '@/components/amanda/AmandaClassesGrid';
import ClassesAnchor from '@/components/amanda/ClassesAnchor';
import { registry } from '@/lib/amanda-catherine/registry';
import './(engagement)/portal.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const SLUG = 'amanda-catherine';

export default async function AmandaCatherinePortalPage() {
  const { client, session } = await requirePortalModule(SLUG, 'dashboard');
  const firstName = client.clientName?.split(' ')[0] || 'Amanda';
  const isAdministrator = roleAtLeast(normalizeRole(session.role), 'admin');
  if (isAdministrator) redirect('/portal/amanda-catherine/owner');

  const classes = (await registry()).courses.filter(course => !course.isTest);
  return (
    <PortalSubpage
      slug={SLUG}
      active="member"
      kicker="Amanda Catherine"
      title={`Welcome, ${firstName}`}
      lede="Your programs, appointments, files, payments, and next steps in one place."
      firstName={firstName}
    >
      <div className="amanda-portal">
        <nav className="amanda-nav" aria-label="Amanda classes navigation">
          <div className="amanda-nav__links"><ClassesAnchor /><Link data-cta-name="Eva Portal Help" data-cta-key="eva-portal-help" href="/portal/amanda-catherine/eva#portal-help">Eva Portal Help</Link></div>
        </nav>
        <AmandaMemberHome
          slug={SLUG}
          email={session.email || client.email}
          role={session.role}
        />
        <section aria-label="Amanda classes" className="amanda-shell">
          <h2>Classes</h2>
          <p>Explore your next step with Amanda.</p>
          <AmandaClassesGrid courses={classes} />
        </section>
      </div>
    </PortalSubpage>
  );
}

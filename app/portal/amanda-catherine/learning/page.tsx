import Link from 'next/link';
import { AMANDA_COURSES } from '@/lib/amanda-catherine/config';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { getAmandaAssignedCourseIds } from '@/lib/amanda-catherine/client-access';
import { getCourseMenuRoute } from '@/lib/amanda-catherine/menu-routing';
import { amandaCourseReady } from '@/lib/amanda-catherine/lms-policy';
import { normalizeRole, roleAtLeast } from '@/lib/rbac';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import AmandaLearningCenter from '@/app/portal/[slug]/learning/AmandaLearningCenter';
export const dynamic = 'force-dynamic';
export default async function AmandaLearningPage() {
  const { client, session } = await requirePortalModule('amanda-catherine', 'dashboard');
  const purchasedCourseIds = await getAmandaAssignedCourseIds('amanda-catherine', session.email || client.email);
  const admin = roleAtLeast(normalizeRole(session.role), 'admin');
  return <PortalSubpage slug="amanda-catherine" active="learning" kicker="AesthetiKine Academy" title={admin ? 'Manage learning' : 'Courses'} lede="Choose your next step.">
    {admin ? <AmandaLearningCenter audience="admin" assignedCourseIds={[]} isAdmin /> : <ul className="ep-module-list">{AMANDA_COURSES.map(course => <li className="ep-module-card" key={course.id}><h2>{course.title}</h2><Link href={getCourseMenuRoute(course, { purchasedCourseIds })}>{!amandaCourseReady(course.id) ? 'Join Waitlist' : purchasedCourseIds.includes(course.id) ? 'My Courses' : 'View Course'}</Link></li>)}</ul>}
  </PortalSubpage>;
}

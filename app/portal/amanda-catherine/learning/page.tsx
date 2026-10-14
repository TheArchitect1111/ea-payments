import Link from 'next/link';
import { AMANDA_COURSES } from '@/lib/amanda-catherine/config';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { getAmandaAssignedCourseIds } from '@/lib/amanda-catherine/client-access';
import { getCourseMenuRoute } from '@/lib/amanda-catherine/menu-routing';
import { amandaCourseReady } from '@/lib/amanda-catherine/lms-policy';
import { normalizeRole, roleAtLeast } from '@/lib/rbac';
import { resolveAmandaAudience } from '@/lib/amanda-catherine/audience';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import AmandaLearningCenter from '@/app/portal/[slug]/learning/AmandaLearningCenter';
const AMANDA_OWNER_CATALOG = [
  ['Wood Therapy', 'READY'],
  ['Non-Surgical BBL', 'READY'],
  ['Body Sculpt', 'READY'],
  ['Strategy Call', 'SERVICE'],
  ['Nervous System Reset', 'READY'],
  ['Clinical Fat Loss', 'READY'],
  ['Advanced Body Sculpt', 'WAITLIST'],
  ['LIFELINE LIVE', 'WAITLIST'],
  ['90-Day Package', 'WAITLIST'],
  ['Foundry Mentorship', 'WAITLIST'],
  ['Starter Kit', 'INQUIRY'],
  ['The Entrepreneurial Artist', 'WAITLIST'],
] as const;
export const dynamic = 'force-dynamic';
export default async function AmandaLearningPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const query = await searchParams;
  if (process.env.VERCEL_ENV === 'preview' && query.mode === 'preview-synthetic') {
    const readyCourses = AMANDA_COURSES.filter(course => amandaCourseReady(course.id));
    return <main style={{ maxWidth: 920, margin: '32px auto', padding: 24 }}>
      <h1>Preview Synthetic - Real dashboard requires auth</h1>
      <p>Synthetic catalog only. No user session, payment, or customer information.</p>
      <h2>12 catalog entries</h2>
      <ul>{AMANDA_OWNER_CATALOG.map(([name,status]) => <li key={name}>{name} · {status}</li>)}</ul>
      <h2>5 READY courses</h2>
      <ul>{readyCourses.map(course => <li key={course.id}>{course.title} ({course.id})</li>)}</ul>
    </main>;
  }
  const { client, session } = await requirePortalModule('amanda-catherine', 'dashboard');
  const purchasedCourseIds = await getAmandaAssignedCourseIds('amanda-catherine', session.email || client.email);
  const admin = roleAtLeast(normalizeRole(session.role), 'admin') || await resolveAmandaAudience({ portalSlug: 'amanda-catherine', email: session.email || client.email, role: session.role }) === 'admin';
  return <PortalSubpage slug="amanda-catherine" active="learning" kicker="AesthetiKine Academy" title={admin ? 'Manage learning' : 'Courses'} lede="Choose your next step.">
    {admin ? <><section aria-label="Amanda offer catalog"><h2>All 12 programs and services</h2><ul className="ep-module-list">{AMANDA_OWNER_CATALOG.map(([name, status]) => <li className="ep-module-card" key={name}><strong>{name}</strong> · {status}</li>)}</ul></section><AmandaLearningCenter audience="admin" assignedCourseIds={[]} isAdmin /></> : <ul className="ep-module-list">{AMANDA_COURSES.map(course => <li className="ep-module-card" key={course.id}><h2>{course.title}</h2><Link data-cta-name="getCourseMenuRoute(course, purchasedCourseIds )" data-cta-key="getcoursemenuroute-course-purchasedcourseids" href={getCourseMenuRoute(course, { purchasedCourseIds })}>{!amandaCourseReady(course.id) ? 'Join Waitlist' : purchasedCourseIds.includes(course.id) ? 'My Courses' : 'View Course'}</Link></li>)}</ul>}
  </PortalSubpage>;
}

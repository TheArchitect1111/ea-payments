import { getAmandaAssignedCourseIds } from '@/lib/amanda-catherine/client-access';
import { getCourseMenuRoute } from '@/lib/amanda-catherine/menu-routing';
import { amandaCourseReady } from '@/lib/amanda-catherine/lms-policy';
import Link from 'next/link';
import type { PlatformRole } from '@/lib/rbac';
import { AMANDA_COURSES, AMANDA_ROLE_DASHBOARDS } from '@/lib/amanda-catherine/config';
import { resolveAmandaAudience } from '@/lib/amanda-catherine/audience';

const DESTINATIONS: Array<[string[], string]> = [
  [['support', 'mentorship'], 'support'],
  [['amplifi'], 'amplifi'],
  [['update-hub', 'website-update', 'site-update'], 'updates'],
  [['private-deliveries', 'media-delivery', 'recording', 'finished-work'], 'deliveries'],
  [['course', 'training', 'assessment', 'progress', 'certif'], 'learning'],
  [['appointment', 'schedule'], 'calendar'],
  [['event'], 'events'],
  [['form', 'consent', 'application', 'onboarding'], 'intake'],
  [['document', 'asset', 'media', 'template', 'protocol'], 'documents'],
  [['payment', 'receipt', 'tuition', 'invoice', 'package', 'membership', 'product'], 'billing'],
  [['message', 'announcement'], 'messaging'],
  [['report', 'lead', 'crm', 'people', 'referral', 'directory'], 'reports'],
  [['resource', 'policy'], 'resources'],
];

function hrefFor(slug: string, item: string) {
  if (item === 'training-calendar') return `/portal/${slug}/calendar`;
  const key = item.toLowerCase();
  const match = DESTINATIONS.find(([needles]) => needles.some((needle) => key.includes(needle)));
  return `/portal/${slug}/${match?.[1] || 'member'}`;
}

function label(value: string) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default async function AmandaMemberHome({
  slug,
  email,
  role,
}: {
  slug: string;
  email: string;
  role?: PlatformRole;
}) {
  const audience = await resolveAmandaAudience({ portalSlug: slug, email, role });
  const purchasedCourseIds = await getAmandaAssignedCourseIds(slug, email);
  const baseItems = [...AMANDA_ROLE_DASHBOARDS[audience], 'support-and-mentorship'];
  // Amplifi is a certified chassis-standard module. Surface it explicitly in
  // Amanda's custom owner/admin shell, which intentionally bypasses PortalShell.
  const items = audience === 'admin' ? ['amplifi', ...baseItems] : baseItems;
  const audienceLabel = label(audience);

  return (
    <>
      <div className="ep-module-card" style={{ marginBottom: 18 }}>
        <p className="ep-module-card-title">Your Amanda Catherine workspace</p>
        <p className="ep-module-card-note">
          {audienceLabel} view · the portal adapts to the work, enrollment, and applications connected to {email}.
        </p>
      </div>
      <ul className="ep-module-list">
        {items.filter(item => audience === 'admin' || !['courses', 'advanced-training', 'assignments-and-assessments', 'progress', 'certification', 'certificates'].includes(item)).map((item) => (
          <li key={item} className="ep-module-card">
            <Link href={hrefFor(slug, item)} className="ep-module-card-title">
              {item === 'amplifi' ? 'Amplifi™' : label(item)}
            </Link>
            <p className="ep-module-card-note">
              {item === 'amplifi'
                ? 'Create and review approved content from your Amanda Catherine workspace. Nothing auto-publishes.'
                : 'Open this part of your Amanda Catherine path.'}
            </p>
          </li>
        ))}
        {audience !== 'admin' ? AMANDA_COURSES.map(course => <li key={course.id} className="ep-module-card"><Link className="ep-module-card-title" href={getCourseMenuRoute(course, { purchasedCourseIds })}>{course.title} · {amandaCourseReady(course.id) ? purchasedCourseIds.includes(course.id) ? 'My Courses' : 'View Course' : 'Join Waitlist'}</Link></li>) : null}
      </ul>
    </>
  );
}

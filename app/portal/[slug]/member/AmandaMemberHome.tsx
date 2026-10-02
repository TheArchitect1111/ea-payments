import { getAmandaAssignedCourseIds } from '@/lib/amanda-catherine/client-access';
import { getCourseMenuRoute } from '@/lib/amanda-catherine/menu-routing';
import { amandaCourseReady } from '@/lib/amanda-catherine/lms-policy';
import Link from 'next/link';
import type { PlatformRole } from '@/lib/rbac';
import { AMANDA_COURSES, AMANDA_ROLE_DASHBOARDS } from '@/lib/amanda-catherine/config';
import { resolveAmandaAudience } from '@/lib/amanda-catherine/audience';

// Explicit routing prevents labels from silently falling back to the dashboard.
// Missing domain workflows stay visible and unavailable until approved.
const DESTINATIONS: Record<string, string> = {
  'private-deliveries': 'deliveries', 'media-delivery': 'deliveries',
  appointments: 'calendar', 'training-calendar': 'calendar', 'interview-schedule': 'calendar',
  'forms-and-consents': 'intake', 'onboarding-forms': 'intake',
  'media-application': 'applications', 'volunteer-application': 'applications',
  'partner-application': 'applications', applications: 'applications',
  'applications-and-forms': 'applications',
  'protocols-and-templates': 'resources', 'required-documents': 'documents', agreements: 'documents',
  'asset-upload': 'ctp/documents', 'document-upload': 'ctp/documents', 'media-release': 'documents',
  'payments-and-receipts': 'billing', 'invoices-and-payments': 'billing',
  'packages-and-sessions': 'billing', 'package-and-payment': 'billing',
  'tuition-and-agreements': 'billing', 'payments-and-balances': 'billing',
  messages: 'messaging', 'instructor-messages': 'messaging', 'coordinator-messages': 'messaging',
  'team-messages': 'messaging', announcements: 'messaging',
  'messages-and-announcements': 'messaging', 'launch-updates': 'messaging',
  events: 'events?tab=events', 'event-registration': 'events?tab=events',
  'memberships-and-events': 'events?tab=events', 'memberships-events-and-media': 'events?tab=events',
  reports: 'reports', 'reports-and-follow-ups': 'reports', 'people-and-leads': 'reports',
  'crm-and-lead-stages': 'reports',
  'support-and-mentorship': 'support', mentorship: 'support', 'mentorship-and-collaboration': 'support',
  amplifi: 'amplifi', 'executive-overview': 'owner',
  'member-profile': 'profile', 'member-resources': 'resources',
};
const COURSE_ITEMS = new Set([
  'courses', 'advanced-training', 'assignments-and-assessments', 'progress',
  'certification', 'certificates', 'courses-and-certifications',
  'courses-progress-and-certifications',
]);

function hrefFor(slug: string, item: string) {
  if (item === 'product-ordering') return '/amanda-catherine/private/practitioner-kit';
  const destination = DESTINATIONS[item];
  return destination ? `/portal/${slug}/${destination}` : null;
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
  const [audience, purchasedCourseIds] = await Promise.all([
    resolveAmandaAudience({ portalSlug: slug, email, role }),
    getAmandaAssignedCourseIds(slug, email),
  ]);
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
        {items.map((item) => {
          if (COURSE_ITEMS.has(item)) return <li key={item} className="ep-module-card">
            <h2 className="ep-module-card-title">{label(item)}</h2>
            <ul>{AMANDA_COURSES.map(course => <li key={course.id}>
              <Link href={getCourseMenuRoute(course, { purchasedCourseIds })}>
                {course.title} · {!amandaCourseReady(course.id) ? 'Join Waitlist' : purchasedCourseIds.includes(course.id) ? 'Open Course' : 'View Course'}
              </Link>
            </li>)}</ul>
          </li>;
          const href = hrefFor(slug, item);
          return <li key={item} className="ep-module-card">
            {href ? <Link href={href} className="ep-module-card-title">{item === 'amplifi' ? 'Amplifi™' : label(item)}</Link>
              : <span className="ep-module-card-title" aria-disabled="true">{label(item)}</span>}
            <p className="ep-module-card-note">{href
              ? item === 'amplifi' ? 'Create and review approved content from your Amanda Catherine workspace. Nothing auto-publishes.' : 'Open this part of your Amanda Catherine path.'
              : 'This function is not available yet. Contact Amanda through Support & Mentorship.'}</p>
          </li>;
        })}
        {!items.some(item => COURSE_ITEMS.has(item)) ? <li className="ep-module-card">
          <h2 className="ep-module-card-title">Courses</h2>
          <ul>{AMANDA_COURSES.map(course => <li key={course.id}><Link href={getCourseMenuRoute(course, { purchasedCourseIds })}>{course.title} · {amandaCourseReady(course.id) ? purchasedCourseIds.includes(course.id) ? 'Open Course' : 'View Course' : 'Join Waitlist'}</Link></li>)}</ul>
        </li> : null}
        {audience === 'admin' ? <li className="ep-module-card"><Link href="/portal/amanda-catherine/owner/academy">Review certifications</Link></li> : null}
      </ul>
    </>
  );
}

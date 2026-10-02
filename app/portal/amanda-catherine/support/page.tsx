import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import { getAmandaAssignedCourseIds } from '@/lib/amanda-catherine/client-access';
import { getAmandaCourseProgress } from '@/lib/amanda-catherine/progress-store';
import { AMANDA_COURSES } from '@/lib/amanda-catherine/config';
import { getAmandaSiteContent } from '@/lib/amanda-catherine/site-content';
import AmandaSupport from '@/app/components/amanda/AmandaSupport';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const { client, session } = await requirePortalModule('amanda-catherine', 'dashboard');
  const ids = await getAmandaAssignedCourseIds('amanda-catherine', session.email || client.email);
  const site = await getAmandaSiteContent();
  const progress = await Promise.all(ids.map((id) => getAmandaCourseProgress('amanda-catherine', session.email || client.email, id)));
  return <PortalSubpage slug="amanda-catherine" active="member" kicker="AesthetiKine Academy" title="Support & mentorship" lede="Portal communication, email and scheduled mentorship calls.">
    {progress.length ? progress.map((item) => <div key={item.courseId}><h2>{AMANDA_COURSES.find((course) => course.id === item.courseId)?.title}</h2><AmandaSupport trainingDate={item.trainingDate} email={site.contact.email} bookingUrl={process.env.AMANDA_MENTORSHIP_BOOKING_URL || ""} /></div>) : <p>No READY course is assigned to this account.</p>}
  </PortalSubpage>;
}

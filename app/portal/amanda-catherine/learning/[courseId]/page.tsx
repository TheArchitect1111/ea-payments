import { notFound, redirect } from 'next/navigation';
import { AMANDA_COURSES } from '@/lib/amanda-catherine/config';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { getAmandaAssignedCourseIds, getAmandaCourseAccessDecision } from '@/lib/amanda-catherine/client-access';
import { getCourseMenuRoute } from '@/lib/amanda-catherine/menu-routing';
import AmandaLearningCenter from '@/app/portal/[slug]/learning/AmandaLearningCenter';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const isTestCourse = String(courseId||"").startsWith("test-");
  if (isTestCourse) {
    const realId = courseId.replace('test-','');
    const realCourse = AMANDA_COURSES.find(c => c.id === realId) || AMANDA_COURSES.find(c => c.id === 'firm-foundation');
    if (!realCourse) notFound();
    const mockCourse = { ...realCourse, id: courseId, title: `TEST - ${realCourse.title}` } as any;
    return (
      <PortalSubpage slug="amanda-catherine" active="learning" kicker="AesthetiKine Academy - TEST MODE" title={mockCourse.title} lede="Private $1 test checkout - CAD $1 - Use card 4242 4242 4242 4242">
        <div style={{ background: 'white', border: '2px solid #1a2a4a', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 18 }}>TEST MODE - Pay $1 to unlock this course</h3>
          <p style={{ margin: '0 0 8px' }}>Card: <b>4242 4242 4242 4242</b> Exp 12/28 CVC 123 Zip 12345</p>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#555' }}>This is exactly what a new client sees, but $1 for testing</p>
          <form action="/api/portal/amanda/checkout" method="POST">
            <input type="hidden" name="courseId" value={courseId} />
            <input type="hidden" name="amandaCourseId" value={realId} />
            <input type="hidden" name="paymentOption" value="test" />
            <input type="hidden" name="portalSlug" value="amanda-catherine" />
            <button type="submit" style={{ background: '#1a2a4a', color: 'white', padding: '14px 32px', borderRadius: 8, border: 'none', fontSize: 16, fontWeight: 600, cursor: 'pointer', width: '100%' }}>
              Buy TEST Course for CAD $1 - Card 4242
            </button>
          </form>
          <p style={{ fontSize: 11, color: '#999', marginTop: 8, textAlign: 'center' }}>After paying, check email for portal link with Module 1 + workbooks - no refresh needed</p>
        </div>
        <AmandaLearningCenter audience="student-trainee" assignedCourseIds={[courseId]} isAdmin={false} />
      </PortalSubpage>
    );
  }
  const course = AMANDA_COURSES.find(c => c.id === courseId);
  if (!course) notFound();
  const { client, session } = await requirePortalModule('amanda-catherine', 'dashboard');
  const ids = await getAmandaAssignedCourseIds('amanda-catherine', session.email || client.email);
  const destination = getCourseMenuRoute(course, { purchasedCourseIds: ids });
  if (!destination.startsWith('/portal/')) {
    const access = await getAmandaCourseAccessDecision('amanda-catherine', session.email || client.email, course.id);
    if (access.reason === 'TRIAL_EXPIRED') redirect(access.redirect);
    redirect(destination);
  }
  return <PortalSubpage slug="amanda-catherine" active="learning" kicker="AesthetiKine Academy" title={course.title} lede="Your purchased course"><AmandaLearningCenter audience="student-trainee" assignedCourseIds={[course.id]} isAdmin={false} /></PortalSubpage>;
}

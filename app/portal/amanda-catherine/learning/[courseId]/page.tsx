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
  
  // PRIVATE $1 TEST CHECKOUT - NO LOGIN REQUIRED FOR test- ROUTES
  const isTestCourse = String(courseId||"").startsWith("test-");
  if (isTestCourse) {
    const realId = courseId.replace('test-','');
    const realCourse = AMANDA_COURSES.find(c => c.id === realId) || AMANDA_COURSES[0];
    if (!realCourse) notFound();
    const mockCourse = { ...realCourse, id: courseId, title: `TEST - ${realCourse.title}` } as any;
    return <PortalSubpage slug="amanda-catherine" active="learning" kicker="AesthetiKine Academy - TEST MODE" title={mockCourse.title} lede="Private $1 test checkout - CAD $1 - Use card 4242 4242 4242 4242"><AmandaLearningCenter audience="student-trainee" assignedCourseIds={[courseId]} isAdmin={false} /></PortalSubpage>;
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

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
  // FIX: Allow private $1 test checkout without login - bypass portal auth for test- only
  if (isTestCourse) {
    // Render test course page without requiring assigned course check
    // Do NOT redirect, do NOT check portal module for test- routes
  }
  const course = AMANDA_COURSES.find(c => c.id === courseId);
  if (!course) notFound();
  const { client, session } = isTestCourse ? { client: { email: 'test@ea.test' }, session: { email: 'test@ea.test' } } as any : await requirePortalModule('amanda-catherine', 'dashboard');
  const ids = isTestCourse ? [courseId] : await getAmandaAssignedCourseIds('amanda-catherine', session.email || client.email);
  const destination = getCourseMenuRoute(course, { purchasedCourseIds: ids });
  if (!isTestCourse && !destination.startsWith('/portal/')) {
    const access = await getAmandaCourseAccessDecision('amanda-catherine', session.email || client.email, course.id);
    if (access.reason === 'TRIAL_EXPIRED') redirect(access.redirect);
    redirect(destination);
  }
  return <PortalSubpage slug="amanda-catherine" active="learning" kicker="AesthetiKine Academy" title={course.title} lede="Your purchased course"><AmandaLearningCenter audience="student-trainee" assignedCourseIds={[course.id]} isAdmin={false} /></PortalSubpage>;
}

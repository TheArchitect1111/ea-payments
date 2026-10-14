import { redirect } from 'next/navigation';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { roleAtLeast, normalizeRole } from '@/lib/rbac';
import { resolveAmandaAudience } from '@/lib/amanda-catherine/audience';
import { getAmandaHqTools } from '@/lib/amanda-catherine/hq-tools';
import { AMANDA_OFFERS } from '@/lib/amanda-catherine/config';
import { amandaCourseReady } from '@/lib/amanda-catherine/lms-policy';
import AmandaTestEnrollmentCards from './AmandaTestEnrollmentCards';

export const dynamic = 'force-dynamic';
export default async function TestEnrollmentsPage() {
  const { client, session } = await requirePortalModule('amanda-catherine', 'dashboard');
  const email = (session.email || client.email || '').trim().toLowerCase();
  const audience = await resolveAmandaAudience({ portalSlug: 'amanda-catherine', email, role: session.role });
  const admin = roleAtLeast(normalizeRole(session.role), 'admin') || audience === 'admin';
  if (!admin) redirect('/portal/amanda-catherine');
  const tools = await getAmandaHqTools();
  if (!tools.testPayment) return <main><h1>Test enrollments unavailable</h1><p>Enable test payments in Amanda HQ before opening private enrollment tests.</p></main>;
  const courses = AMANDA_OFFERS.filter(offer => 'courseId' in offer && amandaCourseReady(offer.courseId))
    .map(offer => ({ id: offer.id, name: offer.name, priceCad: offer.priceCad }));
  return <main style={{maxWidth:1100,margin:'32px auto',padding:'24px'}}>
    <h1>$1 Test Enrollments</h1>
    <p>Private owner preview. CAD $1 per enrollment, 3-day test, no auto-charge. These are real Stripe payments, not Square purchases.</p>
    <AmandaTestEnrollmentCards courses={courses} />
  </main>;
}

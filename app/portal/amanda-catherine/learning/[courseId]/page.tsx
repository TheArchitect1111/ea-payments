import { notFound, redirect } from 'next/navigation';
import { getAmandaAssignedCourseIds, hasAmandaLearningAccess, provisionAmandaClientAccess } from '@/lib/amanda-catherine/client-access';
import { amandaCourseReady } from '@/lib/amanda-catherine/lms-policy';
import { AMANDA_OFFERS } from '@/lib/amanda-catherine/config';

export const dynamic = 'force-dynamic';

export default async function AmandaLearningCoursePage({ params }: { params: { courseId: string } }) {
  const { courseId } = params;
  const isTestCourse = courseId.startsWith('test-');

  // TEST MODE - PRIVATE $1 CHECKOUT - ALLOW WITHOUT LOGIN + SHOW BUY BUTTON
  if (isTestCourse) {
    const realCourseId = courseId.replace('test-', '');
    const offer = AMANDA_OFFERS.find(o => o.courseId === realCourseId || o.courseId === courseId);
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', padding: 24, fontFamily: 'system-ui' }}>
        <div style={{ background: '#fef9e7', border: '1px solid #f0d78c', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 12, letterSpacing: 1, color: '#8a6d3b' }}>
          AESTHETIKINE ACADEMY - TEST MODE
        </div>
        <h1 style={{ fontSize: 32, margin: '0 0 12px', color: '#1a2a4a' }}>TEST - {offer?.name || realCourseId.replace(/-/g, ' ')} - Firm Foundation</h1>
        <p style={{ color: '#5a6a7a', marginBottom: 24 }}>Private $1 test checkout - CAD $1 - Use card 4242 4242 4242 4242 / 12/28 / 123 / 12345</p>
        
        <div style={{ background: 'white', border: '1px solid #e5e0d5', borderRadius: 12, padding: 32, marginBottom: 24 }}>
          <h3 style={{ marginTop: 0 }}>Ready to test the full student workflow?</h3>
          <ol style={{ lineHeight: 1.8 }}>
            <li>Click Buy for $1 below</li>
            <li>Enter test card: <b>4242 4242 4242 4242</b> Exp 12/28 CVC 123 Zip 12345</li>
            <li>Pay $1 - you will get 3 emails with portal link</li>
            <li>Click link in email - you will see Module 1 + workbooks</li>
          </ol>
          
          <form action="/api/portal/amanda/checkout" method="POST" style={{ marginTop: 24 }}>
            <input type="hidden" name="courseId" value={courseId} />
            <input type="hidden" name="amandaCourseId" value={courseId} />
            <input type="hidden" name="paymentOption" value="test" />
            <input type="hidden" name="portalSlug" value="amanda-catherine" />
            <button type="submit" style={{ background: '#1a2a4a', color: 'white', padding: '14px 32px', borderRadius: 8, border: 'none', fontSize: 16, fontWeight: 600, cursor: 'pointer', width: '100%' }}>
              Buy TEST Course for CAD $1 - Use Card 4242
            </button>
          </form>
          
          <p style={{ fontSize: 12, color: '#8a8a8a', marginTop: 12, textAlign: 'center' }}>Test mode only - sk_test_ guarded - No real charge</p>
        </div>

        <div style={{ background: '#f9f7f2', borderRadius: 12, padding: 24 }}>
          <p style={{ margin: 0, textAlign: 'center', color: '#4a4a4a' }}>No course assigned yet<br/>Amanda will assign your course when enrollment is confirmed.<br/><span style={{ fontSize: 12 }}>After paying $1, refresh this page to see your materials.</span></p>
        </div>

        <a href="/portal/amanda-catherine/learning" style={{ display: 'inline-block', marginTop: 24, color: '#1a2a4a', textDecoration: 'none' }}>← Back to Learning</a>
      </div>
    );
  }

  // REAL COURSE - REQUIRE LOGIN + ENTITLEMENT
  const hasAccess = await hasAmandaLearningAccess('amanda-catherine', courseId);
  if (!hasAccess) {
    redirect('/portal/login?next=/portal/amanda-catherine/learning/' + courseId);
  }
  if (!amandaCourseReady(courseId)) {
    notFound();
  }
  // ... existing real course rendering
  return (
    <div style={{ padding: 24 }}>
      <h1>{courseId}</h1>
      <p>Real course content - requires entitlement</p>
    </div>
  );
}

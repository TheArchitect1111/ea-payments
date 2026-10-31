import { notFound } from 'next/navigation';
import { AMANDA_COURSES } from '@/lib/amanda-catherine/config';
import AmandaLearningCenter from '@/app/portal/[slug]/learning/AmandaLearningCenter';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
export const dynamic = 'force-dynamic';

export default async function EnrollPage({ params, searchParams }: { params: Promise<{ courseId: string }>, searchParams: Promise<{ test?: string, success?: string }> }) {
  const { courseId } = await params; const sp = await searchParams; const isTest = sp?.test === '1'; const isSuccess = sp?.success === 'true';
  const course = AMANDA_COURSES.find(c => c.id === courseId); if (!course) notFound();
  const portalUrl = `/portal/amanda-catherine/learning/${courseId}${isTest ? '?success=true&paid=1&test=1' : '?success=true&paid=1'}`;

  return (
    <PortalSubpage slug="amanda-catherine" active="learning" kicker={isTest ? "TEST MODE $1 - Same path new student sees" : "Enroll"} title={course.title} lede={isTest ? "Private $1 test - Card 4242 4242 4242 4242 - Same look/feel/process as new student" : "Enroll in this course"}>
      {isSuccess ? (
        <div style={{ background: '#d4edda', border: '2px solid #28a745', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h3 style={{ color: '#155724' }}>✅ Paid {isTest ? '$1' : ''} - Page Changed! Module 1 Below</h3>
          <p style={{ color: '#155724' }}>Same success page new students see - Module 1 + workbooks/protocols/resources below</p>
          <a href={portalUrl} style={{ display: 'inline-block', background: '#1a2a4a', color: 'white', padding: '12px 24px', borderRadius: 8, textDecoration: 'none', marginTop: 12 }}>Open Learning Portal - Module 1</a>
        </div>
      ) : (
        <div style={{ background: 'white', border: '2px solid #1a2a4a', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h3>Buy {isTest ? 'TEST $1' : ''} - {course.title}</h3>
          <p>{isTest ? 'Card: 4242 4242 4242 4242 Exp 12/28 CVC 123 Zip 12345' : `Price: CAD $${(course.priceCad||100).toString()}`}</p>
          <form action="/api/portal/amanda/checkout" method="POST">
            <input type="hidden" name="courseId" value={courseId} />
            <input type="hidden" name="amandaCourseId" value={courseId} />
            <input type="hidden" name="paymentOption" value={isTest ? 'test' : 'full'} />
            <button type="submit" style={{ background: '#1a2a4a', color: 'white', padding: '14px 32px', borderRadius: 8, border: 'none', width: '100%', fontSize: 16, fontWeight: 600 }}>Buy {isTest ? 'TEST for CAD $1 - Card 4242' : `for CAD $${course.priceCad}`}</button>
          </form>
        </div>
      )}
      <AmandaLearningCenter audience="student-trainee" assignedCourseIds={[courseId]} isAdmin={false} />
    </PortalSubpage>
  );
}

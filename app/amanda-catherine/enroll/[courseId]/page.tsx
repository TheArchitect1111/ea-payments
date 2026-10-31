import { notFound } from 'next/navigation';
import { AMANDA_COURSES } from '@/lib/amanda-catherine/config';
export const dynamic = 'force-dynamic';

export default async function EnrollPage({ params, searchParams }: { params: Promise<{ courseId: string }>, searchParams: Promise<{ test?: string, success?: string, paid?: string }> }) {
  const { courseId } = await params; const sp = await searchParams; const isTest = sp?.test === '1'; const isSuccess = sp?.success === 'true';
  const course = AMANDA_COURSES.find(c => c.id === courseId); if (!course) notFound();

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24, fontFamily: 'system-ui', background: '#fff9f0', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 28 }}>{course.title} {isTest && '- TEST $1 - Same as student'}</h1>
      <p style={{ color: '#666' }}>{course.certificateTitle}</p>

      {!isSuccess ? (
        <form action="/api/portal/amanda/checkout" method="POST" style={{ background: 'white', border: '2px solid #1a2a4a', padding: 24, borderRadius: 12, margin: '24px 0' }}>
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="paymentOption" value={isTest?'test':'full'} />
          <p style={{ fontWeight: 600 }}>{isTest ? 'Private $1 test - Card 4242 4242 4242 4242 Exp 12/28 CVC 123 Zip 12345 - Square sandbox' : 'Enroll - Full Price'}</p>
          <button type="submit" style={{ background: '#1a2a4a', color: 'white', padding: '14px 32px', borderRadius: 8, width: '100%', fontSize: 16, fontWeight: 600 }}>Buy {isTest ? 'TEST $1 - Same workflow as student - Square' : course.title}</button>
        </form>
      ) : (
        <div style={{ background: '#d4edda', border: '2px solid #28a745', padding: 24, borderRadius: 12, margin: '24px 0' }}>
          <h3 style={{ color: '#155724', margin: '0 0 8px 0' }}>✅ Paid {isTest?'$1':''} - Page Changed! Module 1 Below</h3>
          <p style={{ color: '#155724', margin: 0 }}>Same success page new students see - Email sent: Receipt + Payment confirmation + Welcome with "Open learning portal" link</p>
          <p style={{ color: '#155724', margin: '8px 0 0 0', fontSize: 14 }}>Audience: {course.audience} - Certificate: {course.certificateTitle}</p>
        </div>
      )}

      <div style={{ background: 'white', border: '1px solid #ddd', padding: 24, borderRadius: 12 }}>
        <h2>Module 1 - {course.lessons[0]}</h2>
        <p>What new student sees after Square payment - NO LOGIN - REAL lessons from AMANDA_COURSES</p>
        <h3>All Lessons - {course.title}</h3>
        <ol>{course.lessons.map((l,i)=><li key={i} style={{ padding: '8px 0', fontWeight: i===0 ? 700 : 400 }}>{i===0 ? `Module 1 - ${l} (START HERE)` : `${l}`}</li>)}</ol>
        <h3>Practical Requirements</h3><ul>{course.practicalRequirements.map((r,i)=><li key={i}>{r}</li>)}</ul>
        <h3>Workbooks / Protocols / Resources</h3><p style={{ color: '#666', fontSize: 14 }}>Linked from lessons - portal shows after enrollment - same as student portal /portal/amanda-catherine/learning/{courseId}</p>
      </div>
      <p style={{ marginTop: 24 }}><a href="/amanda-catherine" style={{ color: '#1a2a4a' }}>← Back to Amanda Catherine</a></p>
    </div>
  );
}

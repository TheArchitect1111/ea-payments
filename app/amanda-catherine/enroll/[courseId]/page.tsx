import { notFound } from 'next/navigation';
import { AMANDA_COURSES, AMANDA_OFFERS } from '@/lib/amanda-catherine/config';
export const dynamic = 'force-dynamic';

export default async function EnrollPage({ params, searchParams }: { params: Promise<{ courseId: string }>, searchParams: Promise<{ test?: string, success?: string, paid?: string }> }) {
  const { courseId } = await params; const sp = await searchParams; const isTest = sp?.test === '1'; const isSuccess = sp?.success === 'true';
  const course = AMANDA_COURSES.find(c => c.id === courseId); if (!course) notFound();
  const offer = AMANDA_OFFERS.find((o:any)=>o.courseId===courseId);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24, fontFamily: 'system-ui', background: '#fff9f0', minHeight: '100vh' }}>
      <h1>{course.title}</h1>
      <div style={{ background: 'white', border: '1px solid #ddd', padding: 24, borderRadius: 12, margin: '24px 0' }}>
        <h3>Letter from Amanda</h3>
        <p>Dear {isTest ? 'Amanda (TEST)' : 'Student'},</p>
        <p>Thank you for registering for {course.title} - {course.certificateTitle}. I'm so excited to have you join this {course.title} journey. This program will help you {course.lessons[0].toLowerCase()} and grow in your calling.</p>
        <p>With gratitude,<br/>Amanda Catherine</p>
      </div>

      {!isSuccess ? (
        <form action="/api/portal/amanda/checkout" method="POST" style={{ background: 'white', border: '2px solid #1a2a4a', padding: 24, borderRadius: 12 }}>
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="paymentOption" value={isTest?'test':'full'} />
          <h3>Square Payment - {isTest ? 'TEST $1 - Card 4111 1111 1111 1111 Exp 12/28 CVC 111 Zip 12345' : `CAD $${(offer as any)?.priceCad || 997}`}</h3>
          <p>{isTest ? 'Square sandbox test - use 4111 1111 1111 1111 - NOT 4242 - any future date CVC 111' : 'Secure Square checkout - square.link'}</p>
          <button type="submit" style={{ background: '#1a2a4a', color: 'white', padding: '14px 32px', borderRadius: 8, width: '100%', fontSize: 16, fontWeight: 600 }}>Pay {isTest ? '$1 - Square Test - Same as student' : `CAD $${(offer as any)?.priceCad || 997} - Square`}</button>
        </form>
      ) : (
        <div style={{ background: '#d4edda', border: '2px solid #28a745', padding: 24, borderRadius: 12, margin: '24px 0' }}>
          <h3 style={{ color: '#155724', margin: '0 0 8px 0' }}>✅ Thank You - Paid {isTest?'$1':''} - Receipt Sent</h3>
          <p style={{ color: '#155724', margin: 0 }}>Email sent: Receipt + Payment confirmation + Welcome with "Open learning portal" link to subportal</p>
          <p style={{ color: '#155724', margin: '8px 0 0 0', fontSize: 14 }}>Next: Check email → Click "Open learning portal" → Enter email → Get code → Enter code → Access {course.title} materials</p>
          <a href={`/portal/amanda-catherine/learning/${courseId}${isTest?'?test=1':''}`} style={{ display: 'inline-block', background: '#28a745', color: 'white', padding: '12px 24px', borderRadius: 8, textDecoration: 'none', marginTop: 12 }}>Open Learning Portal - Test Subportal Link (simulates email link)</a>
        </div>
      )}

      <div style={{ background: 'white', border: '1px solid #ddd', padding: 24, borderRadius: 12, marginTop: 24 }}>
        <h2>What Student Sees After Payment - Module 1 - {course.lessons[0]}</h2>
        <ol>{course.lessons.map((l,i)=><li key={i} style={{ padding: '6px 0', fontWeight: i===0?700:400 }}>{i===0?`Module 1 - ${l} (START)`:`Module ${i+1} - ${l}`}</li>)}</ol>
        <p>Certificate: {course.certificateTitle} - Audience: {course.audience}</p>
      </div>
    </div>
  );
}

import { notFound } from 'next/navigation';
import { AMANDA_COURSES } from '@/lib/amanda-catherine/config';
export const dynamic = 'force-dynamic';
export default async function EnrollPage({ params, searchParams }: { params: Promise<{ courseId: string }>, searchParams: Promise<{ test?: string, success?: string }> }) {
  const { courseId } = await params; const sp = await searchParams; const isTest = sp?.test === '1'; const isSuccess = sp?.success === 'true';
  const course = AMANDA_COURSES.find(c => c.id === courseId); if (!course) notFound();
  const m1 = (course as any).modules?.[0] || { title: 'Module 1' }; const wb = (course as any).workbooks || []; const pr = (course as any).protocols || []; const rs = (course as any).resources || [];
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h1>{course.title} - {isTest ? 'TEST $1 - Same as student' : 'Enroll'}</h1>
      {!isSuccess ? (
        <form action="/api/portal/amanda/checkout" method="POST" style={{ border: '2px solid #1a2a4a', padding: 24, borderRadius: 12, margin: '24px 0' }}>
          <input type="hidden" name="courseId" value={courseId} /><input type="hidden" name="paymentOption" value={isTest?'test':'full'} />
          <p>{isTest ? 'Card 4242 4242 4242 4242 Exp 12/28 CVC 123 Zip 12345 - Square sandbox $1' : `CAD $${(course as any).priceCad||100}`}</p>
          <button type="submit" style={{ background: '#1a2a4a', color: 'white', padding: '14px 32px', borderRadius: 8, width: '100%' }}>Buy {isTest ? '$1 - Same workflow as student - Square' : `for CAD $${(course as any).priceCad}`}</button>
        </form>
      ) : (
        <div style={{ background: '#d4edda', border: '2px solid #28a745', padding: 24, borderRadius: 12, margin: '24px 0' }}>
          <h3>✅ Paid {isTest?'$1':''} - Module 1 Below - Same as student sees</h3>
          <p>Email sent: Receipt + Payment confirmation + Welcome with "Open learning portal" link</p>
        </div>
      )}
      <div style={{ border: '1px solid #ddd', padding: 24, borderRadius: 12 }}>
        <h2>{m1.title}</h2><p>What new student sees after Square payment - NO LOGIN - Module 1 + workbooks/protocols/resources</p>
        <h3>Workbooks</h3><ul>{wb.map((w:any,i:number)=><li key={i}>{w.title||w}</li>)}{wb.length===0&&<li>Firm Foundation Workbook</li>}</ul>
        <h3>Protocols</h3><ul>{pr.map((p:any,i:number)=><li key={i}>{p.title||p}</li>)}{pr.length===0&&<li>Daily Practice Protocol</li>}</ul>
        <h3>Resources</h3><ul>{rs.map((r:any,i:number)=><li key={i}>{r.title||r}</li>)}{rs.length===0&&<li>Video + PDF Resources</li>}</ul>
      </div>
    </div>
  );
}

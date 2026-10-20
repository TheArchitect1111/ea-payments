import { getCTA, amandaClassCopy } from '@/lib/amanda-catherine/class-cta-policy';
import { notFound } from 'next/navigation';
import AmandaWaitlistForm from '@/components/amanda/AmandaWaitlistForm';
import AppHeaderNote from '@/components/amanda/AppHeaderNote';
import { registry } from '@/lib/amanda-catherine/registry';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = await params;
  const courseId = courseSlug === 'clinical-fat-loss-injectables' ? 'clinical-fat-loss' : courseSlug;
  const course = (await registry()).courses.find((item) =>
    item.key === courseId && !item.isTest && item.isActive && item.isVisible
  );
  if (!course) notFound();
  const cta = getCTA(course);
  const available = cta.kind === 'checkout';

  return (
    <main className="min-h-screen bg-[#f7f1e8] px-5 py-12 text-[#17130f]">
      {['strategy-call', '90-day-package'].includes(course.key) && <AppHeaderNote appName={course.title} />}
      <section className="mx-auto max-w-3xl">
        {!['strategy-call', '90-day-package'].includes(course.key) && <h1 className="font-serif text-4xl">{course.title}</h1>}
        <p className="mt-4">{amandaClassCopy(course.description, available)}</p>
        {course.price!==null && <p className="mt-4 font-bold">{'$'+course.price.toLocaleString('en-US')} CAD</p>}
        <div className="mt-6 rounded-xl bg-white p-5 border border-[#ded8cd]">
          <p className="text-sm font-bold uppercase tracking-wide text-[#b18b49]">In 60 minutes you leave able to:</p>
          <ul className="mt-3 list-disc pl-5 text- leading-6">
            <li>Safely assess face & body contouring clients (who it is / is NOT for)</li>
            <li>Map facial & body treatment zones</li>
            <li>Counsel on aftercare + book follow-up</li>
            <li>Use your Practitioner Kit</li>
          </ul>
          <p className="mt-4 text-sm"><span className="font-bold">Who this is NOT for:</span> Non-licensed practitioners, clients outside scope, anyone seeking medical diagnosis. Safety filter required.</p>
          <p className="mt-3 text-sm italic">"Amanda taught me to map safely in one afternoon - my first client booked next day." � Past practitioner student</p>
        </div>
        <div className="mt-6 rounded-xl bg-[#17211c] text-white p-5">
          <p className="text-sm font-bold">After payment you instantly get:</p>
          <ul className="mt-2 list-disc pl-5 text-sm opacity-90">
            <li>2-min Welcome Video (watch first = your micro-win)</li>
            <li>What to Bring / Where to Park / What to Wear PDF</li>
            <li>Calendar Invite (.ics) for AesthetiKine Studio</li>
            <li>Access to Learning Portal with materials</li>
          </ul>
        </div>
        <section id="waitlist" className="mt-8">
          {available
            ? (course.square_checkout_url
              ? <a href={cta.action} target="_blank" rel="noopener noreferrer"
                  data-cta-name={cta.label} data-cta-key={`register-${course.key}`} data-course-key={course.key}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-[#17211c] px-5 py-3 font-medium text-white">{cta.label}</a>
              : <p role="status">Checkout temporarily unavailable</p>)
            : <AmandaWaitlistForm courseId={course.key} courseName={course.title} status="WAITLIST" squareCheckoutUrl={null}
                submitLabel={cta.label} />}
        </section>
      </section>
    </main>
  );
}

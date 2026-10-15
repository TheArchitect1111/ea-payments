import { notFound } from 'next/navigation';
import AmandaWaitlistForm from '@/components/amanda/AmandaWaitlistForm';
import AppHeaderNote from '@/components/amanda/AppHeaderNote';
import { registry } from '@/lib/amanda-catherine/registry';
import { amandaClassCtaStatus, amandaClassCardDescription, amandaClassButtonLabel } from '@/lib/amanda-catherine/class-cta-policy';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = await params;
  const courseId = courseSlug === 'clinical-fat-loss-injectables' ? 'clinical-fat-loss' : courseSlug;
  const course = (await registry()).courses.find((item) =>
    item.key === courseId && !item.isTest && item.isActive && item.isVisible
  );
  if (!course) notFound();
  const ctaStatus = amandaClassCtaStatus(course.key);
  if (!ctaStatus) notFound();

  return (
    <main className="min-h-screen bg-[#f7f1e8] px-5 py-12 text-[#17130f]">
      {['strategy-call', '90-day-package'].includes(course.key) && <AppHeaderNote appName={course.title} />}
      <section className="mx-auto max-w-3xl">
        {!['strategy-call', '90-day-package'].includes(course.key) && <h1 className="font-serif text-4xl">{course.title}</h1>}
        <p className="mt-4">{amandaClassCardDescription(course.description, ctaStatus)}</p>
        {course.price!==null && <p className="mt-4">{'
        <section id="waitlist" className="mt-8">
          {ctaStatus === 'available'
            ? course.square_checkout_url ? <a href={course.square_checkout_url} target="_blank" rel="noopener noreferrer"
                data-cta-name="Buy Now" data-cta-key={`buy-now-${course.key}`} data-course-key={course.key}
                className="flex w-full items-center justify-center rounded-xl border border-[#17211c] bg-white px-5 py-3 font-medium text-[#17211c] shadow-sm transition hover:bg-[#f4f0e8] focus:outline-none focus:ring-2 focus:ring-amber-500/40">Buy Now</a>
              : <p role="alert">Secure checkout is temporarily unavailable.</p>
            : <AmandaWaitlistForm courseId={course.key} courseName={course.title} status="WAITLIST"
                squareCheckoutUrl={null} submitLabel={amandaClassButtonLabel(course.key)} />}
        </section>
      </section>
    </main>
  );
}
+course.price.toLocaleString('en-US')+' CAD'}</p>}
        <section id="waitlist" className="mt-8">
          <AmandaWaitlistForm courseId={course.key} courseName={course.title} status={course.status} squareCheckoutUrl={course.square_checkout_url} />
        </section>
      </section>
    </main>
  );
}

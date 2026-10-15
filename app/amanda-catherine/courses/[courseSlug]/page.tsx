import { amandaIsAvailableNow, amandaCtaDescription, amandaWaitlistLabel } from '@/lib/amanda-catherine/class-cta-policy';
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

  return (
    <main className="min-h-screen bg-[#f7f1e8] px-5 py-12 text-[#17130f]">
      {['strategy-call', '90-day-package'].includes(course.key) && <AppHeaderNote appName={course.title} />}
      <section className="mx-auto max-w-3xl">
        {!['strategy-call', '90-day-package'].includes(course.key) && <h1 className="font-serif text-4xl">{course.title}</h1>}
        <p className="mt-4">{amandaCtaDescription(course,amandaIsAvailableNow(course))}</p>
        {course.price!==null && <p className="mt-4">{'
      </section>
    </main>
  );
}
+course.price.toLocaleString('en-US')} CAD</p>}
        <section id="waitlist" className="mt-8">
          {amandaIsAvailableNow(course) ? <a className="amanda-button" href={course.square_checkout_url!} target="_blank" rel="noopener noreferrer" data-cta-name="Buy Now" data-course-key={course.key} data-cta-key={`buy-now-${course.key}`}>Buy Now</a> : <AmandaWaitlistForm courseId={course.key} courseName={course.title} status="WAITLIST" squareCheckoutUrl={null} buttonLabel={amandaWaitlistLabel(course.key)} />}
        </section>
      </section>
    </main>
  );
}

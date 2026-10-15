import { isAmandaBuyNowClass, isAmandaStarterKitInquiry, amandaClassCopy } from '@/lib/amanda-catherine/class-cta-policy';
import AmandaCtaTracker from '@/app/portal/amanda-catherine/(engagement)/AmandaCtaTracker';
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
  const available = isAmandaBuyNowClass(course.key);
  const starterKit = isAmandaStarterKitInquiry(course.key);

  return (
    <AmandaCtaTracker><main className="min-h-screen bg-[#f7f1e8] px-5 py-12 text-[#17130f]">
      {['strategy-call', '90-day-package'].includes(course.key) && <AppHeaderNote appName={course.title} />}
      <section className="mx-auto max-w-3xl">
        <p className="mt-8 text-sm font-bold uppercase tracking-[0.18em] text-[#596b5b]">
          {available ? 'Registration open' : 'Waitlist'}
        </p>
        {!['strategy-call', '90-day-package'].includes(course.key) && <h1 className="font-serif text-4xl">{course.title}</h1>}
        <p className="mt-4">{amandaClassCopy(course.description, available)}</p>
        {course.price!==null && <p className="mt-4">{'$'+course.price.toLocaleString('en-US')} CAD</p>}
        <section id="waitlist" className="mt-8">
          {available
            ? (course.square_checkout_url
              ? <a href={course.square_checkout_url} target="_blank" rel="noopener noreferrer"
                  data-cta-name="Buy Now" data-cta-key={`buy-now-${course.key}`} data-course-key={course.key}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-[#17211c] px-5 py-3 font-medium text-white">Buy Now</a>
              : <p role="status">Checkout temporarily unavailable</p>)
            : <AmandaWaitlistForm courseId={course.key} courseName={course.title} status="WAITLIST" squareCheckoutUrl={null}
                submitLabel={starterKit ? 'Request Info' : 'Join Waitlist'} />}
        </section>
      </section>
    </main></AmandaCtaTracker>
  );
}

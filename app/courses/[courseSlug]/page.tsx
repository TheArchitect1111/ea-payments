import { notFound } from 'next/navigation';
import AmandaWarmLetter from '@/components/amanda/AmandaWarmLetter';
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
        <AmandaWarmLetter compact />
        <p className="mt-8 text-sm font-bold uppercase tracking-[0.18em] text-[#596b5b]">
          {course.status === 'LIVE' ? 'Registration open' : 'Waitlist'}
        </p>
        {!['strategy-call', '90-day-package'].includes(course.key) && <h1 className="font-serif text-4xl">{course.title}</h1>}
        {course.description && <p className="mt-4">{course.description}</p>}
        <section id="waitlist" className="mt-8">
          <AmandaWaitlistForm courseId={course.key} courseName={course.title} status={course.status} />
        </section>
      </section>
    </main>
  );
}

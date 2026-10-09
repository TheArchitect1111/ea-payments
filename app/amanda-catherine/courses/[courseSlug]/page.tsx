import { notFound } from 'next/navigation';
import AmandaWaitlistForm from '@/components/amanda/AmandaWaitlistForm';
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
      <section className="mx-auto max-w-3xl">
        <h1 className="font-serif text-4xl">{course.title}</h1>
        {course.description && <p className="mt-4">{course.description}</p>}
        <section id="waitlist" className="mt-8">
          <AmandaWaitlistForm courseId={course.key} courseName={course.title} status={course.status} />
        </section>
      </section>
    </main>
  );
}

import { notFound, redirect } from 'next/navigation';
import AmandaWaitlistForm from '@/components/amanda/AmandaWaitlistForm';
import AmandaNote from '@/components/amanda/AmandaNote';
import { findAmandaWaitlistInterest } from '@/lib/amanda-catherine/waitlist-interests';
import { AMANDA_COURSES } from '@/lib/amanda-catherine/config';
import { amandaCourseReady } from '@/lib/amanda-catherine/lms-policy';
export default async function Page({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = await params;
  if (AMANDA_COURSES.some(course => course.id === courseSlug) && amandaCourseReady(courseSlug)) redirect(`/courses/${encodeURIComponent(courseSlug)}`);
  const interest = findAmandaWaitlistInterest(courseSlug);
  if (!interest) notFound();
  return <main className="min-h-screen bg-[#f7f1e8] px-5 py-12 text-[#17130f]"><section className="mx-auto max-w-3xl"><h1>{interest.title}</h1><section id="waitlist">
    <AmandaNote courseName={interest.title} variant="waitlist" />
    <section className="amanda-next-steps" aria-labelledby="amanda-next-steps-title">
      <h2 id="amanda-next-steps-title">What happens next</h2>
      <ul>
        <li>Join Amanda's priority waitlist so we know which program you're interested in.</li>
        <li>We'll email you when the next enrollment opportunity becomes available and share the next steps.</li>
      </ul>
    </section>
    <AmandaWaitlistForm courseId={interest.id} courseName={interest.title} />
  </section></section></main>;
}

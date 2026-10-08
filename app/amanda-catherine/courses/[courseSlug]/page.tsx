import { notFound, redirect } from 'next/navigation';
import AmandaWarmLetter from '@/components/amanda/AmandaWarmLetter';
import AmandaWaitlistForm from '@/components/amanda/AmandaWaitlistForm';
import { findAmandaWaitlistInterest } from '@/lib/amanda-catherine/waitlist-interests';
import { AMANDA_COURSES } from '@/lib/amanda-catherine/config';
import { amandaCourseReady } from '@/lib/amanda-catherine/lms-policy';
export default async function Page({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = await params;
  if (AMANDA_COURSES.some(course => course.id === courseSlug) && amandaCourseReady(courseSlug)) redirect(`/courses/${encodeURIComponent(courseSlug)}`);
  const interest = findAmandaWaitlistInterest(courseSlug);
  if (!interest) notFound();
  return <main className="min-h-screen bg-[#f7f1e8] px-5 py-12 text-[#17130f]"><section className="mx-auto max-w-3xl"><AmandaWarmLetter compact/><h1>{interest.title}</h1><section id="waitlist"><h2>Join Waitlist</h2><p>Join Amanda's waitlist to hear when enrollment opens. No payment is required.</p><AmandaWaitlistForm courseId={interest.id} courseName={interest.title} /></section></section></main>;
}

import { notFound } from 'next/navigation';
import { AMANDA_COURSES, AMANDA_SELF_ENROLLMENT_COURSES } from '@/lib/amanda-catherine/config';
import { amandaCourseReady, AMANDA_SUPPORT_WORDING } from '@/lib/amanda-catherine/lms-policy';
import WaitlistForm from '@/app/portal/amanda-catherine/waitlist/WaitlistForm';
import AmandaEnrollmentForm from '@/app/portal/amanda-catherine/enroll/AmandaEnrollmentForm';
export default async function Page({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = await params;
  const course = AMANDA_COURSES.find(c => c.id === courseSlug);
  if (!course) notFound();
  const offer = AMANDA_SELF_ENROLLMENT_COURSES.find(c => c.courseId === course.id);
  return <main className="min-h-screen bg-[#f7f1e8] px-5 py-12 text-[#17130f]"><section className="mx-auto max-w-3xl"><h1 className="font-serif text-4xl">{course.title}</h1>
    {amandaCourseReady(course.id) && offer ? <><p>{AMANDA_SUPPORT_WORDING}</p><p>Practitioner kit included in tuition. Pickup and shipping are FREE.</p><AmandaEnrollmentForm initialCourseId={course.id} courses={[{ ...offer, delivery: [...offer.delivery] }]} /></> : <section id="waitlist"><h2>Join Waitlist</h2><WaitlistForm courseId={course.id} /></section>}
  </section></main>;
}

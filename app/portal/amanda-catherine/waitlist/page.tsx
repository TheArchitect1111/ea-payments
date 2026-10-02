import { notFound, redirect } from 'next/navigation';
import { AMANDA_COURSES } from '@/lib/amanda-catherine/config';
import { amandaCourseReady } from '@/lib/amanda-catherine/lms-policy';
import WaitlistForm from './WaitlistForm';
export default async function Page({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  const { course: id } = await searchParams; const course = AMANDA_COURSES.find(item => item.id === id);
  if (!course) notFound();
  if (amandaCourseReady(course.id)) redirect(`/portal/amanda-catherine/enroll?course=${encodeURIComponent(course.id)}`);
  return <main style={{ maxWidth: 720, margin: '60px auto', padding: 24 }}><h1>{course.title}</h1><p>Join Waitlist</p><WaitlistForm courseId={course.id} /></main>;
}

import Link from 'next/link';
import { AMANDA_COURSES } from '@/lib/amanda-catherine/config';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Test Access Expired | Amanda Catherine' };

export default async function AmandaTestExpired({ searchParams }: {
  searchParams: Promise<{ courseId?: string }>;
}) {
  const { courseId } = await searchParams;
  const course = AMANDA_COURSES.find((item) => item.id === courseId);
  return <main className="min-h-screen bg-[#f6f0e6] px-5 py-16 text-[#17211c]">
    <section className="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest">AesthetiKine Academy</p>
      <h1 className="mb-4 text-3xl font-semibold">Your $1 test access has expired</h1>
      <p className="mb-3">Your 3-day test access ended automatically. You have not been subscribed, and there is no automatic charge or renewal.</p>
      {course ? <p className="mb-5">Course: <strong>{course.title}</strong></p> : null}
      <Link className="inline-block rounded-lg bg-[#17211c] px-5 py-3 text-white" href={course ? `/courses/${encodeURIComponent(course.id)}` : '/amanda-catherine'}>
        Upgrade to full course access
      </Link>
      <p className="mt-5"><Link href="/portal/amanda-catherine/learning">Return to Academy</Link></p>
    </section>
  </main>;
}

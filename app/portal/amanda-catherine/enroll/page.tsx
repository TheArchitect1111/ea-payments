import Link from 'next/link';
import { AMANDA_SELF_ENROLLMENT_COURSES } from '@/lib/amanda-catherine/config';
import AmandaEnrollmentForm from './AmandaEnrollmentForm';

export const metadata = {
  title: 'Courses & Learning | Amanda Catherine',
  description: 'Choose an Amanda Catherine course and enroll securely.',
};

export default async function AmandaEnrollmentPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const { payment } = await searchParams;
  return (
    <main className="min-h-screen bg-[#f7f1e8] text-[#17130f]">
      <section className="bg-[#102018] px-5 py-12 text-[#fffaf2] sm:py-16">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#c39851]">AesthetiKine Academy</p>
          <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[0.95] sm:text-7xl">Choose your course. Begin your training.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#eee5d8]">
            Select your program, complete secure checkout, and receive your private learning access automatically.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
        {payment === 'cancelled' ? (
          <div role="status" className="mb-8 rounded-2xl border border-[#c39851] bg-white p-4 font-semibold">
            Your checkout was cancelled. Nothing was charged; you can continue whenever you are ready.
          </div>
        ) : null}
        <AmandaEnrollmentForm courses={AMANDA_SELF_ENROLLMENT_COURSES.map((course) => ({ ...course, delivery: [...course.delivery] }))} />
        <div className="mt-10 border-t border-[#d8c8b0] pt-7 text-center">
          <p className="font-semibold">Already enrolled?</p>
          <Link
            className="mt-3 inline-flex min-h-12 items-center justify-center rounded-full border-2 border-[#102018] px-6 font-bold text-[#102018]"
            href="/portal/login?next=%2Fportal%2Famanda-catherine%2Flearning"
          >
            Sign in to Courses & Learning
          </Link>
        </div>
      </section>
    </main>
  );
}

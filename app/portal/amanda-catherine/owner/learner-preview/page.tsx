import Link from 'next/link';
import AmandaLearningCenter from '@/app/portal/[slug]/learning/AmandaLearningCenter';
import { AMANDA_COURSES } from '@/lib/amanda-catherine/config';
import { amandaCourseReady } from '@/lib/amanda-catherine/lms-policy';

export const dynamic = 'force-dynamic';

export default async function AmandaLearnerPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string }>;
}) {
  const { courseId } = await searchParams;
  const readyCourses = AMANDA_COURSES.filter((course) => amandaCourseReady(course.id));
  const selected = readyCourses.find((course) => course.id === courseId) || readyCourses[0];

  return (
    <div className="ac-dashboard">
      <header className="ac-topbar">
        <div>
          <small>AMANDA CATHERINE · ADMIN PREVIEW</small>
          <h1>Client learning dashboard</h1>
          <p>Read-only preview of the experience a newly enrolled learner receives after payment.</p>
        </div>
        <div className="ac-status">Learner view</div>
      </header>

      <section className="ac-card">
        <span className="ac-eyebrow">PREVIEW A READY COURSE</span>
        <div className="ac-actions">
          {readyCourses.map((course) => (
            <Link
              key={course.id}
              className="approved-pill"
              href={`/portal/amanda-catherine/owner/learner-preview?courseId=${encodeURIComponent(course.id)}`}
            >
              {course.title}
            </Link>
          ))}
        </div>
      </section>

      {selected ? (
        <section className="ac-card">
          <AmandaLearningCenter
            audience="student-trainee"
            assignedCourseIds={[selected.id]}
            isAdmin
            previewAsLearner
          />
        </section>
      ) : (
        <section className="ac-card">
          <h2>No READY courses are available to preview.</h2>
        </section>
      )}

      <section className="ac-card">
        <Link href="/portal/amanda-catherine/owner/academy">← Return to AesthetiKine Academy</Link>
      </section>
    </div>
  );
}

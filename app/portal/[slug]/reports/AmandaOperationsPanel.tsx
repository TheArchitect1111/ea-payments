import Link from 'next/link';
import { listPortalFormSubmissions } from '@/lib/portal-forms/store';
import { listRegistrationsForPortal } from '@/lib/events/registration-ledger';
import { listPretixEventsForPortal } from '@/lib/events/pretix-store';
import { AMANDA_COURSES } from '@/lib/amanda-catherine/config';
import { listAmandaCourseProgress } from '@/lib/amanda-catherine/progress-store';

export default async function AmandaOperationsPanel({ slug }: { slug: string }) {
  const [submissions, registrations, events, courseProgress] = await Promise.all([
    listPortalFormSubmissions(slug),
    listRegistrationsForPortal(slug),
    listPretixEventsForPortal(slug, { includeDrafts: true }),
    listAmandaCourseProgress(slug),
  ]);
  const applications = submissions.filter((item) => item.kind === 'application');
  const intakes = submissions.filter((item) => item.kind === 'intake');
  const awaitingReview = submissions.filter((item) => item.status === 'submitted').length;
  const approved = submissions.filter((item) => item.status === 'accepted').length;
  const paidRegistrations = registrations.filter((item) => item.status === 'paid').length;
  const volunteerApplications = applications.filter((item) => item.payload?.audience === 'volunteer').length;
  const mediaProjects = applications.filter((item) => item.payload?.audience === 'media-guest').length;
  const membershipApplications = applications.filter((item) => item.payload?.audience === 'member-community-participant').length;

  const metrics = [
    ['New intakes', intakes.length],
    ['Applications', applications.length],
    ['Awaiting review', awaitingReview],
    ['Approved', approved],
    ['Paid registrations', paidRegistrations],
    ['Membership requests', membershipApplications],
    ['Media projects', mediaProjects],
    ['Volunteer applicants', volunteerApplications],
    ['Active course records', courseProgress.length],
    ['Certificates earned', courseProgress.filter((item) => item.certificateIssuedAt).length],
  ] as const;

  return (
    <section style={{ marginBottom: 24 }}>
      <div className="ep-metrics-grid">
        {metrics.map(([label, value]) => (
          <div key={label} className="ep-metric-card">
            <div className="ep-metric-body"><div><p className="ep-metric-label">{label}</p><p className="ep-metric-value">{value}</p></div></div>
          </div>
        ))}
      </div>
      <div className="ep-module-card" style={{ marginTop: 18 }}>
        <p className="ep-module-card-title">Student learning progress</p>
        <p className="ep-module-card-note">
          Progress appears after a student opens an assigned course. Course recordings can be added later without removing this tracking.
        </p>
        {courseProgress.length === 0 ? (
          <p className="ep-module-card-note" style={{ marginTop: 12 }}>No student course activity has been recorded yet.</p>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: 14 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 8px' }}>Student</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px' }}>Course</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px' }}>Progress</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px' }}>Certificate</th>
                </tr>
              </thead>
              <tbody>
                {courseProgress.map((record) => {
                  const course = AMANDA_COURSES.find((item) => item.id === record.courseId);
                  const total = course?.lessons.length || 0;
                  const percent = total ? Math.round((record.completedLessons.length / total) * 100) : 0;
                  return (
                    <tr key={`${record.email}:${record.courseId}`}>
                      <td style={{ padding: '10px 8px', borderTop: '1px solid rgba(31,41,55,.12)' }}>{record.email}</td>
                      <td style={{ padding: '10px 8px', borderTop: '1px solid rgba(31,41,55,.12)' }}>{course?.title || record.courseId}</td>
                      <td style={{ padding: '10px 8px', borderTop: '1px solid rgba(31,41,55,.12)' }}>{percent}% ({record.completedLessons.length}/{total})</td>
                      <td style={{ padding: '10px 8px', borderTop: '1px solid rgba(31,41,55,.12)' }}>{record.certificateIssuedAt ? 'Available' : 'Not yet eligible'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="ep-module-card" style={{ marginTop: 18 }}>
        <p className="ep-module-card-title">Operations queue</p>
        <p className="ep-module-card-note">{events.length} events or volunteer shifts · {registrations.length} registrations</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
          <Link className="ep-btn" href={`/portal/${slug}/applications`}>Review applications</Link>
          <Link className="ep-btn" href={`/portal/${slug}/events`}>Manage events & schedules</Link>
          <Link className="ep-btn" href={`/portal/${slug}/updates/new`}>Create announcement</Link>
          <Link className="ep-btn" href={`/portal/${slug}/messaging`}>Open messages</Link>
        </div>
      </div>
    </section>
  );
}

import Link from 'next/link';
import { listPortalFormSubmissions } from '@/lib/portal-forms/store';
import { listRegistrationsForPortal } from '@/lib/events/registration-ledger';
import { listPretixEventsForPortal } from '@/lib/events/pretix-store';

export default async function AmandaOperationsPanel({ slug }: { slug: string }) {
  const [submissions, registrations, events] = await Promise.all([
    listPortalFormSubmissions(slug),
    listRegistrationsForPortal(slug),
    listPretixEventsForPortal(slug, { includeDrafts: true }),
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

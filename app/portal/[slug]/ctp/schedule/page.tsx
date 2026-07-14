import Link from 'next/link';
import { redirect } from 'next/navigation';
import { GOLD, NAVY } from '@/lib/design-system';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import { buildCtpScheduleView } from '@/lib/ctp-schedule-view';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';

export const dynamic = 'force-dynamic';

export default async function PortalCtpSchedulePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { session, client } = await requirePortalModule(slug, 'ctp');

  const submission = await getCtpSubmissionForPortal({
    portalSlug: slug,
    email: session.email ?? client.email,
  });

  if (!submission) {
    redirect(`/portal/${slug}`);
  }

  const view = buildCtpScheduleView(submission);

  return (
    <PortalSubpage
      slug={slug}
      active="ctp"
      kicker="Scheduling"
      title="Strategy & review sessions"
      lede="See your confirmed review time and book a strategy session when you are ready to decide direction."
    >
      <div className="ep-module-card" style={{ marginBottom: '1.25rem' }}>
        <p className="ep-module-card-note" style={{ marginBottom: '0.35rem' }}>
          {view.businessName}
          {view.clientTypeLabel ? ` · ${view.clientTypeLabel}` : ''}
          {` · ${view.status}`}
        </p>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>
          {view.headline}
        </h2>
        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.72)' }}>
          {view.summary}
        </p>
      </div>

      <section className="ep-module-card" style={{ marginBottom: '1.25rem' }}>
        <p
          style={{
            margin: '0 0 0.75rem',
            fontSize: '0.7rem',
            fontWeight: 800,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(216,173,61,0.85)',
          }}
        >
          Confirmed review
        </p>
        {view.reviewLabel ? (
          <>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: GOLD }}>
              {view.reviewLabel}
            </p>
            <p style={{ margin: '0.65rem 0 0', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
              This is the collaborative review on your CTP timeline. Come prepared with questions on
              scope, investment, and first-build priorities.
            </p>
          </>
        ) : (
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
            No review time has been confirmed yet. Book a strategy session below, or wait for EA to
            set the review slot from the executive desk.
          </p>
        )}
      </section>

      <section className="ep-module-card" style={{ marginBottom: '1.25rem' }}>
        <p
          style={{
            margin: '0 0 0.75rem',
            fontSize: '0.7rem',
            fontWeight: 800,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(216,173,61,0.85)',
          }}
        >
          Book a session
        </p>
        <p style={{ margin: '0 0 1rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
          Choose a time that works. We will walk your snapshot, recommendations, and production
          package together.
        </p>
        <a
          href={view.calendlyUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block rounded-full px-6 py-3 text-sm font-bold"
          style={{ backgroundColor: GOLD, color: NAVY }}
        >
          Book strategy session
        </a>
      </section>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Link
          href={`/portal/${slug}/ctp`}
          className="inline-block rounded-full px-6 py-3 text-sm font-bold"
          style={{ border: '1px solid rgba(255,255,255,0.35)', color: '#fff' }}
        >
          Back to progress
        </Link>
        <Link
          href={`/portal/${slug}/ctp/recommendations`}
          className="inline-block rounded-full px-6 py-3 text-sm font-bold"
          style={{ border: '1px solid rgba(255,255,255,0.35)', color: '#fff' }}
        >
          Review recommendations
        </Link>
      </div>
    </PortalSubpage>
  );
}

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import { buildCtpOpportunityReviewView } from '@/lib/ctp-opportunity-view';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';
import { GOLD, NAVY } from '@/lib/design-system';
import '@/app/portal/components/opportunity-experience.css';

export const dynamic = 'force-dynamic';

export default async function PortalCtpOpportunityReviewPage({
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

  const firstName = (client.clientName || submission.contactName).split(' ')[0];
  const view = buildCtpOpportunityReviewView(submission, slug, { firstName });

  return (
    <PortalSubpage
      slug={slug}
      active="ctp"
      kicker="Opportunity Review"
      title="Walk through your recommendations"
      lede="This is a guided review of analysis already prepared for you — not a sales call."
    >
      <div className="oe-report">
        <header className="oe-hero">
          <p className="oe-greeting">{view.firstName}, here&apos;s what we&apos;ll cover</p>
          <h2 className="oe-hero-title">{view.headline}</h2>
          <p className="oe-hero-lede">{view.summary}</p>
        </header>

        {view.reviewLabel ? (
          <section className="oe-section" aria-labelledby="oe-confirmed">
            <h3 id="oe-confirmed" className="oe-section-title">
              Confirmed time
            </h3>
            <p className="oe-narrative oe-review-time">{view.reviewLabel}</p>
            <p className="oe-narrative">
              Come prepared with questions on scope, investment, and first-build priorities. You can
              also book an additional session below if you need another slot.
            </p>
          </section>
        ) : (
          <section className="oe-section" aria-labelledby="oe-booking">
            <h3 id="oe-booking" className="oe-section-title">
              Ready when you are
            </h3>
            <p className="oe-narrative">
              No review time has been confirmed yet. Choose a time below and we will walk through your
              Opportunity Dashboard together — findings, recommendations, and investment expectations
              prepared specifically for {view.businessName}.
            </p>
          </section>
        )}

        <section className="oe-section" aria-labelledby="oe-agenda">
          <h3 id="oe-agenda" className="oe-section-title">
            During our Opportunity Review we will
          </h3>
          <ul className="oe-agenda">
            {view.agenda.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="oe-cta-block">
          <a
            href={view.calendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="oe-cta-primary"
            style={{ backgroundColor: GOLD, color: NAVY }}
          >
            {view.ctaLabel}
          </a>
          <p className="oe-cta-secondary">
            <Link href={view.backHref}>← Back to Opportunity Dashboard</Link>
          </p>
        </section>
      </div>
      <style>{`
        .oe-hero-title {
          margin: 0.35rem 0 0.65rem;
          font-size: clamp(1.35rem, 2.5vw, 1.75rem);
          font-weight: 700;
          color: #1a1a2e;
        }
        .oe-review-time {
          font-size: 1.35rem;
          font-weight: 700;
          color: #c9a844;
        }
        .oe-agenda {
          margin: 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 0.75rem;
        }
        .oe-agenda li {
          padding: 0.9rem 1rem;
          background: #fff;
          border: 1px solid #e8e2d6;
          border-radius: 10px;
          font-size: 1.02rem;
          color: #1a1a2e;
        }
        .oe-agenda li::before {
          content: '→ ';
          color: #c9a844;
          font-weight: 700;
        }
      `}</style>
    </PortalSubpage>
  );
}

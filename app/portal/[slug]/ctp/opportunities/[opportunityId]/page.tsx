import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import { buildCtpOpportunityDetailView } from '@/lib/ctp-opportunity-view';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';
import { GOLD, NAVY } from '@/lib/design-system';
import '@/app/portal/components/opportunity-experience.css';

export const dynamic = 'force-dynamic';

export default async function PortalCtpOpportunityDetailPage({
  params,
}: {
  params: Promise<{ slug: string; opportunityId: string }>;
}) {
  const { slug, opportunityId } = await params;
  const { session, client } = await requirePortalModule(slug, 'ctp');

  const submission = await getCtpSubmissionForPortal({
    portalSlug: slug,
    email: session.email ?? client.email,
  });

  if (!submission) {
    redirect(`/portal/${slug}`);
  }

  const view = buildCtpOpportunityDetailView(submission, slug, opportunityId);
  if (!view) {
    notFound();
  }

  const opp = view.opportunity;

  return (
    <PortalSubpage
      slug={slug}
      active="ctp"
      kicker="Opportunity Detail"
      title={opp.title}
      lede={`What we noticed for ${view.businessName}.`}
    >
      <div className="oe-report">
        <section className="oe-section" aria-labelledby="oe-noticed">
          <h3 id="oe-noticed" className="oe-section-title">
            What We Noticed
          </h3>
          <p className="oe-narrative">{opp.noticed}</p>
        </section>

        <section className="oe-section" aria-labelledby="oe-why">
          <h3 id="oe-why" className="oe-section-title">
            Why It Matters
          </h3>
          <p className="oe-narrative">{opp.whyItMatters}</p>
        </section>

        <section className="oe-section" aria-labelledby="oe-improve">
          <h3 id="oe-improve" className="oe-section-title">
            Recommended Improvements
          </h3>
          <ul className="oe-detail-list">
            {opp.improvements.map((item) => (
              <li key={item}>
                <span className="oe-check" aria-hidden>
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="oe-section" aria-labelledby="oe-impact">
          <h3 id="oe-impact" className="oe-section-title">
            Potential Business Impact
          </h3>
          <ul className="oe-detail-list">
            {opp.businessImpact.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="oe-cta-block">
          <Link
            href={`/portal/${slug}/ctp/review`}
            className="oe-cta-primary"
            style={{ backgroundColor: GOLD, color: NAVY }}
          >
            Walk Me Through My Recommendations
          </Link>
          <p className="oe-cta-secondary">
            <Link href={view.backHref}>← Back to Opportunity Dashboard</Link>
          </p>
        </section>
      </div>
      <style>{`
        .oe-detail-list {
          margin: 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 0.65rem;
        }
        .oe-detail-list li {
          display: flex;
          gap: 0.65rem;
          align-items: flex-start;
          font-size: 1rem;
          line-height: 1.55;
          color: #1a1a2e;
        }
        .oe-check {
          color: #c9a844;
          font-weight: 700;
        }
      `}</style>
    </PortalSubpage>
  );
}

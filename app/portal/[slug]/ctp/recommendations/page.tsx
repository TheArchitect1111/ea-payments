import Link from 'next/link';
import { redirect } from 'next/navigation';
import { GOLD, NAVY } from '@/lib/design-system';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import {
  buildCtpRecommendationsView,
  type CtpRecommendationItem,
} from '@/lib/ctp-recommendations-view';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';

export const dynamic = 'force-dynamic';

function Section({
  label,
  items,
  empty,
}: {
  label: string;
  items: CtpRecommendationItem[];
  empty: string;
}) {
  return (
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
        {label}
      </p>
      {items.length ? (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.85rem' }}>
          {items.map((item) => (
            <li
              key={item.id}
              style={{
                border: '1px solid rgba(255,255,255,0.12)',
                padding: '0.85rem 1rem',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <p style={{ margin: 0, fontWeight: 700, color: '#fff' }}>{item.title}</p>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.88rem', lineHeight: 1.55, color: 'rgba(255,255,255,0.68)' }}>
                {item.detail}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ margin: 0, color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem' }}>{empty}</p>
      )}
    </section>
  );
}

export default async function PortalCtpRecommendationsPage({
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

  const view = buildCtpRecommendationsView(submission);

  return (
    <PortalSubpage
      slug={slug}
      active="ctp"
      kicker="Recommendations"
      title="Your recommended path"
      lede="Priorities from discovery, intake analysis, and AI production — sequenced for the first meaningful wins."
    >
      <div className="ep-module-card" style={{ marginBottom: '1.25rem' }}>
        <p className="ep-module-card-note" style={{ marginBottom: '0.35rem' }}>
          {view.businessName}
          {view.clientTypeLabel ? ` · ${view.clientTypeLabel}` : ''}
          {typeof view.confidence === 'number'
            ? ` · Confidence ${Math.round(view.confidence * 100)}%`
            : ''}
        </p>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>
          {view.headline}
        </h2>
        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.72)' }}>
          {view.summary}
        </p>
      </div>

      <Section
        label="Opportunities"
        items={view.opportunities}
        empty="Opportunity mapping appears after intake analysis completes."
      />
      <Section
        label="Recommended next steps"
        items={view.nextSteps}
        empty="Next steps will populate from intake analysis."
      />
      <Section
        label="Discovery recommendations"
        items={view.discoveryRecommendations}
        empty="No discovery recommendations were captured."
      />
      <Section
        label="Production focus"
        items={view.productionFocus}
        empty="Production artifacts will show here once AI production runs."
      />
      <Section
        label="Risks to watch"
        items={view.risks}
        empty="No material risks flagged yet."
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Link
          href={`/portal/${slug}/ctp`}
          className="inline-block rounded-full px-6 py-3 text-sm font-bold"
          style={{ backgroundColor: GOLD, color: NAVY }}
        >
          Back to overview
        </Link>
        <Link
          href={`/portal/${slug}/ctp/bi`}
          className="inline-block rounded-full px-6 py-3 text-sm font-bold"
          style={{ border: '1px solid rgba(255,255,255,0.35)', color: '#fff' }}
        >
          Open Executive Snapshot
        </Link>
      </div>
    </PortalSubpage>
  );
}

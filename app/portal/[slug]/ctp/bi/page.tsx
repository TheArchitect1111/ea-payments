import Link from 'next/link';
import { redirect } from 'next/navigation';
import { GOLD, NAVY } from '@/lib/design-system';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import { buildCtpBiView } from '@/lib/ctp-bi-view';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';

export const dynamic = 'force-dynamic';

export default async function PortalCtpBiPage({
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

  const view = buildCtpBiView(submission);

  return (
    <PortalSubpage
      slug={slug}
      active="ctp"
      kicker="Business Intelligence"
      title="Executive Snapshot"
      lede="Capacity, maturity, opportunity, and the scoped path forward — your consulting-grade read on the business."
    >
      <div className="ep-module-card" style={{ marginBottom: '1.25rem' }}>
        <p className="ep-module-card-note" style={{ marginBottom: '0.35rem' }}>
          {view.businessName}
          {view.clientTypeLabel ? ` · ${view.clientTypeLabel}` : ''}
        </p>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>
          {view.headline}
        </h2>
        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.72)' }}>
          {view.summary}
        </p>
      </div>

      {view.available ? (
        <>
          <div
            style={{
              display: 'grid',
              gap: '0.85rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              marginBottom: '1.25rem',
            }}
          >
            {view.metrics.map((metric) => (
              <div key={metric.label} className="ep-module-card" style={{ margin: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'rgba(216,173,61,0.85)',
                  }}
                >
                  {metric.label}
                </p>
                <p
                  style={{
                    margin: '0.45rem 0 0',
                    fontSize: '1.65rem',
                    fontWeight: 800,
                    color: GOLD,
                  }}
                >
                  {metric.value}
                </p>
                {metric.detail ? (
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)' }}>
                    {metric.detail}
                  </p>
                ) : null}
              </div>
            ))}
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
              Findings
            </p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.75rem' }}>
              {view.findings.map((finding) => (
                <li
                  key={finding.title}
                  style={{
                    borderLeft: `3px solid ${
                      finding.severity === 'critical'
                        ? '#e57373'
                        : finding.severity === 'warning'
                          ? GOLD
                          : 'rgba(255,255,255,0.25)'
                    }`,
                    paddingLeft: '0.85rem',
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 700, color: '#fff' }}>{finding.title}</p>
                  <p style={{ margin: '0.3rem 0 0', fontSize: '0.88rem', color: 'rgba(255,255,255,0.68)' }}>
                    {finding.detail}
                  </p>
                </li>
              ))}
            </ul>
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
              Project scope
            </p>
            {view.projectTypeLabel ? (
              <p style={{ margin: '0 0 0.5rem', fontWeight: 700, color: '#fff' }}>
                {view.projectTypeLabel}
              </p>
            ) : null}
            <ul style={{ margin: '0 0 1rem', paddingLeft: '1.1rem', color: 'rgba(255,255,255,0.78)' }}>
              {view.scopeStack.map((line) => (
                <li key={line} style={{ marginBottom: '0.35rem' }}>
                  {line}
                </li>
              ))}
            </ul>
            <div
              style={{
                display: 'grid',
                gap: '0.75rem',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              }}
            >
              {view.timelineLabel ? (
                <div>
                  <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(216,173,61,0.85)' }}>
                    Timeline
                  </p>
                  <p style={{ margin: '0.35rem 0 0', color: 'rgba(255,255,255,0.8)' }}>{view.timelineLabel}</p>
                </div>
              ) : null}
              {view.investmentLabel ? (
                <div>
                  <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(216,173,61,0.85)' }}>
                    Investment
                  </p>
                  <p style={{ margin: '0.35rem 0 0', color: 'rgba(255,255,255,0.8)' }}>{view.investmentLabel}</p>
                </div>
              ) : null}
              {view.expectedRoiLabel ? (
                <div>
                  <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(216,173,61,0.85)' }}>
                    ROI framing
                  </p>
                  <p style={{ margin: '0.35rem 0 0', color: 'rgba(255,255,255,0.8)' }}>{view.expectedRoiLabel}</p>
                </div>
              ) : null}
            </div>
          </section>
        </>
      ) : (
        <div className="ep-module-card" style={{ marginBottom: '1.25rem' }}>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', lineHeight: 1.65 }}>
            This track may not include a full Executive Snapshot, or analysis is still running. Check
            progress for live status.
          </p>
        </div>
      )}

      {typeof view.digitalScore === 'number' ? (
        <div className="ep-module-card" style={{ marginBottom: '1.25rem' }}>
          <p
            style={{
              margin: '0 0 0.35rem',
              fontSize: '0.7rem',
              fontWeight: 800,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(216,173,61,0.85)',
            }}
          >
            Digital presence
          </p>
          <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: GOLD }}>
            {view.digitalScore}/100
          </p>
          {view.digitalImpact ? (
            <p style={{ margin: '0.5rem 0 0', color: 'rgba(255,255,255,0.68)', lineHeight: 1.6 }}>
              {view.digitalImpact}
            </p>
          ) : null}
        </div>
      ) : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Link
          href={`/portal/${slug}/ctp`}
          className="inline-block rounded-full px-6 py-3 text-sm font-bold"
          style={{ backgroundColor: GOLD, color: NAVY }}
        >
          Back to progress
        </Link>
        {view.productionHeadline ? (
          <Link
            href={`/portal/${slug}/ctp`}
            className="inline-block rounded-full px-6 py-3 text-sm font-bold"
            style={{ border: '1px solid rgba(255,255,255,0.35)', color: '#fff' }}
          >
            View production package
          </Link>
        ) : null}
      </div>
    </PortalSubpage>
  );
}

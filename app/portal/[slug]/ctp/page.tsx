import Link from 'next/link';
import { redirect } from 'next/navigation';
import { GOLD, NAVY } from '@/lib/design-system';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import { buildCtpOverviewView } from '@/lib/ctp-overview-view';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';

export const dynamic = 'force-dynamic';

export default async function PortalCtpOverviewPage({
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

  const view = buildCtpOverviewView(submission, slug);

  return (
    <PortalSubpage
      slug={slug}
      active="ctp"
      kicker="Consider the Possibilities™"
      title="Overview"
      lede="Your transformation workspace — progress, intelligence, recommendations, documents, scheduling, and support in one place."
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

        <div style={{ marginTop: '1rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.4rem',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(216,173,61,0.9)',
            }}
          >
            <span>Overall progress</span>
            <span>{view.percentComplete}%</span>
          </div>
          <div
            style={{
              height: '0.55rem',
              borderRadius: '9999px',
              background: 'rgba(255,255,255,0.12)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${view.percentComplete}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${GOLD}, #f0d78a)`,
              }}
            />
          </div>
        </div>

        <div
          style={{
            marginTop: '1rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.85rem',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          {typeof view.maturityScore === 'number' ? (
            <span>
              Maturity <strong style={{ color: GOLD }}>{view.maturityScore}/100</strong>
            </span>
          ) : null}
          {typeof view.digitalScore === 'number' ? (
            <span>
              Digital <strong style={{ color: GOLD }}>{view.digitalScore}/100</strong>
            </span>
          ) : null}
        </div>

        <p style={{ margin: '1.1rem 0 0' }}>
          <Link
            href={`/portal/${slug}/ctp/progress`}
            className="inline-block rounded-full px-6 py-3 text-sm font-bold"
            style={{ backgroundColor: GOLD, color: NAVY }}
          >
            Open live progress
          </Link>
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gap: '0.85rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        }}
      >
        {view.cards.map((card) => {
          const external = card.href.startsWith('http');
          return (
            <a
              key={card.id}
              href={card.href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noreferrer' : undefined}
              className="ep-module-card"
              style={{
                margin: 0,
                textDecoration: 'none',
                color: 'inherit',
                display: 'block',
                borderColor:
                  card.status === 'ready'
                    ? 'rgba(216,173,61,0.35)'
                    : 'rgba(255,255,255,0.12)',
              }}
            >
              <p
                style={{
                  margin: '0 0 0.35rem',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color:
                    card.status === 'ready'
                      ? GOLD
                      : card.status === 'active'
                        ? 'rgba(216,173,61,0.75)'
                        : 'rgba(255,255,255,0.45)',
                }}
              >
                {card.statusLabel}
              </p>
              <p style={{ margin: '0 0 0.35rem', fontWeight: 800, color: '#fff', fontSize: '1.05rem' }}>
                {card.title}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  color: 'rgba(255,255,255,0.65)',
                  wordBreak: 'break-word',
                }}
              >
                {card.detail}
              </p>
            </a>
          );
        })}
      </div>
    </PortalSubpage>
  );
}

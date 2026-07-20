import Link from 'next/link';
import { redirect } from 'next/navigation';
import { NAVY, GOLD } from '@/lib/design-system';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import { buildCtpPortalStatusView } from '@/lib/ctp-portal-status';
import type { CtpTimelineStepState } from '@/lib/ctp-portal-status';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';
import PortalCtpAssetGallery from '@/app/portal/components/PortalCtpAssetGallery';
import PortalCtpDesignStudioForm from '@/app/portal/components/PortalCtpDesignStudioForm';

export const dynamic = 'force-dynamic';

const STATE_LABEL: Record<CtpTimelineStepState, string> = {
  complete: 'Complete',
  active: 'In progress',
  pending: 'Up next',
  failed: 'Needs attention',
};

function stateClass(state: CtpTimelineStepState): string {
  if (state === 'complete') return 'ctp-step-complete';
  if (state === 'active') return 'ctp-step-active';
  if (state === 'failed') return 'ctp-step-failed';
  return 'ctp-step-pending';
}

export default async function PortalCtpStatusPage({
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

  const view = buildCtpPortalStatusView(submission);
  const submittedDate = new Date(view.submittedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return (
    <PortalSubpage
      slug={slug}
      active="ctp"
      clientNavActive="progress"
      kicker="Progress"
      title="Your live project progress"
      lede="Track every stage — from assessment through reveal — and complete Design Studio when you are ready."
    >
      <div className="ep-module-card" style={{ marginBottom: '1.25rem' }}>
        <p className="ep-module-card-note" style={{ marginBottom: '0.35rem' }}>
          {view.businessName} · Submitted {submittedDate}
          {view.clientTypeLabel ? ` · ${view.clientTypeLabel}` : ''}
        </p>
        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.78)' }}>
          Current status: <strong>{view.status}</strong>
          {typeof view.digitalScore === 'number' ? (
            <>
              {' '}
              · Digital Presence <strong>{view.digitalScore}/100</strong>
            </>
          ) : null}
          {typeof view.socialScore === 'number' ? (
            <>
              {' '}
              · Social <strong>{view.socialScore}/100</strong>
            </>
          ) : null}
          {typeof view.gbpScore === 'number' ? (
            <>
              {' '}
              · Google Business <strong>{view.gbpScore}/100</strong>
            </>
          ) : null}
          {typeof view.maturityScore === 'number' ? (
            <>
              {' '}
              · Maturity <strong>{view.maturityScore}/100</strong>
            </>
          ) : null}
          {typeof view.adminWastePercent === 'number' ? (
            <>
              {' '}
              · Admin drag <strong>{view.adminWastePercent}%</strong>
            </>
          ) : null}
        </p>
        {view.snapshotSummary ? (
          <p
            style={{
              margin: '0.85rem 0 0',
              fontSize: '0.9rem',
              lineHeight: 1.65,
              color: 'rgba(255,255,255,0.65)',
            }}
          >
            {view.snapshotSummary}
          </p>
        ) : null}
        {view.reviewScheduledAt ? (
          <p
            style={{
              margin: '1rem 0 0',
              fontSize: '0.9rem',
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.75)',
            }}
          >
            Review scheduled:{' '}
            <strong style={{ color: GOLD }}>
              {new Date(view.reviewScheduledAt).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </strong>
          </p>
        ) : null}

        <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
          <Link
            href={`/portal/${slug}/ctp`}
            className="inline-block rounded-full px-5 py-2.5 text-sm font-bold"
            style={{ backgroundColor: GOLD, color: NAVY }}
          >
            Overview
          </Link>
          <Link
            href={`/portal/${slug}/ctp/messages`}
            className="inline-block rounded-full px-5 py-2.5 text-sm font-bold"
            style={{ border: '1px solid rgba(255,255,255,0.35)', color: '#fff' }}
          >
            Messages
          </Link>
          <Link
            href={`/portal/${slug}/ctp/documents`}
            className="inline-block rounded-full px-5 py-2.5 text-sm font-bold"
            style={{ border: '1px solid rgba(255,255,255,0.35)', color: '#fff' }}
          >
            Documents
          </Link>
        </div>

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
            <span>Progress</span>
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
                transition: 'width 0.6s ease',
              }}
            />
          </div>
        </div>

        {view.intakeSummary ? (
          <p
            style={{
              margin: '1rem 0 0',
              fontSize: '0.9rem',
              lineHeight: 1.65,
              color: 'rgba(255,255,255,0.65)',
            }}
          >
            {view.intakeSummary}
          </p>
        ) : null}

        {view.siteUrl ? (
          <p style={{ margin: '1rem 0 0' }}>
            <a
              href={view.siteUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-full px-5 py-2.5 text-sm font-bold"
              style={{ backgroundColor: GOLD, color: NAVY }}
            >
              Open live website
            </a>
          </p>
        ) : null}
      </div>

      {view.productionArtifacts?.length ? (
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
            AI production
          </p>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
            {view.productionHeadline || 'Your solution package'}
          </h2>
          {view.productionStack?.length ? (
            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)' }}>
              Stack: {view.productionStack.join(' · ')}
            </p>
          ) : null}
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.75rem' }}>
            {view.productionArtifacts.map((artifact) => (
              <li
                key={artifact.id}
                style={{
                  border: '1px solid rgba(255,255,255,0.12)',
                  padding: '0.85rem 1rem',
                  background: 'rgba(255,255,255,0.04)',
                }}
              >
                <p style={{ margin: 0, fontWeight: 700, color: '#fff' }}>{artifact.title}</p>
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                  {artifact.summary}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ol className="ctp-timeline" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {view.timeline.map((item, index) => (
          <li
            key={item.id}
            className={`ctp-timeline-step ${stateClass(item.state)}`}
            style={{
              position: 'relative',
              paddingLeft: '2rem',
              paddingBottom: index < view.timeline.length - 1 ? '1.5rem' : 0,
              borderLeft:
                index < view.timeline.length - 1 ? '2px solid rgba(216,173,61,0.25)' : undefined,
              marginLeft: '0.65rem',
            }}
          >
            <span
              aria-hidden
              style={{
                position: 'absolute',
                left: '-0.55rem',
                top: '0.2rem',
                width: '0.85rem',
                height: '0.85rem',
                borderRadius: '9999px',
                backgroundColor:
                  item.state === 'complete'
                    ? GOLD
                    : item.state === 'active'
                      ? GOLD
                      : item.state === 'failed'
                        ? '#e57373'
                        : 'rgba(255,255,255,0.25)',
                boxShadow: item.state === 'active' ? `0 0 0 4px rgba(216,173,61,0.2)` : undefined,
                animation: item.state === 'active' ? 'ctpPulse 1.8s ease-in-out infinite' : undefined,
              }}
            />
            <div className="ep-module-card">
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
                {STATE_LABEL[item.state]}
              </p>
              <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                {item.label}
              </h2>
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.72)' }}>
                {item.detail}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <PortalCtpDesignStudioForm
        slug={slug}
        designStudio={view.designStudio}
        studioStatus={view.studioStatus}
        initial={view.designStudioFields}
      />

      <PortalCtpAssetGallery assets={view.assets} />

      {view.proposalId ? (
        <div className="ep-module-card" style={{ marginTop: '1.25rem' }}>
          <p className="ep-module-card-note" style={{ marginBottom: '0.75rem' }}>
            Your executive brief is ready when you are.
          </p>
          <Link
            href={`/proposal/${encodeURIComponent(view.proposalId)}`}
            className="inline-block rounded-full px-6 py-3 text-sm font-bold"
            style={{ backgroundColor: GOLD, color: NAVY }}
          >
            View executive brief
          </Link>
        </div>
      ) : null}

      <style>{`
        @keyframes ctpPulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(216,173,61,0.15); }
          50% { box-shadow: 0 0 0 8px rgba(216,173,61,0.28); }
        }
      `}</style>
    </PortalSubpage>
  );
}

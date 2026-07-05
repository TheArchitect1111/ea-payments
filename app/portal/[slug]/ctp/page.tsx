import Link from 'next/link';
import { redirect } from 'next/navigation';
import { NAVY, GOLD } from '@/lib/design-system';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import { buildCtpPortalStatusView } from '@/lib/ctp-portal-status';
import type { CtpTimelineStepState } from '@/lib/ctp-portal-status';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';
import PortalCtpAssetGallery from '@/app/portal/components/PortalCtpAssetGallery';

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
      kicker="Consider the Possibilities™"
      title="Your discovery journey"
      lede="Follow workspace, studio, and review progress — everything we are building from your discovery conversation."
    >
      <div className="ep-module-card" style={{ marginBottom: '1.25rem' }}>
        <p className="ep-module-card-note" style={{ marginBottom: '0.35rem' }}>
          {view.businessName} · Submitted {submittedDate}
        </p>
        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.78)' }}>
          Current status: <strong>{view.status}</strong>
        </p>
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
      </div>

      <ol className="ctp-timeline" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {view.timeline.map((step, index) => (
          <li
            key={step.id}
            className={`ctp-timeline-step ${stateClass(step.state)}`}
            style={{
              position: 'relative',
              paddingLeft: '2rem',
              paddingBottom: index < view.timeline.length - 1 ? '1.5rem' : 0,
              borderLeft: index < view.timeline.length - 1 ? '2px solid rgba(216,173,61,0.25)' : undefined,
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
                  step.state === 'complete'
                    ? GOLD
                    : step.state === 'active'
                      ? GOLD
                      : step.state === 'failed'
                        ? '#e57373'
                        : 'rgba(255,255,255,0.25)',
                boxShadow: step.state === 'active' ? `0 0 0 4px rgba(216,173,61,0.2)` : undefined,
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
                {STATE_LABEL[step.state]}
              </p>
              <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                {step.label}
              </h2>
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.72)' }}>
                {step.detail}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <PortalCtpAssetGallery assets={view.assets} />

      {view.proposalId ? (
        <div className="ep-module-card" style={{ marginTop: '1.25rem' }}>
          <p className="ep-module-card-note" style={{ marginBottom: '0.75rem' }}>
            Your blueprint is ready when you are.
          </p>
          <Link
            href={`/proposal/${encodeURIComponent(view.proposalId)}`}
            className="inline-block rounded-full px-6 py-3 text-sm font-bold"
            style={{ backgroundColor: GOLD, color: NAVY }}
          >
            View blueprint
          </Link>
        </div>
      ) : null}
    </PortalSubpage>
  );
}

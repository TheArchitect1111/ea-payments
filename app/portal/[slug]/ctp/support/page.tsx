import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import PortalCtpFaqSection from '@/app/portal/components/PortalCtpFaqSection';
import { buildCtpSupportView } from '@/lib/ctp-support-view';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';
import { designStudioPath } from '@/lib/ctp-opportunity-routes';
import { CX_EMOTION } from '@/lib/ctp-emotional-copy';

export const dynamic = 'force-dynamic';

export default async function PortalCtpSupportPage({
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

  const view = buildCtpSupportView(submission, slug, {
    pagePath: `/portal/${slug}/ctp/support`,
  });
  const { guide } = view;
  const progressHref = designStudioPath(slug);
  const primary = view.actions.find((action) => action.primary) ?? view.actions[0];

  return (
    <PortalSubpage
      slug={slug}
      active="ctp"
      clientNavActive="support"
      kicker="Help"
      title="Help"
      lede={CX_EMOTION.help.lede}
    >
      <div className="cex-concierge">
        <section className="cex-concierge-panel" aria-labelledby="help-heading">
          <p className="cex-concierge-kicker">
            {view.businessName}
            {view.clientTypeLabel ? ` · ${view.clientTypeLabel}` : ''}
            {` · ${guide.currentStage}`}
          </p>
          <h2 id="help-heading" className="cex-concierge-title">
            {view.headline}
          </h2>
          <p className="cex-concierge-body">{view.summary}</p>
          {primary ? (
            <p style={{ margin: '1rem 0 0' }}>
              <a
                href={primary.href}
                className="cex-concierge-cta"
                target={primary.external ? '_blank' : undefined}
                rel={primary.external ? 'noreferrer' : undefined}
              >
                {primary.title}
              </a>
            </p>
          ) : null}
        </section>

        <section className="cex-concierge-panel" aria-labelledby="help-how">
          <p id="help-how" className="cex-concierge-kicker">
            How to reach us
          </p>
          <p className="cex-concierge-meta" style={{ marginTop: 0 }}>
            <strong>Email:</strong>{' '}
            <a href={view.helpMailto}>{view.supportEmail}</a>
          </p>
          <p className="cex-concierge-meta">
            <strong>Hours:</strong> {view.supportHours}
          </p>
          <p className="cex-concierge-meta">
            <strong>Response time:</strong> {view.supportResponse}
          </p>
          <p className="cex-concierge-meta">{view.supportUrgent}</p>
          <p className="cex-concierge-meta">
            When you email, we already include your client name, portal, and current project stage —
            you don’t need to re-explain.
          </p>
        </section>

        <section className="cex-concierge-panel" aria-labelledby="help-context">
          <p id="help-context" className="cex-concierge-kicker">
            Your project context
          </p>
          <p className="cex-concierge-meta" style={{ marginTop: 0 }}>
            <strong>Where you are:</strong> {guide.currentStage}
          </p>
          <p className="cex-concierge-meta">
            <strong>What happens next:</strong> {guide.nbaLabel}
          </p>
          <p className="cex-concierge-meta">{guide.nbaWhy}</p>
          {guide.recentMilestones.length ? (
            <p className="cex-concierge-meta">
              <strong>Recent milestones:</strong> {guide.recentMilestones.join(' · ')}
            </p>
          ) : null}
          <p className="cex-concierge-meta">
            <strong>From you:</strong> {guide.pendingActions.join(' · ')}
          </p>
          <p className="cex-concierge-meta">{guide.behindTheScenes}</p>
          <p className="cex-concierge-meta">{guide.confidenceMessage}</p>
        </section>

        <PortalCtpFaqSection />

        <ul className="cex-concierge-list">
          {view.actions.map((action) => (
            <li key={action.id} className="cex-concierge-item">
              <a
                href={action.href}
                target={action.external ? '_blank' : undefined}
                rel={action.external ? 'noreferrer' : undefined}
              >
                <p className="cex-concierge-item-title">{action.title}</p>
                <p className="cex-concierge-item-detail">{action.detail}</p>
              </a>
            </li>
          ))}
        </ul>

        <div className="cex-concierge-actions">
          <Link href={progressHref} className="cex-concierge-cta">
            Back to Your Project
          </Link>
          <Link href={`/portal/${slug}/ctp/documents`} className="cex-concierge-cta-secondary">
            Documents
          </Link>
        </div>
      </div>
    </PortalSubpage>
  );
}

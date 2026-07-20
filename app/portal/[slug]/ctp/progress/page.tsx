import { redirect } from 'next/navigation';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import { buildCtpPortalStatusView } from '@/lib/ctp-portal-status';
import { buildGuideProgressView } from '@/lib/ctp-guide-progress';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';
import PortalCtpAssetGallery from '@/app/portal/components/PortalCtpAssetGallery';
import PortalCtpDesignStudioForm from '@/app/portal/components/PortalCtpDesignStudioForm';
import '@/app/portal/components/guide-progress.css';

export const dynamic = 'force-dynamic';

/**
 * Guide home (Progress) — Guide Operating System presentation.
 * Auth, routing, and submission reads unchanged.
 */
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

  const statusView = buildCtpPortalStatusView(submission);
  const guide = buildGuideProgressView(slug, statusView);

  return (
    <PortalSubpage
      slug={slug}
      active="ctp"
      clientNavActive="progress"
      kicker="Your Project"
      title="Your Project"
      lede="Here's where your project stands today."
    >
      <div className="guide-progress">
        <section className="guide-progress-stage" aria-labelledby="guide-current-stage">
          <p className="guide-progress-stage-label">Where you are</p>
          <h2 id="guide-current-stage" className="guide-progress-stage-name">
            {guide.currentStage}
          </h2>
          <p className="guide-progress-stage-why">{guide.stageWhy}</p>
          {guide.estimatedCompletion ? (
            <p className="guide-progress-eta">{guide.estimatedCompletion}</p>
          ) : null}
        </section>

        <section className="guide-progress-nba" aria-labelledby="guide-nba-heading">
          <p id="guide-nba-heading" className="guide-progress-nba-label">
            What you need to do
          </p>
          <a
            href={guide.nba.href}
            className="guide-progress-nba-cta"
            target={guide.nba.external ? '_blank' : undefined}
            rel={guide.nba.external ? 'noreferrer' : undefined}
          >
            {guide.nba.label}
          </a>
          <p className="guide-progress-nba-why">
            <strong>Why it matters:</strong> {guide.nba.why}
          </p>
          <p className="guide-progress-nba-meta">
            <strong>Time:</strong> {guide.nba.duration}
            <br />
            <strong>After this:</strong> {guide.nba.after}
          </p>
        </section>

        <section className="guide-progress-section" aria-labelledby="guide-milestones-heading">
          <h2 id="guide-milestones-heading" className="guide-progress-section-title">
            What has already happened
          </h2>
          {guide.completed.length ? (
            <ul className="guide-progress-milestones">
              {guide.completed.map((item) => (
                <li key={item.stage} className="guide-progress-milestone">
                  <details>
                    <summary>{item.title}</summary>
                    <p>{item.explanation}</p>
                  </details>
                </li>
              ))}
            </ul>
          ) : (
            <p className="guide-progress-empty">
              You&apos;re at the beginning — Welcome is underway. Everything ahead will show
              here as we complete it together.
            </p>
          )}
        </section>

        <section className="guide-progress-section" aria-labelledby="guide-behind-heading">
          <h2 id="guide-behind-heading" className="guide-progress-section-title">
            What is happening now
          </h2>
          <div className="guide-progress-panel">
            <p>{guide.behindTheScenes}</p>
          </div>
        </section>

        <section className="guide-progress-section" aria-labelledby="guide-next-heading">
          <h2 id="guide-next-heading" className="guide-progress-section-title">
            What happens next
          </h2>
          <div className="guide-progress-panel">
            <p>
              {guide.whatsNextStage ? (
                <>
                  <strong>{guide.whatsNextStage}.</strong> {guide.whatsNextCopy}
                </>
              ) : (
                guide.whatsNextCopy
              )}
            </p>
          </div>
        </section>

        {guide.showDesignStudio ? (
          <section
            id="design-studio"
            className="guide-progress-section"
            aria-label="Design"
          >
            <PortalCtpDesignStudioForm
              slug={slug}
              designStudio={statusView.designStudio}
              studioStatus={statusView.studioStatus}
              initial={statusView.designStudioFields}
            />
            <PortalCtpAssetGallery assets={statusView.assets} />
          </section>
        ) : null}
      </div>
    </PortalSubpage>
  );
}

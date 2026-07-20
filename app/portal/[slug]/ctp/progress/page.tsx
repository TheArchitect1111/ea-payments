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
 * Guide home — orchestrated from project state (stage engine + intelligence).
 * Structure unchanged; messaging and NBA recalculate automatically.
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
          <p className="guide-progress-stage-why">
            <strong>{guide.headline}</strong>
          </p>
          <p className="guide-progress-stage-why">{guide.summary}</p>
          {guide.celebrationMessage ? (
            <p className="guide-progress-eta">
              <strong>{guide.celebrationMessage}</strong>
            </p>
          ) : null}
          {guide.estimatedCompletion ? (
            <p className="guide-progress-eta">
              <strong>Typical timing:</strong> {guide.estimatedCompletion}
            </p>
          ) : null}
          <p className="guide-progress-eta">{guide.confidenceMessage}</p>
        </section>

        <section className="guide-progress-nba" aria-labelledby="guide-nba-heading">
          <p id="guide-nba-heading" className="guide-progress-nba-label">
            {guide.nba.nothingRequired ? 'Nothing needed from you' : 'What you need to do'}
          </p>
          {guide.nba.nothingRequired ? (
            <p className="guide-progress-nba-why" style={{ marginTop: 0 }}>
              {guide.nba.label}. {guide.nba.why}
            </p>
          ) : guide.nba.href ? (
            <a
              href={guide.nba.href}
              className="guide-progress-nba-cta"
              target={guide.nba.external ? '_blank' : undefined}
              rel={guide.nba.external ? 'noreferrer' : undefined}
            >
              {guide.nba.label}
            </a>
          ) : (
            <p className="guide-progress-nba-why" style={{ marginTop: 0 }}>
              {guide.nba.label}
            </p>
          )}
          {!guide.nba.nothingRequired ? (
            <>
              <p className="guide-progress-nba-why">
                <strong>Why it matters:</strong> {guide.nba.why}
              </p>
              <p className="guide-progress-nba-meta">
                <strong>Time:</strong> {guide.nba.duration}
                <br />
                <strong>After this:</strong> {guide.nba.after}
              </p>
            </>
          ) : (
            <p className="guide-progress-nba-meta">
              <strong>After this:</strong> {guide.nba.after}
              {guide.nba.href ? (
                <>
                  <br />
                  <a href={guide.nba.href} style={{ color: 'rgba(216,173,61,0.95)' }}>
                    Message your team if a question comes up
                  </a>
                </>
              ) : null}
            </p>
          )}
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
                    <p>
                      <strong>What happened:</strong> {item.whatHappened}
                    </p>
                    <p>
                      <strong>Why it matters:</strong> {item.whyItMatters}
                    </p>
                    <p>
                      <strong>What it unlocked:</strong> {item.whatItUnlocked}
                    </p>
                    <p>
                      <strong>What happens next:</strong> {item.whatHappensNext}
                    </p>
                  </details>
                </li>
              ))}
            </ul>
          ) : (
            <p className="guide-progress-empty">
              You&apos;re at the beginning — Welcome is underway. Completed milestones will
              appear here as we finish them together.
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
            {guide.documentsAvailable.length ? (
              <p style={{ marginTop: 12 }}>
                <strong>Available to you:</strong>{' '}
                {guide.documentsAvailable.map((doc, index) => (
                  <span key={doc.label}>
                    {index > 0 ? ' · ' : null}
                    {doc.href ? (
                      <a href={doc.href} style={{ color: 'rgba(216,173,61,0.95)' }}>
                        {doc.label}
                      </a>
                    ) : (
                      doc.label
                    )}
                  </span>
                ))}
              </p>
            ) : null}
          </div>
        </section>

        {guide.commonQuestions.length ? (
          <section className="guide-progress-section" aria-labelledby="guide-faq-heading">
            <h2 id="guide-faq-heading" className="guide-progress-section-title">
              Common questions
            </h2>
            <ul className="guide-progress-milestones">
              {guide.commonQuestions.map((item) => (
                <li key={item.question} className="guide-progress-milestone">
                  <details>
                    <summary>{item.question}</summary>
                    <p>{item.answer}</p>
                  </details>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

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

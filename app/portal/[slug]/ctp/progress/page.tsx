import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import { buildCtpPortalStatusView } from '@/lib/ctp-portal-status';
import { buildGuideProgressView } from '@/lib/ctp-guide-progress';
import {
  buildGuideArrival,
  buildGuideStorySoFar,
  guideOutcomeSentence,
  projectMomentFromMilestone,
} from '@/lib/ctp-guide-presentation';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';
import {
  absoluteCtpAssetUrl,
  pickCtpLogoEntry,
} from '@/lib/ctp-brand-bridge';
import { portalCtpPath } from '@/lib/ctp-opportunity-routes';
import { stageVisualFor } from '@/lib/ctp-stage-visuals';
import PortalCtpAssetGallery from '@/app/portal/components/PortalCtpAssetGallery';
import PortalCtpDesignStudioForm from '@/app/portal/components/PortalCtpDesignStudioForm';
import { CX_EMOTION } from '@/lib/ctp-emotional-copy';

export const dynamic = 'force-dynamic';

/**
 * Guide home — orchestrated from project state (stage engine + intelligence).
 * Presentation refined for outcome-first storytelling; Guide remains SSOT.
 */
export default async function PortalCtpStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
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
  const visual = stageVisualFor(guide.currentStage);
  const outcome = guideOutcomeSentence(guide);
  const story = buildGuideStorySoFar(guide);

  const meetingConfirmed =
    query.meeting === 'confirmed' ||
    (Array.isArray(query.meeting) && query.meeting[0] === 'confirmed');
  const paymentSuccess =
    query.payment === 'success' ||
    (Array.isArray(query.payment) && query.payment[0] === 'success');
  const returnCelebration = meetingConfirmed
    ? 'You’re scheduled — thank you. We’ve updated your project and prepared what comes next.'
    : paymentSuccess
      ? 'Your confirmation is received. We’ve updated your project and prepared Design.'
      : guide.celebrationMessage;

  const firstName = (
    submission.contactName ||
    client.clientName ||
    session.email ||
    ''
  )
    .trim()
    .split(/\s+/)[0];

  const arrival = buildGuideArrival(guide, {
    firstName: firstName || undefined,
    celebration: returnCelebration,
  });

  const orgName =
    submission.businessName?.trim() ||
    client.clientName?.trim() ||
    'Your organization';
  const logoEntry = pickCtpLogoEntry(submission.assetManifest);
  const logoUrl = logoEntry?.url ? absoluteCtpAssetUrl(logoEntry.url) : null;
  const initials = orgName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  const journeyHref = portalCtpPath(slug, 'ctp');
  const stageSlug = guide.currentStage.toLowerCase().replace(/\s+/g, '-');

  return (
    <PortalSubpage
      slug={slug}
      active="ctp"
      clientNavActive="progress"
      kicker="Your Project"
      title="Your Project"
      lede={CX_EMOTION.yourProject.lede}
      hideWelcome
      hideBackLink
    >
      <div className="guide-progress" data-stage={stageSlug}>
        <header className="guide-progress-opening" aria-labelledby="guide-status-sentence">
          <div className="guide-progress-opening-media">
            <img
              src={visual.src}
              alt={visual.alt}
              className="guide-progress-opening-photo"
              loading="eager"
              decoding="async"
            />
            <div className="guide-progress-opening-shade" aria-hidden />
          </div>
          <div className="guide-progress-opening-inner">
            <div className="guide-progress-opening-top">
              {logoUrl ? (
                <img src={logoUrl} alt="" className="guide-progress-logo" />
              ) : (
                <span className="guide-progress-logo-fallback" aria-hidden>
                  {initials || 'EA'}
                </span>
              )}
              <div>
                <p className="guide-progress-opening-kicker">Your Project · {orgName}</p>
                <p className="guide-progress-opening-caption">
                  <span className="guide-progress-stage-name">Where you are: {guide.currentStage}</span>
                </p>
              </div>
            </div>

            {arrival.line ? (
              <p className="guide-progress-arrival">{arrival.line}</p>
            ) : null}

            <h1 id="guide-status-sentence" className="guide-progress-status-sentence">
              {outcome}
            </h1>
            <p className="guide-progress-opening-org">
              Prepared for you by Efficiency Architects
            </p>
          </div>
        </header>

        {story.show ? (
          <section
            className="guide-progress-story-so-far"
            aria-labelledby="guide-story-heading"
          >
            <h2 id="guide-story-heading" className="guide-progress-story-heading">
              Story so far
            </h2>
            <dl className="guide-progress-story-triad">
              {story.previously ? (
                <div className="guide-progress-story-beat">
                  <dt>Previously</dt>
                  <dd>{story.previously}</dd>
                </div>
              ) : null}
              <div className="guide-progress-story-beat">
                <dt>Now</dt>
                <dd>
                  <span className="guide-progress-sr-label">What is happening now. </span>
                  {story.now}
                </dd>
              </div>
              <div className="guide-progress-story-beat">
                <dt>Next</dt>
                <dd>
                  <span className="guide-progress-sr-label">What happens next. </span>
                  {story.next}
                </dd>
              </div>
            </dl>
          </section>
        ) : null}

        <section className="guide-progress-nba" aria-labelledby="guide-nba-heading">
          <p id="guide-nba-heading" className="guide-progress-nba-label">
            {guide.nba.nothingRequired ? "You're all set" : 'What you need to do'}
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
              We&apos;ll let you know when the next step is ready.
              {guide.nba.href ? (
                <>
                  <br />
                  <a href={guide.nba.href}>Message your team if a question comes up</a>
                </>
              ) : null}
            </p>
          )}
        </section>

        {guide.documentsAvailable.length ? (
          <p className="guide-progress-ready-docs">
            <strong>Ready for you:</strong>{' '}
            {guide.documentsAvailable.map((doc, index) => (
              <span key={doc.label}>
                {index > 0 ? ' · ' : null}
                {doc.href ? <a href={doc.href}>{doc.label}</a> : doc.label}
              </span>
            ))}
          </p>
        ) : null}

        {guide.completed.length ? (
          <section
            className="guide-progress-section guide-progress-moments"
            aria-labelledby="guide-milestones-heading"
          >
            <details className="guide-progress-moments-details">
              <summary id="guide-milestones-heading">What has already happened</summary>
              <ul className="guide-progress-milestones">
                {guide.completed.map((item) => (
                  <li key={item.stage} className="guide-progress-milestone">
                    <p className="guide-progress-moment-title">{item.title}</p>
                    <p className="guide-progress-moment-body">
                      {projectMomentFromMilestone(item)}
                    </p>
                  </li>
                ))}
              </ul>
            </details>
          </section>
        ) : null}

        {guide.commonQuestions.length ? (
          <section className="guide-progress-section" aria-labelledby="guide-faq-heading">
            <details className="guide-progress-moments-details">
              <summary id="guide-faq-heading">Common questions</summary>
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
            </details>
          </section>
        ) : null}

        <p>
          <Link href={journeyHref} className="guide-progress-journey-link">
            See your full journey
          </Link>
        </p>

        {guide.showDesignStudio ? (
          <section
            id="design-studio"
            className="guide-progress-section"
            aria-label="Design"
          >
            <PortalCtpDesignStudioForm
              slug={slug}
              experienceMode
              designStudio={statusView.designStudio}
              studioStatus={statusView.studioStatus}
              initial={statusView.designStudioFields}
            />
            <PortalCtpAssetGallery assets={statusView.assets} experienceMode />
          </section>
        ) : null}
      </div>
    </PortalSubpage>
  );
}

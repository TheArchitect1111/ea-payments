import type { AmplifiPortalExperience } from '@/lib/amplifi-portal';

export default function AmplifiPortalExperience({
  experience,
  slug,
  loadError,
}: {
  experience: AmplifiPortalExperience;
  slug: string;
  loadError?: string | null;
}) {
  const base = `/portal/${slug}`;
  const simplifiHref = `${base}/simplifi`;
  const { theme } = experience;
  const hasStories = experience.captureCount > 0 && Boolean(experience.magnifiUrl);

  if (loadError) {
    return (
      <div className="ea-amplifi-page">
        <section className="ea-amplifi-panel ea-amplifi-state ea-amplifi-state-error" role="alert">
          <p className="ea-amplifi-label" style={{ color: theme.accent }}>
            Amplifi™
          </p>
          <h1 className="ea-amplifi-state-title">We could not load your stories</h1>
          <p className="ea-amplifi-copy">{loadError}</p>
          <div className="ea-amplifi-cta-actions ea-amplifi-cta-actions-inline">
            <a href={`${base}/amplifi`} className="ea-amplifi-btn ea-amplifi-btn-ink">
              Try again
            </a>
            <a href={simplifiHref} className="ea-amplifi-btn ea-amplifi-btn-ink-outline">
              Open Simplifi
            </a>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="ea-amplifi-page">
      <section
        className="ea-amplifi-reveal"
        style={{
          background: `linear-gradient(135deg, ${theme.revealFrom} 0%, ${theme.revealVia} 55%, ${theme.revealTo} 100%)`,
        }}
      >
        <p className="ea-amplifi-kicker" style={{ color: theme.accent }}>
          {experience.modeLabel}
        </p>
        <h1>
          {experience.headline}
          <span>{experience.headlineAccent}</span>
        </h1>
        <p className="ea-amplifi-lede">{experience.lede}</p>
      </section>

      {!hasStories ? (
        <section className="ea-amplifi-panel ea-amplifi-state ea-amplifi-state-empty">
          <p className="ea-amplifi-label" style={{ color: theme.accent }}>
            Get started
          </p>
          <h2 className="ea-amplifi-state-title">No Magnifi stories yet</h2>
          <p className="ea-amplifi-copy">
            Capture an opportunity in Simplifi, or use Amplifi Search with a topic and date range to gather articles,
            news, and videos — then draft and store posts for approval. Nothing auto-publishes.
          </p>
          <div className="ea-amplifi-cta-actions ea-amplifi-cta-actions-inline">
            <a
              href={simplifiHref}
              className="ea-amplifi-btn ea-amplifi-btn-ink"
              style={{ backgroundColor: theme.ctaFrom, borderColor: theme.ctaFrom }}
            >
              Capture once to create your first story
            </a>
            <a href="/amplifi" className="ea-amplifi-btn ea-amplifi-btn-ink-outline">
              Open Amplifi Search
            </a>
          </div>
        </section>
      ) : null}

      {hasStories ? (
        <>
          <section className="ea-amplifi-panel">
            <p className="ea-amplifi-label" style={{ color: theme.accent }}>
              Your journey
            </p>
            <div className="ea-amplifi-steps">
              {experience.journey.map((step, index) => (
                <div key={step.title} className="ea-amplifi-step" style={{ animationDelay: `${index * 0.08}s` }}>
                  <div className="ea-amplifi-step-num" style={{ backgroundColor: theme.accent, color: '#1B2B4D' }}>
                    {index + 1}
                  </div>
                  <div>
                    <h2>{step.title}</h2>
                    <p>{step.copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="ea-amplifi-panel">
            <p className="ea-amplifi-label" style={{ color: theme.accent }}>
              What we see today
            </p>
            <div className="ea-amplifi-stat-grid">
              {experience.stats.map((stat) => (
                <div key={stat.label} className="ea-amplifi-stat">
                  <strong>{stat.value}</strong>
                  <span>{stat.detail}</span>
                </div>
              ))}
            </div>
            <p className="ea-amplifi-copy">{experience.insightCopy}</p>
            {experience.latestCaptureTitle ? (
              <p className="ea-amplifi-copy mt-4 text-sm">
                Latest story: <strong>{experience.latestCaptureTitle}</strong>
              </p>
            ) : null}
            <p className="ea-amplifi-copy mt-4 text-sm ea-amplifi-public-warn">
              Anyone with the link can view this story.
            </p>
          </section>

          <section className="ea-amplifi-panel">
            <p className="ea-amplifi-label" style={{ color: theme.accent }}>
              {experience.futureTitle}
            </p>
            <h2 className="ea-amplifi-future-title">Imagine this.</h2>
            <ul className="ea-amplifi-future-list">
              {experience.futureBullets.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        </>
      ) : null}

      <section
        className="ea-amplifi-cta"
        style={{ background: `linear-gradient(135deg, ${theme.ctaFrom} 0%, ${theme.ctaTo} 100%)` }}
      >
        <p>{experience.ctaLine}</p>
        <p className="ea-amplifi-disclaimer">{experience.shareDisclaimer}</p>
        <div className="ea-amplifi-cta-actions">
          {!hasStories ? (
            <a
              href={simplifiHref}
              className="ea-amplifi-btn ea-amplifi-btn-primary"
              style={{ color: theme.ctaFrom }}
            >
              Capture once to create your first story
            </a>
          ) : (
            <>
              <a
                href={experience.magnifiUrl}
                className="ea-amplifi-btn ea-amplifi-btn-primary"
                style={{ color: theme.ctaFrom }}
              >
                Open latest Magnifi story
              </a>
              <a href={experience.draftShareUrl ?? '/amplifi'} className="ea-amplifi-btn ea-amplifi-btn-secondary">
                Review draft before posting
              </a>
              <a href="/amplifi" className="ea-amplifi-btn ea-amplifi-btn-secondary">
                Amplifi Search (topic + dates)
              </a>
            </>
          )}
          {!hasStories ? (
            <a href="/amplifi" className="ea-amplifi-btn ea-amplifi-btn-secondary">
              Amplifi Search (topic + dates)
            </a>
          ) : null}
          <a href={base} className="ea-amplifi-btn ea-amplifi-btn-secondary">
            Portal home
          </a>
          {hasStories ? (
            <a href={simplifiHref} className="ea-amplifi-btn ea-amplifi-btn-secondary">
              Open Simplifi
            </a>
          ) : null}
          {experience.guidanceUrl ? (
            <a href={experience.guidanceUrl} className="ea-amplifi-btn ea-amplifi-btn-secondary">
              Simplifi guidance
            </a>
          ) : null}
        </div>
      </section>
    </div>
  );
}

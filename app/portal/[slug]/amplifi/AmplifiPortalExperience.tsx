import type { AmplifiPortalExperience } from '@/lib/amplifi-portal';

export default function AmplifiPortalExperience({ experience, slug }: { experience: AmplifiPortalExperience; slug: string }) {
  const base = `/portal/${slug}`;
  const { theme } = experience;

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
        {experience.latestCaptureTitle && (
          <p className="ea-amplifi-copy mt-4 text-sm">
            Latest capture: <strong>{experience.latestCaptureTitle}</strong>
          </p>
        )}
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

      <section
        className="ea-amplifi-cta"
        style={{ background: `linear-gradient(135deg, ${theme.ctaFrom} 0%, ${theme.ctaTo} 100%)` }}
      >
        <p>{experience.ctaLine}</p>
        <div className="ea-amplifi-cta-actions">
          <a href="/amplifi" className="ea-amplifi-btn ea-amplifi-btn-primary" style={{ color: theme.ctaFrom }}>
            Create social post
          </a>
          <a href={base} className="ea-amplifi-btn ea-amplifi-btn-secondary">
            Portal home
          </a>
          <a href={`${base}/simplifi`} className="ea-amplifi-btn ea-amplifi-btn-secondary">
            Open Simplifi
          </a>
          {experience.magnifiUrl && (
            <a href={experience.magnifiUrl} className="ea-amplifi-btn ea-amplifi-btn-secondary">
              Magnifi experience
            </a>
          )}
          {experience.guidanceUrl && (
            <a href={experience.guidanceUrl} className="ea-amplifi-btn ea-amplifi-btn-secondary">
              Simplifi guidance
            </a>
          )}
        </div>
      </section>
    </div>
  );
}

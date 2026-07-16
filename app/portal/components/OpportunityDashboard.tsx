import Link from 'next/link';
import type { CtpOpportunityDashboardView } from '@/lib/ctp-opportunity-view';
import { NAVY, GOLD } from '@/lib/design-system';
import './opportunity-experience.css';

const RANK_MEDAL: Record<1 | 2 | 3, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

function Stars({ count }: { count: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(count)));
  return (
    <span className="oe-stars" aria-label={`${filled} out of 5 stars`}>
      {'★'.repeat(filled)}
      <span className="oe-stars-empty">{'☆'.repeat(5 - filled)}</span>
    </span>
  );
}

function money(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n);
}

export default function OpportunityDashboard({ view }: { view: CtpOpportunityDashboardView }) {
  return (
    <div className="oe-report">
      <header className="oe-hero">
        <p className="oe-greeting">{view.greeting}</p>
        <h2 className="oe-hero-title">We&apos;ve completed your initial opportunity analysis.</h2>
        <p className="oe-hero-lede">Here&apos;s what we discovered.</p>
      </header>

      <section className="oe-section" aria-labelledby="oe-snapshot">
        <h3 id="oe-snapshot" className="oe-section-title">
          Executive Snapshot
        </h3>
        <div className="oe-snapshot-grid">
          <div className="oe-metric">
            <p className="oe-metric-label">Overall Readiness</p>
            <p className="oe-metric-value">
              {view.readinessScore != null ? (
                <>
                  {view.readinessScore}
                  <span className="oe-metric-unit"> / 100</span>
                </>
              ) : (
                'In progress'
              )}
            </p>
          </div>
          <div className="oe-metric">
            <p className="oe-metric-label">Opportunity Rating</p>
            <p className="oe-metric-value">
              <Stars count={view.opportunityStars} />
            </p>
            <p className="oe-metric-sub">{view.potentialLabel}</p>
          </div>
        </div>
        <p className="oe-narrative oe-snapshot-summary">{view.executiveSummary}</p>
      </section>

      <section className="oe-section" aria-labelledby="oe-progress">
        <h3 id="oe-progress" className="oe-section-title">
          Progress Tracker
        </h3>
        <ul className="oe-progress-list">
          {view.progress.map((step) => (
            <li key={step.id} className={`oe-progress-item oe-progress-${step.state}`}>
              <div className="oe-progress-label-row">
                <span className="oe-progress-label">{step.label}</span>
                <span className="oe-progress-pct">{step.fill}%</span>
              </div>
              <div
                className="oe-progress-track"
                role="progressbar"
                aria-valuenow={step.fill}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={step.label}
              >
                <div className="oe-progress-fill" style={{ width: `${step.fill}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="oe-section" aria-labelledby="oe-summary">
        <h3 id="oe-summary" className="oe-section-title">
          Opportunity Summary
        </h3>
        <p className="oe-narrative">{view.executiveSummary}</p>
      </section>

      <section className="oe-section" aria-labelledby="oe-top">
        <h3 id="oe-top" className="oe-section-title">
          Top Three Opportunities
        </h3>
        {view.opportunities.length > 0 ? (
          <div className="oe-opp-grid">
            {view.opportunities.map((opp) => (
              <Link key={opp.id} href={opp.href} className="oe-opp-card">
                <p className="oe-opp-rank" aria-hidden>
                  {RANK_MEDAL[opp.rank]}
                </p>
                <h4 className="oe-opp-title">{opp.title}</h4>
                <p className="oe-opp-impact-label">Estimated Impact</p>
                <Stars count={opp.impactStars} />
                <p className="oe-opp-summary">{opp.summary}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="oe-section-lede">
            Your personalized opportunity cards will appear here as our analysis completes. Check
            back soon — or schedule your Opportunity Review when you are ready.
          </p>
        )}
      </section>

      {view.healthAreas.length > 0 ? (
        <section className="oe-section" aria-labelledby="oe-health">
          <h3 id="oe-health" className="oe-section-title">
            Business Health
          </h3>
          <div className="oe-health-grid">
            {view.healthAreas.map((area) => (
              <Link key={area.id} href={area.href} className="oe-health-card">
                <p className="oe-health-label">{area.label}</p>
                <p className="oe-health-score">
                  {area.score}
                  <span className="oe-health-unit"> / 100</span>
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="oe-section" aria-labelledby="oe-bench">
        <h3 id="oe-bench" className="oe-section-title">
          Benchmarks
        </h3>
        <div className="oe-benchmark">
          <p>
            Organizations similar to yours typically score:{' '}
            <strong className="oe-bench-placeholder">Coming soon</strong>
          </p>
          <p>
            Organizations implementing similar recommendations average:{' '}
            <strong className="oe-bench-placeholder">Coming soon</strong>
          </p>
          <p className="oe-bench-note">
            Benchmark comparisons will appear here once enough anonymized results are available. We do
            not invent comparison numbers.
          </p>
        </div>
      </section>

      <section className="oe-section" aria-labelledby="oe-foundation">
        <h3 id="oe-foundation" className="oe-section-title">
          Recommended Digital Foundation
        </h3>
        <div className="oe-foundation-grid">
          {view.foundation.map((card) => (
            <article key={card.id} className="oe-foundation-card">
              <p className="oe-foundation-status">{card.status}</p>
              <h4 className="oe-foundation-title">{card.title}</h4>
              <p className="oe-foundation-why">{card.why}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="oe-section" aria-labelledby="oe-preview">
        <h3 id="oe-preview" className="oe-section-title">
          Project Preview
        </h3>
        <p className="oe-section-lede">A first look at the experience we recommend building together.</p>
        <div className="oe-preview-grid">
          {view.projectPreview.map((block) => (
            <div key={block.id} className="oe-wireframe">
              <p className="oe-wireframe-title">{block.title}</p>
              <ul className="oe-wireframe-pages">
                {block.pages.map((page) => (
                  <li key={page}>
                    <span className="oe-wireframe-block" />
                    {page}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="oe-section" aria-labelledby="oe-invest">
        <h3 id="oe-invest" className="oe-section-title">
          Estimated Investment
        </h3>
        {view.investment.mode === 'assessment' ? (
          <div className="oe-invest">
            {view.investment.label ? <p className="oe-invest-label">{view.investment.label}</p> : null}
            <p className="oe-invest-range">
              {money(view.investment.low)} – {money(view.investment.high)}
            </p>
            <p className="oe-section-lede">
              Investment depends on features and functionality. Every project includes a professional
              website experience and a private management portal.
            </p>
          </div>
        ) : (
          <div className="oe-invest">
            <p className="oe-section-lede">
              Typical investment ranges help set expectations before your Opportunity Review. Final
              investment depends on features and functionality.
            </p>
            <table className="oe-table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Typical Investment</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Nonprofit Organizations</td>
                  <td>Starting at $997</td>
                </tr>
                <tr>
                  <td>Businesses &amp; Organizations</td>
                  <td>Starting at $1,497</td>
                </tr>
                <tr>
                  <td>Larger Multi-System Projects</td>
                  <td>Custom Proposal</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="oe-cta-block">
        <Link
          href={view.reviewHref}
          className="oe-cta-primary"
          style={{ backgroundColor: GOLD, color: NAVY }}
        >
          {view.primaryCtaLabel}
        </Link>
        <p className="oe-cta-alt">
          <Link href={view.reviewHref}>Walk Me Through My Recommendations</Link>
        </p>
        {view.showDesignStudio ? (
          <p className="oe-cta-secondary">
            When you&apos;re ready to share brand materials:{' '}
            <Link href={view.designStudioHref}>Open Design Studio</Link>
          </p>
        ) : null}
      </section>

      <nav className="oe-utilities" aria-label="More tools">
        {view.utilities.map((u) => (
          <Link key={u.href} href={u.href}>
            {u.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

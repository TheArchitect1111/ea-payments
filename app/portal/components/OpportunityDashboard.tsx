import Link from 'next/link';
import type { CtpOpportunityDashboardView } from '@/lib/ctp-opportunity-view';
import { NAVY, GOLD } from '@/lib/design-system';
import './opportunity-experience.css';

function JourneyMark({ state }: { state: 'complete' | 'active' | 'pending' }) {
  if (state === 'complete') return <span aria-hidden>✅</span>;
  if (state === 'active') return <span aria-hidden>🟡</span>;
  return <span aria-hidden className="oe-journey-dot">○</span>;
}

export default function OpportunityDashboard({ view }: { view: CtpOpportunityDashboardView }) {
  return (
    <div className="oe-report oe-workspace">
      <header className="oe-hero">
        <h2 className="oe-greeting">{view.greeting}</h2>
        <p className="oe-hero-lede">{view.welcomeLede}</p>
      </header>

      <section className="oe-section" aria-labelledby="oe-snapshot">
        <h3 id="oe-snapshot" className="oe-section-title">
          Executive Snapshot
        </h3>
        <div className="oe-snapshot-list">
          <div className="oe-snapshot-row">
            <span>Organization</span>
            <strong>{view.organizationLabel}</strong>
          </div>
          <div className="oe-snapshot-row">
            <span>Current Stage</span>
            <strong>{view.currentStage}</strong>
          </div>
          <div className="oe-snapshot-row">
            <span>Primary Opportunity</span>
            <strong>{view.primaryOpportunity}</strong>
          </div>
          <div className="oe-snapshot-row">
            <span>Estimated Annual Opportunity</span>
            <strong>{view.estimatedAnnualOpportunity}</strong>
          </div>
          <div className="oe-snapshot-row">
            <span>Recommended Solution</span>
            <strong>{view.recommendedSolution}</strong>
          </div>
          <div className="oe-snapshot-row">
            <span>Estimated Project Timeline</span>
            <strong>{view.estimatedTimeline}</strong>
          </div>
        </div>
      </section>

      <section className="oe-section" aria-labelledby="oe-learned">
        <h3 id="oe-learned" className="oe-section-title">
          What We Learned
        </h3>
        <p className="oe-section-lede">{view.learnedIntro}</p>
        <div className="oe-learn-grid">
          {view.learnedCards.map((card) => (
            <article key={card.id} className="oe-learn-card">
              <h4>{card.title}</h4>
              <p className="oe-learn-observation">{card.observation}</p>
              <p>
                <span className="oe-learn-label">Why it matters</span>
                {card.whyItMatters}
              </p>
              <p>
                <span className="oe-learn-label">Potential impact</span>
                {card.potentialImpact}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="oe-section" aria-labelledby="oe-meaning">
        <h3 id="oe-meaning" className="oe-section-title">
          What This Could Mean
        </h3>
        <p className="oe-section-lede">{view.meaningIntro}</p>
        <div className="oe-meaning-grid">
          <article className="oe-meaning-card">
            <p className="oe-metric-label">Estimated Annual Opportunity</p>
            <p className="oe-metric-value">{view.estimatedAnnualOpportunity}</p>
          </article>
          <article className="oe-meaning-card">
            <p className="oe-metric-label">Estimated Time Savings</p>
            <p className="oe-metric-value oe-metric-value-sm">{view.estimatedTimeSavings}</p>
          </article>
          <article className="oe-meaning-card oe-meaning-wide">
            <p className="oe-metric-label">Potential Business Impact</p>
            <p className="oe-narrative">{view.potentialBusinessImpact}</p>
          </article>
        </div>
      </section>

      <section className="oe-section" aria-labelledby="oe-begin">
        <h3 id="oe-begin" className="oe-section-title">
          Here&apos;s Where We&apos;d Begin
        </h3>
        <p className="oe-section-lede">{view.beginIntro}</p>
        <div className="oe-begin-grid">
          {view.beginCards.map((card) => (
            <article key={card.id} className="oe-begin-card">
              <h4>{card.title}</h4>
              <p>{card.purpose}</p>
              <p className="oe-begin-time">{card.estimatedBuildTime}</p>
            </article>
          ))}
        </div>
        <div className="oe-invest oe-invest-soft">
          <p className="oe-metric-label">Estimated Project Effort</p>
          <p className="oe-metric-value oe-metric-value-sm">{view.estimatedProjectEffort}</p>
          <p className="oe-metric-label" style={{ marginTop: '1rem' }}>
            Estimated Project Investment
          </p>
          <p className="oe-metric-value oe-metric-value-sm">{view.estimatedProjectInvestment}</p>
          <p className="oe-section-lede" style={{ marginTop: '1rem', marginBottom: 0 }}>
            {view.beginNote}
          </p>
        </div>
      </section>

      <section className="oe-section" aria-labelledby="oe-continue">
        <h3 id="oe-continue" className="oe-section-title">
          Continue the Conversation
        </h3>
        <p className="oe-section-lede">{view.continueIntro}</p>
        <ul className="oe-continue-list">
          <li>Tell us more about your organization</li>
          <li>What are your biggest goals?</li>
          <li>What challenges would you most like to solve?</li>
          <li>Upload logo, brand guide, photos, and current materials</li>
        </ul>
        <p className="oe-cta-alt">
          <Link href={view.designStudioHref}>Share details &amp; uploads</Link>
          {' · '}
          <Link href={view.documentsHref}>Open documents</Link>
        </p>
      </section>

      <section className="oe-section" aria-labelledby="oe-journey">
        <h3 id="oe-journey" className="oe-section-title">
          Project Journey
        </h3>
        <ol className="oe-journey-list">
          {view.journeySteps.map((step) => (
            <li key={step.id} className={`oe-journey-item oe-journey-${step.state}`}>
              <JourneyMark state={step.state} />
              <span>{step.label}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="oe-section" aria-labelledby="oe-comm">
        <h3 id="oe-comm" className="oe-section-title">
          Communication Center
        </h3>
        <p className="oe-section-lede">
          One place for questions, messages, file uploads, project updates, and recommendations.
          Everything stays here - no email chains.
        </p>
        <div className="oe-comm-actions">
          <Link href={view.messagingHref} className="oe-cta-primary" style={{ backgroundColor: GOLD, color: NAVY }}>
            Message your advisor
          </Link>
          <Link href={view.communicationHref} className="oe-comm-link">
            Open messages &amp; support
          </Link>
          <Link href={view.reviewHref} className="oe-comm-link">
            Schedule a conversation
          </Link>
        </div>
      </section>

      <nav className="oe-utilities" aria-label="More in your workspace">
        {view.utilities.map((u) => (
          <Link key={u.href} href={u.href}>
            {u.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

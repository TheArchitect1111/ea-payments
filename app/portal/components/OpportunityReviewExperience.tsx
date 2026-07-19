'use client';

import Link from 'next/link';
import { Fraunces, Manrope } from 'next/font/google';
import type { CtpOpportunityReviewView } from '@/lib/ctp-opportunity-view';
import { withCalendlyRedirect } from '@/lib/ctp-calendly';
import './opportunity-review-experience.css';

const display = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

const sans = Manrope({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
});

const BEFORE_PANELS = [
  {
    id: 'understood',
    title: 'Feel Understood',
    copy: 'We walk through what we learned about your organization — not a generic pitch.',
    src: '/client-experience/communication-understood.png',
    alt: 'Attentive conversation where someone feels truly understood',
  },
  {
    id: 'clarity',
    title: 'See the Story Clearly',
    copy: 'Together we clarify the narrative, priorities, and the experience your customers deserve.',
    src: '/client-experience/story-brand-process.png',
    alt: 'Creative process collage for shaping brand and story',
  },
  {
    id: 'impression',
    title: 'Picture the First Impression',
    copy: 'You leave with a vivid sense of how a stronger presence changes how people meet you.',
    src: '/client-experience/first-impression-entrance.png',
    alt: 'Warm entrance that invites trust and a strong first impression',
  },
] as const;

const TOGETHER_STEPS = [
  {
    num: '01',
    title: 'Understand',
    copy: 'We align on what matters most to you and your organization right now.',
  },
  {
    num: '02',
    title: 'Explore',
    copy: 'We review findings, opportunities, and the recommended path with clarity.',
  },
  {
    num: '03',
    title: 'Prioritize',
    copy: 'We decide what belongs in the first build — and what can wait.',
  },
  {
    num: '04',
    title: 'Review',
    copy: 'We walk investment, timeline, and scope so expectations stay grounded.',
  },
  {
    num: '05',
    title: 'Questions',
    copy: 'You ask everything you need. No pressure — just a clear next step.',
  },
] as const;

const LEAVE_WITH = [
  {
    title: 'Understanding',
    copy: 'A shared picture of where you are and what is holding growth back.',
  },
  {
    title: 'Roadmap',
    copy: 'A practical sequence from discovery through launch — not a vague wish list.',
  },
  {
    title: 'Investment Clarity',
    copy: 'Honest ranges and tradeoffs so you can decide with confidence.',
  },
  {
    title: 'Confidence',
    copy: 'A calm sense of what happens next, and that you are in capable hands.',
  },
] as const;

const JOURNEY_STEPS = [
  { id: 'questionnaire', label: 'Questionnaire', state: 'complete' as const },
  { id: 'review', label: 'Initial Review', state: 'complete' as const },
  { id: 'discovery', label: 'Discovery', state: 'complete' as const },
  { id: 'opportunity-review', label: 'Opportunity Review', state: 'current' as const },
  { id: 'proposal', label: 'Proposal', state: 'upcoming' as const },
  { id: 'approval', label: 'Approval', state: 'upcoming' as const },
];

type Props = {
  view: CtpOpportunityReviewView;
  confirmedHref?: string;
};

function resolveCalendlyHref(view: CtpOpportunityReviewView, confirmedHref?: string): string {
  if (!confirmedHref) return view.calendlyUrl;
  if (typeof window !== 'undefined' && !confirmedHref.startsWith('http')) {
    return withCalendlyRedirect(view.calendlyUrl, `${window.location.origin}${confirmedHref}`);
  }
  return withCalendlyRedirect(view.calendlyUrl, confirmedHref);
}

export default function OpportunityReviewExperience({ view, confirmedHref }: Props) {
  const calendlyHref = resolveCalendlyHref(view, confirmedHref);
  const isScheduled = Boolean(view.reviewLabel);

  return (
    <main className={`ore ${sans.className}`}>
      <div className="ore-grain" aria-hidden />

      <section className="ore-hero" aria-labelledby="ore-hero-title">
        <div className="ore-hero-copy">
          <p className="ore-kicker">Your Opportunity Review</p>
          <h1 id="ore-hero-title" className={`ore-headline ${display.className}`}>
            {isScheduled
              ? `You're scheduled, ${view.firstName}`
              : "We've Prepared Something Specifically For You"}
          </h1>
          <p className="ore-lede">
            {isScheduled ? (
              <>
                We look forward to speaking with you about {view.businessName}. A calendar invitation
                is on its way — use the link below if you need to reschedule.
              </>
            ) : (
              <>
                {view.firstName}, this is a focused conversation about {view.businessName} — what we
                found, what we recommend, and how we can move forward together. Not a sales script. A
                prepared review of your opportunity.
              </>
            )}
          </p>
          <div className="ore-badge-row">
            {isScheduled ? (
              <>
                <span className="ore-badge">Scheduled</span>
                <span className="ore-confirmed">
                  Confirmed · <strong>{view.reviewLabel}</strong>
                </span>
              </>
            ) : (
              <span className="ore-badge">Analysis Complete</span>
            )}
          </div>
          <div className="ore-hero-actions">
            {isScheduled ? (
              <>
                <a className="ore-cta" href="#ore-final">
                  View Details
                </a>
                <a
                  className="ore-secondary"
                  href={calendlyHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Reschedule
                </a>
              </>
            ) : (
              <>
                <a
                  className="ore-cta"
                  href={calendlyHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {view.ctaLabel}
                </a>
                <Link className="ore-secondary" href={view.backHref}>
                  Continue Exploring My Dashboard
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="ore-hero-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/client-experience/review-hero-welcome.png"
            alt="Warm hotel lobby welcome — hospitality that makes guests feel expected"
            width={1200}
            height={900}
          />
        </div>
      </section>

      <section className="ore-section" aria-labelledby="ore-before-title">
        <p className="ore-kicker">Before we meet</p>
        <h2 id="ore-before-title" className={`ore-section-title ${display.className}`}>
          What this conversation is for
        </h2>
        <div className="ore-panels">
          {BEFORE_PANELS.map((panel) => (
            <article key={panel.id} className="ore-panel">
              <div className="ore-panel-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={panel.src} alt={panel.alt} width={800} height={600} />
              </div>
              <h3 className={`ore-panel-title ${display.className}`}>{panel.title}</h3>
              <p className="ore-panel-copy">{panel.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ore-section ore-section-narrow" aria-labelledby="ore-together-title">
        <p className="ore-kicker">Here&apos;s what we&apos;ll do together</p>
        <h2 id="ore-together-title" className={`ore-section-title ${display.className}`}>
          A calm, structured review
        </h2>
        <ol className="ore-timeline">
          {TOGETHER_STEPS.map((step) => (
            <li key={step.num} className="ore-timeline-item">
              <span className="ore-timeline-num">{step.num}</span>
              <div>
                <h3 className={`ore-timeline-title ${display.className}`}>{step.title}</h3>
                <p className="ore-timeline-copy">{step.copy}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="ore-section" aria-labelledby="ore-leave-title">
        <p className="ore-kicker">What you&apos;ll leave with</p>
        <h2 id="ore-leave-title" className={`ore-section-title ${display.className}`}>
          Clarity you can act on
        </h2>
        <ul className="ore-leave">
          {LEAVE_WITH.map((item) => (
            <li key={item.title}>
              <h3 className={`ore-leave-title ${display.className}`}>{item.title}</h3>
              <p className="ore-leave-copy">{item.copy}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="ore-section" aria-labelledby="ore-journey-title">
        <p className="ore-kicker">Your journey continues</p>
        <h2 id="ore-journey-title" className={`ore-section-title ${display.className}`}>
          Where you are now
        </h2>
        <div className="ore-journey-layout">
          <div className="ore-journey-visual">
            <div className="ore-journey-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/client-experience/journey-continues.png"
                alt="Captain at the helm — steady guidance as your journey continues"
                width={1200}
                height={900}
              />
            </div>
            <a
              className="ore-cta"
              href={isScheduled ? calendlyHref : '#ore-final'}
              {...(isScheduled
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
            >
              {isScheduled ? 'Schedule My Opportunity Review' : 'Continue to Schedule'}
            </a>
          </div>
          <ol className="ore-journey">
            {JOURNEY_STEPS.map((step) => (
              <li key={step.id} className="ore-journey-step" data-state={step.state}>
                <span className="ore-journey-dot" aria-hidden />
                <span className={`ore-journey-label ${display.className}`}>{step.label}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="ore-final" id="ore-final" aria-labelledby="ore-final-title">
        <div className="ore-final-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/client-experience/review-choose-time.png"
            alt="Captain at the helm — choose a time when you are ready"
            width={1400}
            height={800}
          />
        </div>
        <div className="ore-final-copy">
          <h2 id="ore-final-title" className={`ore-final-headline ${display.className}`}>
            {isScheduled ? "You're on the calendar" : "We're Ready Whenever You Are"}
          </h2>
          <p className="ore-final-lede">
            {isScheduled ? (
              <>
                Your Opportunity Review is set
                {view.reviewLabel ? (
                  <>
                    {' '}
                    for <strong>{view.reviewLabel}</strong>
                  </>
                ) : null}
                . Need a different time? Reschedule below — we&apos;ll meet you there.
              </>
            ) : (
              <>
                Choose a time that works. There is no pressure — only a prepared conversation about
                what is possible for {view.businessName}.
              </>
            )}
          </p>
          <a
            className="ore-cta"
            href={calendlyHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            {isScheduled ? 'Reschedule' : 'Choose My Time'}
          </a>
          <p className="ore-reassure">No obligation. Just clarity.</p>
        </div>
      </section>
    </main>
  );
}

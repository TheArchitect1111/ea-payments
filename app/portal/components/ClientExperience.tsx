'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Fraunces, Manrope } from 'next/font/google';
import type { CtpOpportunityDashboardView } from '@/lib/ctp-opportunity-view';
import BrandOnboardingPaths from './BrandOnboardingPaths';
import './client-experience.css';

const display = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

const sans = Manrope({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
});

const SCENE_COUNT = 7;

const PHOTO_BY_ID: Record<string, string> = {
  welcome: '/client-experience/welcome-possibility-strip.png',
  imagine: '/client-experience/first-impression-entrance.png',
  'first-impression': '/client-experience/first-impression-entrance.png',
  communication: '/client-experience/communication-understood.png',
  'customer-experience': '/client-experience/customer-experience-welcome.png',
  'business-operations': '/client-experience/operations-harmony.png',
  begin: '/client-experience/begin-life-freedom.png',
  story: '/client-experience/story-brand-process.png',
  journey: '/client-experience/journey-path.png',
  next: '/client-experience/continuity-portrait.png',
  continuity: '/client-experience/continuity-portrait.png',
};

const PHOTO_ALT_BY_ID: Record<string, string> = {
  welcome: 'Welcoming collage of diverse people living with ease and possibility',
  imagine: 'Warm, open entrance that invites trust and a strong first impression',
  'first-impression': 'Warm, open entrance that invites trust and a strong first impression',
  communication: 'Attentive listening conversation where someone feels truly understood',
  'customer-experience': 'Concierge warmly welcoming a family',
  'business-operations': 'Orchestra playing in harmony, a metaphor for aligned operations',
  begin: 'Emotionally charged collage of life, freedom, family, and purposeful living',
  story: 'Brand and creative process collage for shaping your story together',
  journey: 'A clear path forward through calm landscape and purposeful travel',
  next: 'Portrait conveying continuity, care, and what happens next',
  continuity: 'Portrait conveying continuity, care, and what happens next',
};

const SCENE_LABELS = [
  'Welcome',
  'Imagine',
  'Insights',
  'Begin',
  'Build',
  'Journey',
  'Next',
] as const;

function brandOnboardingKey(slug: string) {
  return `ctp-brand-onboarding:${slug}`;
}

function scrollExperienceToTop() {
  window.scrollTo(0, 0);
  document.querySelector('.cex')?.scrollTo(0, 0);
  document.querySelector('.cex-stage')?.scrollTo(0, 0);
}

function EditorialPhoto({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`${className}${failed ? ' cex-photo-fallback' : ''}`}>
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="cex-photo-img"
          src={src}
          alt={alt}
          width={1200}
          height={800}
          onError={() => setFailed(true)}
        />
      ) : null}
    </div>
  );
}

type Props = {
  view: CtpOpportunityDashboardView;
  slug: string;
  studio: ReactNode;
};

export default function ClientExperience({ view, slug, studio }: Props) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [designLead, setDesignLead] = useState(false);

  useEffect(() => {
    try {
      const path = window.localStorage.getItem(brandOnboardingKey(slug));
      setDesignLead(path === 'creative_freedom' || path === 'brand_discovery');
    } catch {
      setDesignLead(false);
    }
  }, [slug, sceneIndex]);

  useEffect(() => {
    scrollExperienceToTop();
  }, [sceneIndex]);

  function goTo(index: number) {
    setSceneIndex(Math.max(0, Math.min(SCENE_COUNT - 1, index)));
    scrollExperienceToTop();
  }

  function continueScene() {
    goTo(sceneIndex + 1);
  }

  const continueLabel =
    sceneIndex === 0
      ? 'Show Me What You Found'
      : sceneIndex === 4
        ? null
        : sceneIndex >= SCENE_COUNT - 1
          ? null
          : 'Continue';

  const nextSteps = [
    {
      num: '01',
      label: view.guide?.stage || view.currentStage || 'Welcome',
      copy: view.guide?.summary || view.guide?.headline || 'Your project home shows where things stand.',
    },
    {
      num: '02',
      label: view.guide?.nothingRequired ? 'Nothing needed from you' : 'Your next step',
      copy: view.guide?.nothingRequired
        ? view.guide.confidenceMessage ||
          "We've got everything we need. We'll update Your Project when it's your turn."
        : view.guide?.nbaLabel || 'Open Your Project for the one clear next step.',
    },
    {
      num: '03',
      label: 'What happens next',
      copy: view.guide?.whatsNextCopy || view.guide?.behindTheScenes || 'Progress always shows what comes next.',
    },
  ];

  return (
    <main className={`cex ${sans.className}`}>
      <div className="cex-grain" aria-hidden />

      <nav className="cex-escape" aria-label="Client shortcuts">
        <Link href={`/portal/${slug}/ctp/progress`}>Progress</Link>
        <Link href={`/portal/${slug}/ctp/support`}>Support</Link>
      </nav>

      <nav className="cex-dots" aria-label="Experience scenes">
        {SCENE_LABELS.map((label, index) => (
          <button
            key={label}
            type="button"
            className="cex-dot"
            aria-label={label}
            aria-current={index === sceneIndex ? 'true' : undefined}
            onClick={() => goTo(index)}
          />
        ))}
      </nav>

      <div className="cex-stage">
        <div className="cex-scene" key={sceneIndex}>
          {sceneIndex === 0 ? (
            <section className="cex-welcome" aria-labelledby="cex-welcome-title">
              <div>
                <p className="cex-kicker">Client Experience</p>
                <h1 id="cex-welcome-title" className={`cex-headline ${display.className}`}>
                  Welcome, {view.firstName}.
                </h1>
                <p className="cex-lede">We&apos;ve spent time learning about your organization.</p>
                <p className="cex-lede">We&apos;re excited to show you what we see.</p>
              </div>
              <EditorialPhoto
                className="cex-welcome-photo"
                src={PHOTO_BY_ID.welcome}
                alt={PHOTO_ALT_BY_ID.welcome}
              />
            </section>
          ) : null}

          {sceneIndex === 1 ? (
            <section className="cex-imagine" aria-labelledby="cex-imagine-title">
              <div>
                <p className="cex-kicker">Possibility</p>
                <h2 id="cex-imagine-title" className={`cex-headline ${display.className}`}>
                  Imagine Your Business Operating in a Way That Creates...
                </h2>
                <ul className="cex-imagine-list">
                  <li>More time for the people who matter most.</li>
                  <li>The freedom to step away without everything stopping.</li>
                  <li>Mornings that begin with purpose instead of putting out fires.</li>
                  <li>
                    Confidence that your business is moving forward, even when you&apos;re not
                    watching every detail.
                  </li>
                  <li>
                    Stronger relationships with customers because every interaction feels
                    intentional.
                  </li>
                  <li>Space to think strategically instead of constantly reacting.</li>
                  <li>
                    More energy to invest in your family, your health, your community, and the life
                    you&apos;re building.
                  </li>
                </ul>
                <p className="cex-lede cex-imagine-close">
                  That is the future we&apos;re building together.
                </p>
              </div>
              <EditorialPhoto
                className="cex-imagine-photo"
                src={PHOTO_BY_ID.imagine}
                alt={PHOTO_ALT_BY_ID.imagine}
              />
            </section>
          ) : null}

          {sceneIndex === 2 ? (
            <section aria-labelledby="cex-insights-title">
              <p className="cex-kicker">What we noticed</p>
              <h2 id="cex-insights-title" className={`cex-headline ${display.className}`}>
                Here&apos;s what stood out.
              </h2>
              <p className="cex-lede">{view.learnedIntro}</p>
              <div className="cex-insights">
                {view.learnedCards.slice(0, 4).map((card) => (
                  <article key={card.id} className="cex-insight">
                    <EditorialPhoto
                      className="cex-insight-photo"
                      src={PHOTO_BY_ID[card.id] || PHOTO_BY_ID['first-impression']}
                      alt={PHOTO_ALT_BY_ID[card.id] || PHOTO_ALT_BY_ID['first-impression']}
                    />
                    <div>
                      <h3 className={`cex-insight-title ${display.className}`}>{card.title}</h3>
                      <p className="cex-insight-body">
                        {card.observation} {card.whyItMatters}
                      </p>
                      <p className="cex-insight-impact">Potential impact: {card.potentialImpact}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {sceneIndex === 3 ? (
            <section aria-labelledby="cex-begin-title">
              <p className="cex-kicker">Where we begin</p>
              <h2 id="cex-begin-title" className={`cex-headline ${display.className}`}>
                Here&apos;s where we&apos;d begin.
              </h2>
              <p className="cex-lede">{view.beginIntro}</p>
              <EditorialPhoto
                className="cex-begin-hero cex-begin-photo cex-photo-contain"
                src={PHOTO_BY_ID.begin}
                alt={PHOTO_ALT_BY_ID.begin}
              />
              <ul className="cex-begin-list">
                {view.beginCards.map((card) => (
                  <li key={card.id} className="cex-begin-item">
                    <div>
                      <p className={`cex-begin-title ${display.className}`}>{card.title}</p>
                      <p className="cex-begin-purpose">{card.purpose}</p>
                    </div>
                    <span className="cex-begin-time">
                      {card.id === 'maintenance' ? (
                        <>
                          <span className="cex-begin-time-label">Investment</span>
                          {card.estimatedBuildTime}
                        </>
                      ) : (
                        card.estimatedBuildTime
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="cex-estimates">
                <div className="cex-estimate">
                  <dt>Estimated effort</dt>
                  <dd className={display.className}>{view.estimatedProjectEffort}</dd>
                </div>
                <div className="cex-estimate">
                  <dt>Estimated investment</dt>
                  <dd className={display.className}>{view.estimatedProjectInvestment}</dd>
                </div>
              </dl>
              <p className="cex-note">
                {view.beginNote ||
                  'Every organization is different. Estimates vary with scope and complexity. A final proposal follows discovery.'}
              </p>
            </section>
          ) : null}

          {sceneIndex === 4 ? (
            <section className="cex-studio-wrap" aria-labelledby="cex-studio-title">
              <BrandOnboardingPaths
                key={`brand-onboarding-${slug}`}
                slug={slug}
                studio={studio}
                businessName={view.businessName}
                onPathComplete={() => goTo(5)}
              />
            </section>
          ) : null}

          {sceneIndex === 5 ? (
            <section aria-labelledby="cex-journey-title">
              <p className="cex-kicker">Your path</p>
              <h2 id="cex-journey-title" className={`cex-headline ${display.className}`}>
                Your project journey.
              </h2>
              <p className="cex-lede">
                A clear sequence from first review through launch, so you always know where you are.
              </p>
              <EditorialPhoto
                className="cex-begin-hero"
                src={PHOTO_BY_ID.journey}
                alt={PHOTO_ALT_BY_ID.journey}
              />
              <ol className="cex-journey">
                {view.journeySteps.map((step) => (
                  <li key={step.id} className="cex-journey-step" data-state={step.state}>
                    <p className={`cex-journey-label ${display.className}`}>{step.label}</p>
                  </li>
                ))}
              </ol>
              <p className="cex-note">
                There is no payment until you approve your proposal. Once you do, we begin design
                and development together.
              </p>
            </section>
          ) : null}

          {sceneIndex === 6 ? (
            <section aria-labelledby="cex-next-title">
              <p className="cex-kicker">Continuity</p>
              <h2 id="cex-next-title" className={`cex-headline ${display.className}`}>
                What happens next.
              </h2>
              <p className="cex-lede">
                Where you are: <strong>{view.guide?.stage || view.currentStage || 'Welcome'}</strong>.{' '}
                {view.guide?.confidenceMessage ||
                  'Your Project (Progress) is the home base for everything ahead.'}
              </p>
              {view.guide?.headline ? (
                <p className="cex-lede">
                  <strong>{view.guide.headline}</strong> {view.guide.summary}
                </p>
              ) : null}
              <EditorialPhoto
                className="cex-begin-hero"
                src={PHOTO_BY_ID.next}
                alt={PHOTO_ALT_BY_ID.next}
              />
              <ol className="cex-next-steps">
                {nextSteps.map((step) => (
                  <li key={step.num}>
                    <span className="cex-next-num">{step.num}</span>
                    <div>
                      <p className={`cex-next-label ${display.className}`}>{step.label}</p>
                      <p className="cex-next-copy">{step.copy}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="cex-nav-row cex-nav-row-primary">
                {view.guide?.nothingRequired ? (
                  <Link className="cex-cta" href={`/portal/${slug}/ctp/progress`}>
                    We&apos;ve got everything we need — open Your Project
                  </Link>
                ) : view.guide?.nbaHref ? (
                  <Link
                    className="cex-cta"
                    href={view.guide.nbaHref}
                    target={view.guide.nbaExternal ? '_blank' : undefined}
                    rel={view.guide.nbaExternal ? 'noreferrer' : undefined}
                  >
                    {view.guide.nbaLabel}
                  </Link>
                ) : (
                  <Link className="cex-cta" href={`/portal/${slug}/ctp/progress`}>
                    {view.primaryCtaLabel || 'Open Your Project'}
                  </Link>
                )}
              </div>
              <p className="cex-support-label">Support anytime</p>
              <ul className="cex-support-links">
                <li>
                  <Link href={`/portal/${slug}/ctp/messages`}>Messages</Link>
                </li>
                <li>
                  <Link href={`/portal/${slug}/ctp/documents`}>Documents</Link>
                </li>
                <li>
                  <Link href={`/portal/${slug}/ctp/support`}>Support</Link>
                </li>
              </ul>
            </section>
          ) : null}

          {sceneIndex < SCENE_COUNT - 1 ? (
            <div className="cex-nav-row">
              {sceneIndex > 0 ? (
                <button type="button" className="cex-back" onClick={() => goTo(sceneIndex - 1)}>
                  Back
                </button>
              ) : null}
              {continueLabel ? (
                <button type="button" className="cex-cta" onClick={continueScene}>
                  {continueLabel}
                </button>
              ) : null}
            </div>
          ) : sceneIndex > 0 ? (
            <div className="cex-nav-row">
              <button type="button" className="cex-back" onClick={() => goTo(sceneIndex - 1)}>
                Back
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

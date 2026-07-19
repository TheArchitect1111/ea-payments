'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Fraunces, Manrope } from 'next/font/google';
import type { CtpOpportunityDashboardView } from '@/lib/ctp-opportunity-view';
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

const INSIGHT_IMAGES = [
  'https://images.unsplash.com/photo-1521737711867-e3b97375f602?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1573497019940-88c6a86b0a2f?auto=format&fit=crop&w=1200&q=85',
];

const IMAGINE_IMAGE =
  'https://images.unsplash.com/photo-1476705147036-43cd080da2f3?auto=format&fit=crop&w=1600&q=85';

const SCENE_LABELS = [
  'Welcome',
  'Imagine',
  'Insights',
  'Begin',
  'Build',
  'Journey',
  'Connect',
] as const;

type Props = {
  view: CtpOpportunityDashboardView;
  slug: string;
  studio: ReactNode;
};

export default function ClientExperience({ view, slug, studio }: Props) {
  const [sceneIndex, setSceneIndex] = useState(0);

  function goTo(index: number) {
    setSceneIndex(Math.max(0, Math.min(SCENE_COUNT - 1, index)));
  }

  function continueScene() {
    goTo(sceneIndex + 1);
  }

  const continueLabel =
    sceneIndex === 0
      ? 'Show Me What You Found'
      : sceneIndex >= SCENE_COUNT - 1
        ? null
        : 'Continue';

  return (
    <main className={`cex ${sans.className}`}>
      <div className="cex-grain" aria-hidden />

      <nav className="cex-escape" aria-label="Portal shortcuts">
        <Link href={`/portal/${slug}`}>Portal home</Link>
        <a href="/api/portal/logout">Log out</a>
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
                <p className="cex-kicker">Client Experience</p>
                <h1 id="cex-welcome-title" className={`cex-headline ${display.className}`}>
                  Welcome, {view.firstName}.
                </h1>
                <p className="cex-lede">We&apos;ve spent time learning about your organization.</p>
                <p className="cex-lede">We&apos;re excited to show you what we see.</p>
              </section>
            ) : null}

            {sceneIndex === 1 ? (
              <section className="cex-imagine" aria-labelledby="cex-imagine-title">
                <div>
                  <p className="cex-kicker">Possibility</p>
                  <h2 id="cex-imagine-title" className={`cex-headline ${display.className}`}>
                    Imagine what&apos;s possible for {view.businessName}.
                  </h2>
                  <p className="cex-lede">
                    A clearer first impression. A calmer rhythm of work. A customer journey that feels
                    intentional, so your mission has room to grow.
                  </p>
                </div>
                <div
                  className="cex-imagine-photo"
                  style={{ backgroundImage: `url(${IMAGINE_IMAGE})` }}
                  role="img"
                  aria-label="Leaders gathered with quiet confidence"
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
                  {view.learnedCards.slice(0, 4).map((card, index) => (
                    <article key={card.id} className="cex-insight">
                      <div
                        className="cex-insight-photo"
                        style={{
                          backgroundImage: `url(${INSIGHT_IMAGES[index % INSIGHT_IMAGES.length]})`,
                        }}
                        role="img"
                        aria-hidden
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
                <ul className="cex-begin-list">
                  {view.beginCards.slice(0, 4).map((card) => (
                    <li key={card.id} className="cex-begin-item">
                      <div>
                        <p className={`cex-begin-title ${display.className}`}>{card.title}</p>
                        <p className="cex-begin-purpose">{card.purpose}</p>
                      </div>
                      <span className="cex-begin-time">{card.estimatedBuildTime}</span>
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
                <p className="cex-kicker">Collaboration</p>
                <h2 id="cex-studio-title" className={`cex-headline ${display.className}`}>
                  Help us tell your story.
                </h2>
                <p className="cex-lede">
                  Share brand details, inspiration, and assets so we can shape the next chapter with
                  you. Everything saves as you go.
                </p>
                <div style={{ marginTop: '1.75rem' }}>{studio}</div>
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
                <ol className="cex-journey">
                  {view.journeySteps.map((step) => (
                    <li key={step.id} className="cex-journey-step" data-state={step.state}>
                      <p className={`cex-journey-label ${display.className}`}>{step.label}</p>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {sceneIndex === 6 ? (
              <section aria-labelledby="cex-connect-title">
                <p className="cex-kicker">Stay close</p>
                <h2 id="cex-connect-title" className={`cex-headline ${display.className}`}>
                  Stay connected.
                </h2>
                <p className="cex-lede">
                  Whenever you need us. Messages, documents, and ongoing conversation live here.
                </p>
                <ul className="cex-connect-links">
                  <li>
                    <a href={view.messagingHref}>
                      <span>01</span> Messaging
                    </a>
                  </li>
                  <li>
                    <a href={view.documentsHref}>
                      <span>02</span> Documents
                    </a>
                  </li>
                  <li>
                    <a href={view.communicationHref}>
                      <span>03</span> Communication
                    </a>
                  </li>
                </ul>
              </section>
            ) : null}

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
              ) : (
                <Link className="cex-cta" href={`/portal/${slug}`}>
                  Return to portal
                </Link>
              )}
            </div>
        </div>
      </div>
    </main>
  );
}

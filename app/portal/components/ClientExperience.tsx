'use client';

import { useEffect, useState, type ReactNode } from 'react';
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

const PHOTO_BY_ID: Record<string, string> = {
  imagine:
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=85',
  'first-impression':
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=85',
  communication:
    'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=85',
  'customer-experience':
    'https://images.unsplash.com/photo-1556745757-8d76bdb6984c?auto=format&fit=crop&w=1200&q=85',
  'business-operations':
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=85',
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

function designLeadKey(slug: string) {
  return `ctp-design-lead:${slug}`;
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
  const [studioNote, setStudioNote] = useState<string | null>(null);
  const [designLead, setDesignLead] = useState(false);

  useEffect(() => {
    try {
      setDesignLead(window.localStorage.getItem(designLeadKey(slug)) === '1');
    } catch {
      setDesignLead(false);
    }
  }, [slug]);

  function goTo(index: number) {
    setSceneIndex(Math.max(0, Math.min(SCENE_COUNT - 1, index)));
  }

  function continueScene() {
    goTo(sceneIndex + 1);
  }

  function clearDesignLead() {
    try {
      window.localStorage.removeItem(designLeadKey(slug));
    } catch {
      /* ignore */
    }
    setDesignLead(false);
  }

  function setDesignLeadFlag() {
    try {
      window.localStorage.setItem(designLeadKey(slug), '1');
    } catch {
      /* ignore */
    }
    setDesignLead(true);
  }

  function skipForNow() {
    clearDesignLead();
    setStudioNote(null);
    goTo(5);
  }

  function noMaterials() {
    clearDesignLead();
    setStudioNote('No materials yet — we will shape direction with you.');
    goTo(5);
  }

  function designImmediately() {
    setDesignLeadFlag();
    setStudioNote('EA will lead creative direction from here.');
    goTo(5);
  }

  const continueLabel =
    sceneIndex === 0
      ? 'Show Me What You Found'
      : sceneIndex === 4
        ? 'Continue with what I shared'
        : sceneIndex >= SCENE_COUNT - 1
          ? null
          : 'Continue';

  const nextSteps = [
    {
      num: '01',
      label: 'Refine',
      copy: designLead
        ? 'We lead design direction based on what we learned — you can share materials anytime.'
        : 'We refine recommendations from anything you shared in your story.',
    },
    {
      num: '02',
      label: 'Opportunity Review',
      copy: 'A focused conversation to align on priorities and the path forward.',
    },
    {
      num: '03',
      label: 'Proposal',
      copy: 'A clear written proposal with scope, timeline, and investment.',
    },
    {
      num: '04',
      label: 'Approval & payment',
      copy: 'Payment happens at Approval — after you approve the proposal, before build begins.',
    },
    {
      num: '05',
      label: 'Design → Development → Launch',
      copy: 'We build and launch once Approval is complete.',
    },
  ];

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
              <EditorialPhoto
                className="cex-imagine-photo"
                src={PHOTO_BY_ID.imagine}
                alt="Light-filled architecture studio"
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
                      alt=""
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
              <div className="cex-choice-row" role="group" aria-label="Story options">
                <button type="button" className="cex-choice" onClick={skipForNow}>
                  Skip for now
                </button>
                <button type="button" className="cex-choice" onClick={noMaterials}>
                  I don&apos;t have materials
                </button>
                <button type="button" className="cex-choice cex-choice-primary" onClick={designImmediately}>
                  Help me design immediately
                </button>
              </div>
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
              {studioNote ? <p className="cex-choice-note">{studioNote}</p> : null}
              <ol className="cex-journey">
                {view.journeySteps.map((step) => (
                  <li key={step.id} className="cex-journey-step" data-state={step.state}>
                    <p className={`cex-journey-label ${display.className}`}>{step.label}</p>
                  </li>
                ))}
              </ol>
              <p className="cex-note">
                Payment is at Approval — after you approve the proposal, before design and
                development begin.
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
                Where you are: <strong>Discovery</strong>. We&apos;ve started — your portal is the
                home base for everything ahead.
              </p>
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
                <Link className="cex-cta" href={view.reviewHref}>
                  Schedule your Opportunity Review
                </Link>
              </div>
              <p className="cex-support-label">Support anytime</p>
              <ul className="cex-support-links">
                <li>
                  <a href={view.messagingHref}>Messages</a>
                </li>
                <li>
                  <a href={view.documentsHref}>Documents</a>
                </li>
                <li>
                  <a href={view.communicationHref}>Updates</a>
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

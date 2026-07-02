'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import Reveal from '@/app/components/landing/Reveal';
import {
  closingCta,
  controlCenter,
  experienceMeta,
  howItWorksFlow,
  industries,
  invisibleMoments,
  lifestyleBreak,
  openingHero,
  outcomeCards,
  universalHeadline,
  type OutcomeId,
} from '@/lib/possibilities-experience';

function SceneImage({
  src,
  alt,
  priority = false,
  className,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`px-photo${failed ? ' is-missing' : ''}${className ? ` ${className}` : ''}`}>
      {!failed && (
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onError={() => setFailed(true)}
        />
      )}
      {failed && (
        <span className="px-photo-fallback" aria-label={alt}>
          {alt}
        </span>
      )}
    </div>
  );
}

const ease = [0.22, 1, 0.36, 1] as const;

export default function PossibilitiesExperience() {
  const reduce = useReducedMotion();
  const [activeOutcome, setActiveOutcome] = useState<OutcomeId | null>(null);

  const rise = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 28 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.25 },
        transition: { duration: 0.75, ease },
      };

  const cardStagger = (index: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.2 },
          transition: { duration: 0.6, delay: index * 0.08, ease },
        };

  return (
    <main className="px" id="main-content">
      <header className="px-nav">
        <Link href="/" className="px-brand" aria-label="Efficiency Architects home">
          <Image src="/ea-logo.png" alt="" width={32} height={32} priority />
          <span>Efficiency Architects</span>
        </Link>
        <nav className="px-nav-links" aria-label="Experience">
          <a href="#outcomes" className="px-nav-link">
            Outcomes
          </a>
          <a href="#industries" className="px-nav-link">
            Industries
          </a>
          <Link href={closingCta.href} className="px-nav-cta">
            Begin
          </Link>
        </nav>
      </header>

      {/* Screen 1 — Opening question + outcome cards */}
      <section className="px-screen px-hero" aria-labelledby="px-hero-title">
        <SceneImage src={openingHero.image} alt={openingHero.imageAlt} priority className="px-hero-bg" />
        <div className="px-scrim" aria-hidden="true" />
        <div className="px-hero-inner">
          <motion.h1 id="px-hero-title" className="px-hero-title" {...rise}>
            {openingHero.headline}
          </motion.h1>
          <div id="outcomes" className="px-outcome-grid" role="list">
            {outcomeCards.map((card, index) => (
              <motion.button
                key={card.id}
                type="button"
                className={`px-outcome-card${activeOutcome === card.id ? ' is-active' : ''}`}
                role="listitem"
                onClick={() => setActiveOutcome(card.id)}
                {...cardStagger(index)}
              >
                <span className="px-outcome-title">{card.title}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Screen 2 — Universal outcomes */}
      <section className="px-screen px-universal" aria-labelledby="px-universal-title">
        <div className="px-universal-inner">
          <Reveal>
            <h2 id="px-universal-title" className="px-section-title">
              {universalHeadline}
            </h2>
          </Reveal>
          <ul className="px-universal-list">
            {outcomeCards.map((card) => (
              <Reveal key={card.id}>
                <li>
                  <span className="px-universal-label">{card.title}</span>
                  <p>{card.sentence}</p>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Screen 3 — Lifestyle break */}
      <section className="px-screen px-lifestyle" aria-labelledby="px-lifestyle-title">
        <SceneImage src={lifestyleBreak.image} alt={lifestyleBreak.imageAlt} className="px-lifestyle-bg" />
        <div className="px-scrim px-scrim-deep" aria-hidden="true" />
        <Reveal className="px-lifestyle-copy">
          <h2 id="px-lifestyle-title">{lifestyleBreak.headline}</h2>
        </Reveal>
      </section>

      {/* Screen 4 — Invisible system */}
      <section className="px-screen px-invisible" aria-labelledby="px-invisible-title">
        <span id="px-invisible-title" className="px-kicker">
          The invisible system
        </span>
        <div className="px-invisible-stack">
          {invisibleMoments.map((moment, index) => (
            <motion.article
              key={moment.id}
              className="px-invisible-scene"
              {...cardStagger(index)}
            >
              <SceneImage src={moment.image} alt={moment.imageAlt} />
              <div className="px-scrim" aria-hidden="true" />
              <span className="px-indicator" aria-label={moment.indicator}>
                <span className="px-indicator-mark" aria-hidden="true">
                  ✓
                </span>
                {moment.indicator}
              </span>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Screen 5 — Control center */}
      <section className="px-screen px-control" aria-labelledby="px-control-title">
        <SceneImage
          src={controlCenter.backdrop}
          alt={controlCenter.backdropAlt}
          className="px-control-bg"
        />
        <div className="px-scrim" aria-hidden="true" />
        <div className="px-control-inner">
          <Reveal>
            <p className="px-kicker">Pulse™</p>
            <h2 id="px-control-title">{controlCenter.headline}</h2>
            <p className="px-control-sub">{controlCenter.subline}</p>
          </Reveal>
          <Reveal className="px-control-devices">
            <img
              src={controlCenter.image}
              alt={controlCenter.imageAlt}
              loading="lazy"
              decoding="async"
            />
          </Reveal>
        </div>
      </section>

      {/* Screen 6 — Industries */}
      <section id="industries" className="px-industries" aria-label="Industry possibilities">
        {industries.map((industry) => (
          <article key={industry.id} className="px-screen px-industry" aria-labelledby={`ind-${industry.id}`}>
            <SceneImage src={industry.image} alt={industry.imageAlt} className="px-industry-bg" />
            <div className="px-scrim px-scrim-deep" aria-hidden="true" />
            <Reveal className="px-industry-copy">
              <p className="px-kicker">{industry.name}</p>
              <h2 id={`ind-${industry.id}`}>{industry.sentence}</h2>
              <span className="px-indicator px-indicator-subtle">
                <span className="px-indicator-mark" aria-hidden="true">
                  ✓
                </span>
                {industry.indicator}
              </span>
            </Reveal>
          </article>
        ))}
      </section>

      {/* Screen 7 — How it works */}
      <section className="px-screen px-flow" aria-labelledby="px-flow-title">
        <Reveal>
          <p className="px-kicker">How it works</p>
          <h2 id="px-flow-title" className="px-section-title px-flow-title">
            Simple, start to finish.
          </h2>
        </Reveal>
        <ol className="px-flow-steps">
          {howItWorksFlow.map((step, index) => (
            <Reveal key={step.id}>
              <li className="px-flow-step">
                <span className="px-flow-node">{step.label}</span>
                {index < howItWorksFlow.length - 1 ? (
                  <span className="px-flow-arrow" aria-hidden="true">
                    ↓
                  </span>
                ) : null}
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Screen 8 — Capabilities */}
      <section className="px-screen px-capabilities" aria-labelledby="px-cap-title">
        <Reveal>
          <p className="px-kicker">Capabilities</p>
          <h2 id="px-cap-title" className="px-section-title">
            Everything organized around what you want to accomplish.
          </h2>
        </Reveal>
        <div className="px-cap-grid">
          {outcomeCards.map((card) => (
            <Reveal key={card.id} className="px-cap-group">
              <h3>{card.title}</h3>
              <ul>
                {card.capabilities.map((cap) => (
                  <li key={cap}>{cap}</li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Screen 9 — Closing CTA */}
      <section className="px-screen px-close" aria-labelledby="px-close-title">
        <SceneImage src={closingCta.image} alt={closingCta.imageAlt} className="px-close-bg" />
        <div className="px-scrim px-scrim-deep" aria-hidden="true" />
        <Reveal className="px-close-copy">
          <h2 id="px-close-title">{closingCta.headline}</h2>
          <Link href={closingCta.href} className="px-cta">
            {closingCta.cta}
          </Link>
        </Reveal>
      </section>

      <footer className="px-footer">
        <p>{experienceMeta.description}</p>
        <nav aria-label="Footer">
          <Link href="/">Home</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
      </footer>
    </main>
  );
}

'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import SceneVisual from './SceneVisual';
import {
  behindTheScenes,
  chapterFive,
  chapterFour,
  chapterOne,
  chapterSeven,
  chapterSix,
  chapterThree,
  chapterTwo,
  finale,
  finalReveal,
  hero,
  opening,
  reveal,
} from '@/lib/ea-experience-lab';

/* ------------------------------------------------------------------ */
/* Scroll reveal                                                       */
/* ------------------------------------------------------------------ */

function Reveal({
  children,
  className,
  delay = 0,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: 'div' | 'li' | 'article' | 'section' | 'p' | 'h2';
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const Tag = as as 'div';
  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`eax-reveal${visible ? ' is-visible' : ''}${className ? ` ${className}` : ''}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */

function Icon({ name }: { name: string }) {
  const common = {
    width: 26,
    height: 26,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (name) {
    case 'contact':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" />
        </svg>
      );
    case 'mail':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 8l9 6 9-6" />
        </svg>
      );
    case 'globe':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" />
        </svg>
      );
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* Opening sequence                                                    */
/* ------------------------------------------------------------------ */

function Opening() {
  return (
    <section className="eax-opening" aria-label="Opening">
      <div className="eax-opening-inner">
        {opening.lines.map((line, i) => (
          <p
            key={line}
            className="eax-opening-line"
            style={{ animationDelay: `${0.4 + i * 2.6}s` }}
          >
            {line}
          </p>
        ))}
      </div>
      <div className="eax-opening-scroll" aria-hidden>
        <span>{hero.scrollHint}</span>
        <span className="eax-opening-arrow" />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section className="eax-hero" aria-label="Introduction">
      <SceneVisual visual={hero.visual} variant="hero" priority />
      <div className="eax-hero-copy">
        <div className="eax-container">
          <Reveal className="eax-eyebrow">{hero.eyebrow}</Reveal>
          <Reveal as="h2" className="eax-hero-title" delay={80}>
            {hero.title}{' '}
            <span className="eax-accent">{hero.titleAccent}</span>
          </Reveal>
          <Reveal className="eax-hero-sub" delay={160}>
            {hero.sub}
          </Reveal>
          <Reveal delay={240}>
            <a href={hero.cta.href} className="eax-btn eax-btn-primary">
              {hero.cta.label}
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Chapter shell                                                       */
/* ------------------------------------------------------------------ */

function ChapterHeading({ index, kicker }: { index: string; kicker: string }) {
  return (
    <Reveal className="eax-chapter-head">
      <span className="eax-chapter-index">{index}</span>
      <span className="eax-chapter-kicker">{kicker}</span>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/* Chapter 1 — One Conversation                                        */
/* ------------------------------------------------------------------ */

function ChapterOne() {
  return (
    <section id={chapterOne.id} className="eax-section eax-section-conversation">
      {chapterOne.visual ? <SceneVisual visual={chapterOne.visual} variant="wide" /> : null}
      <div className="eax-container">
        <ChapterHeading index={chapterOne.index} kicker={chapterOne.kicker} />
        <Reveal as="h2" className="eax-section-title" delay={80}>
          {chapterOne.title}
        </Reveal>
        <div className="eax-lines">
          {chapterOne.lines.map((line, i) => (
            <Reveal
              key={line}
              as="p"
              delay={120 + i * 90}
              className={i === chapterOne.lines.length - 1 ? 'eax-line-emphasis' : 'eax-line'}
            >
              {line}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Chapter 2 — One Tap                                                 */
/* ------------------------------------------------------------------ */

function ChapterTwo() {
  return (
    <section id={chapterTwo.id} className="eax-section eax-section-tap">
      {chapterTwo.visual ? <SceneVisual visual={chapterTwo.visual} variant="tall" /> : null}
      <div className="eax-container">
        <ChapterHeading index={chapterTwo.index} kicker={chapterTwo.kicker} />
        <Reveal className="eax-tap-intro" delay={60}>
          {chapterTwo.intro}
        </Reveal>
        <Reveal as="h2" className="eax-section-title eax-tap-title" delay={120}>
          “{chapterTwo.title}”
        </Reveal>

        <div className="eax-tap-stage">
          <Reveal className="eax-qr" delay={120}>
            <div className="eax-qr-frame" aria-hidden>
              <div className="eax-qr-dots" />
              <div className="eax-qr-scanline" />
            </div>
            <span className="eax-qr-label">{chapterTwo.scanLabel}</span>
          </Reveal>

          <div className="eax-tap-cards">
            {chapterTwo.experiences.map((exp, i) => (
              <Reveal key={exp.title} as="article" className="eax-tap-card" delay={200 + i * 140}>
                <span className="eax-tap-icon">
                  <Icon name={exp.icon} />
                </span>
                <h3>{exp.title}</h3>
                <p>{exp.copy}</p>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal className="eax-tap-caption" delay={260}>
          {chapterTwo.scanCaption}
        </Reveal>
        <Reveal as="p" className="eax-line-emphasis eax-center" delay={320}>
          {chapterTwo.closing}
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Behind the scenes                                                   */
/* ------------------------------------------------------------------ */

function BehindTheScenes() {
  return (
    <section className="eax-section eax-section-bts">
      <div className="eax-container">
        <ChapterHeading index="·" kicker={behindTheScenes.kicker} />
        <Reveal as="h2" className="eax-section-title eax-center" delay={80}>
          {behindTheScenes.title}
        </Reveal>
        <ul className="eax-bts-grid">
          {behindTheScenes.items.map((item, i) => (
            <Reveal key={item} as="li" className="eax-bts-chip" delay={100 + i * 70}>
              <span className="eax-bts-dot" aria-hidden />
              {item}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Chapter 3 — Every Email Builds Trust                                */
/* ------------------------------------------------------------------ */

function ChapterThree() {
  return (
    <section id={chapterThree.id} className="eax-section eax-section-trust">
      <div className="eax-container">
        <ChapterHeading index={chapterThree.index} kicker={chapterThree.kicker} />
        <Reveal as="h2" className="eax-section-title" delay={80}>
          {chapterThree.title}{' '}
          <span className="eax-accent">{chapterThree.titleAccent}</span>
        </Reveal>

        <Reveal className="eax-signature" delay={140}>
          <div className="eax-signature-meta">
            <span className="eax-signature-label">{chapterThree.signatureLabel}</span>
            <span className="eax-signature-note">{chapterThree.signatureNote}</span>
          </div>
          <div className="eax-signature-buttons">
            {chapterThree.signatureButtons.map((label, i) => (
              <span key={label} className="eax-sig-btn" style={{ animationDelay: `${i * 0.12}s` }}>
                {label}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal className="eax-seq-kicker" delay={120}>
          {chapterThree.sequenceKicker}
        </Reveal>
        <div className="eax-seq">
          {chapterThree.sequence.map((email, i) => (
            <Reveal key={email.label} as="article" className="eax-seq-card" delay={140 + i * 120}>
              <span className="eax-seq-num">{email.label}</span>
              <h3>{email.title}</h3>
              <p>{email.copy}</p>
            </Reveal>
          ))}
        </div>

        <Reveal as="p" className="eax-line-emphasis eax-center" delay={200}>
          {chapterThree.closing}
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Chapter 4 — Curiosity Becomes Confidence                            */
/* ------------------------------------------------------------------ */

function ChapterFour() {
  return (
    <section id={chapterFour.id} className="eax-section eax-section-confidence">
      {chapterFour.visual ? <SceneVisual visual={chapterFour.visual} variant="wide" /> : null}
      <div className="eax-container">
        <ChapterHeading index={chapterFour.index} kicker={chapterFour.kicker} />
        <Reveal as="h2" className="eax-section-title" delay={80}>
          {chapterFour.title}
        </Reveal>
        <ul className="eax-pills">
          {chapterFour.pills.map((pill, i) => (
            <Reveal key={pill} as="li" className="eax-pill" delay={80 + i * 60}>
              {pill}
            </Reveal>
          ))}
        </ul>
        <div className="eax-lines">
          {chapterFour.lines.map((line, i) => (
            <Reveal key={line} as="p" className="eax-line" delay={120 + i * 90}>
              {line}
            </Reveal>
          ))}
        </div>
        <Reveal as="p" className="eax-line-emphasis eax-center" delay={260}>
          {chapterFour.closing}
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Chapter 5 — The Moment Everything Changes                           */
/* ------------------------------------------------------------------ */

function ChapterFive() {
  return (
    <section id={chapterFive.id} className="eax-section eax-section-yes">
      {chapterFive.visual ? <SceneVisual visual={chapterFive.visual} variant="tall" /> : null}
      <div className="eax-container">
        <ChapterHeading index={chapterFive.index} kicker={chapterFive.kicker} />
        <ul className="eax-actions">
          {chapterFive.actions.map((action, i) => (
            <Reveal key={action} as="li" className="eax-action" delay={60 + i * 70}>
              {action}
            </Reveal>
          ))}
        </ul>
        <Reveal as="p" className="eax-yes-line" delay={160}>
          {chapterFive.yesLine}
        </Reveal>
        <Reveal as="h2" className="eax-yes-change" delay={240}>
          {chapterFive.changeLine}
        </Reveal>
        <Reveal className="eax-confirm" delay={320}>
          <span className="eax-confirm-check" aria-hidden>✓</span>
          <h3>{chapterFive.confirmation.title}</h3>
          <p>{chapterFive.confirmation.copy}</p>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Chapter 6 — Welcome to Pulse                                        */
/* ------------------------------------------------------------------ */

function ChapterSix() {
  return (
    <section id={chapterSix.id} className="eax-section eax-section-pulse">
      {chapterSix.visual ? <SceneVisual visual={chapterSix.visual} variant="wide" /> : null}
      <div className="eax-container">
        <ChapterHeading index={chapterSix.index} kicker={chapterSix.kicker} />
        <Reveal as="h2" className="eax-section-title" delay={80}>
          {chapterSix.title}
        </Reveal>
        <Reveal className="eax-pulse-sub" delay={120}>
          {chapterSix.subtitle}
        </Reveal>

        <div className="eax-pulse-stage">
          <div className="eax-pulse-tiles">
            {chapterSix.tiles.map((tile, i) => (
              <Reveal key={tile} className="eax-pulse-tile" delay={120 + i * 60}>
                {tile}
              </Reveal>
            ))}
          </div>

          <Reveal className="eax-guide" delay={200}>
            <span className="eax-guide-orb" aria-hidden />
            <div className="eax-guide-body">
              <span className="eax-guide-name">{chapterSix.guide.name}</span>
              <ul>
                {chapterSix.guide.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        <Reveal as="p" className="eax-line-emphasis eax-center" delay={240}>
          {chapterSix.closing}
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Chapter 7 — The Invisible Experience                                */
/* ------------------------------------------------------------------ */

function ChapterSeven() {
  return (
    <section id={chapterSeven.id} className="eax-section eax-section-invisible">
      {chapterSeven.visual ? <SceneVisual visual={chapterSeven.visual} variant="wide" /> : null}
      <div className="eax-container">
        <ChapterHeading index={chapterSeven.index} kicker={chapterSeven.kicker} />
        <Reveal as="h2" className="eax-section-title" delay={80}>
          {chapterSeven.title}{' '}
          <span className="eax-accent">{chapterSeven.subtitle}</span>
        </Reveal>
        <ul className="eax-invisible-grid">
          {chapterSeven.items.map((item, i) => (
            <Reveal key={item} as="li" className="eax-invisible-item" delay={60 + i * 50}>
              {item}
            </Reveal>
          ))}
        </ul>
        <Reveal as="p" className="eax-line-emphasis eax-center" delay={220}>
          {chapterSeven.closing}
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* The Reveal — the full journey                                       */
/* ------------------------------------------------------------------ */

function TheReveal() {
  return (
    <section className="eax-section eax-section-reveal">
      <div className="eax-container">
        <ChapterHeading index="·" kicker={reveal.kicker} />
        <ol className="eax-flow">
          {reveal.flow.map((step, i) => (
            <Reveal key={step} as="li" className="eax-flow-step" delay={60 + i * 80}>
              <span className="eax-flow-node">{step}</span>
            </Reveal>
          ))}
        </ol>
        <Reveal as="h2" className="eax-section-title eax-center" delay={120}>
          {reveal.title}{' '}
          <span className="eax-accent">{reveal.titleAccent}</span>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Final Reveal — Pulse with orbiting capabilities                     */
/* ------------------------------------------------------------------ */

function FinalReveal() {
  return (
    <section className="eax-section eax-section-orbit">
      <div className="eax-container">
        <div className="eax-orbit-stage" aria-label="Pulse capabilities">
          <div className="eax-orbit-core">
            <span className="eax-orbit-core-label">{finalReveal.centerLabel}</span>
            <span className="eax-orbit-core-sub">{finalReveal.centerSub}</span>
          </div>
          <ul className="eax-orbit-ring" aria-hidden={false}>
            {finalReveal.orbit.map((word, i) => {
              const angle = (360 / finalReveal.orbit.length) * i;
              return (
                <li
                  key={word}
                  className="eax-orbit-word"
                  style={{ ['--eax-angle' as string]: `${angle}deg` }}
                >
                  <span>{word}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Finale — Consider the Possibilities                                 */
/* ------------------------------------------------------------------ */

function Finale() {
  return (
    <section className="eax-section eax-section-finale">
      {finale.visual ? <SceneVisual visual={finale.visual} variant="wide" /> : null}
      <div className="eax-container">
        <div className="eax-finale-prompt">
          {finale.prompt.map((line, i) => (
            <Reveal key={line} as="p" className="eax-finale-line" delay={i * 120}>
              {line}
            </Reveal>
          ))}
        </div>

        <div className="eax-finale-unique">
          {finale.uniqueness.map((line, i) => (
            <Reveal key={line} as="p" className="eax-line" delay={i * 90}>
              {line}
            </Reveal>
          ))}
        </div>

        <ul className="eax-your">
          {finale.yourLabels.map((label, i) => (
            <Reveal key={label} as="li" className="eax-your-item" delay={80 + i * 90}>
              {label}
            </Reveal>
          ))}
        </ul>

        <Reveal className="eax-invite" delay={120}>
          <span className="eax-invite-brand">{finale.invitation.brand}</span>
          <p className="eax-invite-question">
            {finale.invitation.question}{' '}
            <span className="eax-accent">{finale.invitation.questionAccent}</span>
          </p>
          <div className="eax-invite-body">
            {finale.invitation.body.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <Link href={finale.invitation.cta.href} className="eax-btn eax-btn-primary eax-btn-lg">
            {finale.invitation.cta.label}
          </Link>
          <Link href={finale.invitation.secondaryCta.href} className="eax-btn eax-btn-secondary eax-btn-lg">
            {finale.invitation.secondaryCta.label}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Root                                                                */
/* ------------------------------------------------------------------ */

export default function EAExperienceLab() {
  return (
    <main className="eax">
      <Opening />
      <Hero />
      <ChapterOne />
      <ChapterTwo />
      <BehindTheScenes />
      <ChapterThree />
      <ChapterFour />
      <ChapterFive />
      <ChapterSix />
      <ChapterSeven />
      <TheReveal />
      <FinalReveal />
      <Finale />
    </main>
  );
}

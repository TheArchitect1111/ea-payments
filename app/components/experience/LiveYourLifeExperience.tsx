'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useCallback, useState } from 'react';
import {
  bottomCta,
  chapter1,
  chapter10,
  chapter2,
  chapter3,
  chapter4,
  chapter5,
  chapter6,
  chapter7,
  chapter8,
  chapter9,
  connectedSection,
  finalScreen,
  missionIntro,
  openingHero,
  type ConsiderChoice,
} from '@/lib/live-your-life';

const ease = [0.22, 1, 0.36, 1] as const;

function ScenePhoto({
  src,
  alt,
  priority = false,
  position,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  position?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`lyl-photo${failed ? ' is-missing' : ''}`}>
      {!failed && (
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          style={position ? { objectPosition: position } : undefined}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.85, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

function StoryPanel({ story }: { story: (typeof chapter7.stories)[number] }) {
  return (
    <section className="lyl-story" aria-labelledby={`story-${story.id}`}>
      <div className="lyl-story-bg">
        <ScenePhoto src={story.image} alt={story.imageAlt} />
      </div>
      <div className="lyl-story-scrim" aria-hidden="true" />
      <div className="lyl-story-body">
        <div className="lyl-story-copy">
          <p className="lyl-story-role">{story.role}</p>
          <h3 id={`story-${story.id}`}>{story.headline}</h3>
          <p className="lyl-story-sentence">{story.sentence}</p>
        </div>
        <ul className="lyl-float-cards" aria-label="Systems working quietly">
          {story.cards.map((card) => (
            <li key={card.label} className="lyl-float-card">
              <span className="lyl-float-icon" aria-hidden="true">
                {card.icon}
              </span>
              <span className="lyl-float-label">{card.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ConsiderJourney() {
  const reduce = useReducedMotion();
  const [selected, setSelected] = useState<ConsiderChoice | null>(null);
  const [reflection, setReflection] = useState('');
  const [step, setStep] = useState<'choose' | 'reflect' | 'next'>('choose');

  const pick = useCallback((choice: ConsiderChoice) => {
    setSelected(choice);
    setReflection('');
    setStep('reflect');
    document.getElementById('lyl-conversation')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  return (
    <section className="lyl-consider" id="chapter-10" aria-labelledby="lyl-consider-title">
      <div className="lyl-container">
        <Reveal className="lyl-consider-head">
          <h2 id="lyl-consider-title">{chapter10.title}</h2>
          <p>{chapter10.question}</p>
        </Reveal>
        <div className="lyl-choice-grid">
          {chapter10.choices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              className={`lyl-choice${selected?.id === choice.id ? ' is-active' : ''}`}
              onClick={() => pick(choice)}
              aria-pressed={selected?.id === choice.id}
            >
              <span className="lyl-choice-visual">
                <img src={choice.image} alt="" loading="lazy" decoding="async" />
                <span className="lyl-choice-icon" aria-hidden="true">
                  {choice.icon}
                </span>
              </span>
              <span className="lyl-choice-label">{choice.label}</span>
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          {selected && step !== 'choose' ? (
            <motion.div
              id="lyl-conversation"
              key={`${selected.id}-${step}`}
              className="lyl-conversation"
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.45, ease }}
            >
              <p className="lyl-convo-opener">{selected.opener}</p>
              {step === 'reflect' ? (
                <>
                  <p className="lyl-convo-prompt">Which resonates most?</p>
                  <ul className="lyl-convo-chips">
                    {selected.prompts.map((prompt) => (
                      <li key={prompt}>
                        <button
                          type="button"
                          className="lyl-convo-chip"
                          onClick={() => {
                            setReflection(prompt);
                            setStep('next');
                          }}
                        >
                          {prompt}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
              {step === 'next' ? (
                <>
                  <blockquote className="lyl-convo-quote">&ldquo;{reflection}&rdquo;</blockquote>
                  <p className="lyl-convo-bridge">
                    That is exactly the kind of freedom intentionally designed systems create.
                  </p>
                  <div className="lyl-convo-actions">
                    <Link
                      href={`/contact?interest=${encodeURIComponent(selected.id)}&focus=${encodeURIComponent(reflection)}`}
                      className="lyl-btn lyl-btn-solid"
                    >
                      Start the Conversation
                    </Link>
                  </div>
                </>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}

export default function LiveYourLifeExperience() {
  const reduce = useReducedMotion();
  const heroMotion = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 32 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 1, ease },
      };

  return (
    <main className="lyl" id="main-content">
      <header className="lyl-nav">
        <Link href="/" className="lyl-brand" aria-label="Efficiency Architects home">
          <Image src="/ea-logo.png" alt="" width={32} height={32} priority />
          <span>Efficiency Architects</span>
        </Link>
        <a href="#chapter-10" className="lyl-nav-cta">
          Consider The Possibilities!
        </a>
      </header>

      {/* Opening */}
      <section className="lyl-hero" aria-labelledby="lyl-hero-title">
        <ScenePhoto src={openingHero.image} alt={openingHero.imageAlt} priority />
        <div className="lyl-hero-scrim" aria-hidden="true" />
        <motion.div className="lyl-hero-copy" {...heroMotion}>
          <p className="lyl-eyebrow">{openingHero.eyebrow}</p>
          <h1 id="lyl-hero-title">{openingHero.headline}</h1>
          <p className="lyl-hero-sub">{openingHero.subheadline}</p>
          <a href={openingHero.cta.href} className="lyl-btn lyl-btn-solid">
            {openingHero.cta.label}
          </a>
        </motion.div>
      </section>

      {/* Mission — Every organization exists for a reason */}
      <section className="lyl-chapter lyl-mission" id={missionIntro.id} aria-labelledby="lyl-mission-title">
        <div className="lyl-container lyl-mission-inner">
          <Reveal>
            <h2 id="lyl-mission-title" className="lyl-mission-lead">
              {missionIntro.lead}
            </h2>
          </Reveal>
          <Reveal className="lyl-mission-reasons" delay={0.05}>
            {missionIntro.reasons.map((r) => (
              <span key={r} className="lyl-mission-reason">
                {r}
              </span>
            ))}
          </Reveal>
          <Reveal className="lyl-mission-body" delay={0.1}>
            {missionIntro.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Chapter 1 — Why Did You Start? */}
      <section className="lyl-chapter lyl-ch1" id={chapter1.id} aria-labelledby="lyl-ch1-title">
        <div className="lyl-container">
          <Reveal className="lyl-ch-head">
            <h2 id="lyl-ch1-title">{chapter1.title}</h2>
            <p>{chapter1.intro}</p>
          </Reveal>
        </div>
        <div className="lyl-purpose-stack">
          {chapter1.questions.map((q, i) => (
            <article key={q.text} className="lyl-purpose-panel">
              <div className="lyl-purpose-bg">
                <ScenePhoto src={q.image} alt={q.alt} priority={i === 0} />
              </div>
              <div className="lyl-purpose-scrim" aria-hidden="true" />
              <Reveal className="lyl-purpose-copy" delay={i * 0.05}>
                <p className="lyl-purpose-q">{q.text}</p>
              </Reveal>
            </article>
          ))}
        </div>
      </section>

      {/* Chapter 2 — Somewhere Along the Way */}
      <section className="lyl-chapter lyl-ch2" id={chapter2.id} aria-labelledby="lyl-ch2-title">
        <div className="lyl-ch2-visual">
          <ScenePhoto src={chapter2.image} alt={chapter2.imageAlt} />
          <div className="lyl-ch2-scrim" aria-hidden="true" />
        </div>
        <div className="lyl-container lyl-ch2-body">
          <Reveal className="lyl-ch-head lyl-ch-head-light">
            <h2 id="lyl-ch2-title">{chapter2.title}</h2>
            <p>{chapter2.intro}</p>
          </Reveal>
          <ul className="lyl-invisible-grid" aria-label="Invisible work">
            {chapter2.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <Reveal>
            <p className="lyl-ch2-close">{chapter2.closing}</p>
          </Reveal>
        </div>
      </section>

      {/* Chapter 3 — Imagine Instead */}
      <section className="lyl-chapter lyl-ch3" id={chapter3.id} aria-labelledby="lyl-ch3-title">
        <div className="lyl-container">
          <Reveal className="lyl-ch-head">
            <h2 id="lyl-ch3-title">{chapter3.title}</h2>
            <p>{chapter3.intro}</p>
          </Reveal>
          <div className="lyl-imagine-grid">
            {chapter3.scenes.map((scene) => (
              <figure key={scene.label} className="lyl-imagine-card">
                <div className="lyl-imagine-img">
                  <ScenePhoto src={scene.image} alt={scene.alt} />
                </div>
                <figcaption>{scene.label}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Connected — new theme + phone with connected people */}
      <section className="lyl-connected" id={connectedSection.id} aria-labelledby="lyl-connected-title">
        <div className="lyl-container lyl-connected-grid">
          <Reveal className="lyl-connected-copy">
            <h2 id="lyl-connected-title" className="lyl-connected-theme">
              {connectedSection.theme}
            </h2>
            <p className="lyl-connected-body">{connectedSection.body}</p>
          </Reveal>
          <Reveal className="lyl-connected-visual" delay={0.1}>
            <img
              src={connectedSection.image}
              alt={connectedSection.imageAlt}
              loading="lazy"
              decoding="async"
            />
          </Reveal>
        </div>
      </section>

      {/* Chapter 4 — What If... */}
      <section className="lyl-chapter lyl-ch4" id={chapter4.id} aria-labelledby="lyl-ch4-title">
        <div className="lyl-ch4-bg">
          <ScenePhoto src={chapter4.image} alt={chapter4.imageAlt} />
          <div className="lyl-ch4-scrim" aria-hidden="true" />
        </div>
        <div className="lyl-container lyl-ch4-body">
          <Reveal className="lyl-ch-head lyl-ch-head-light">
            <h2 id="lyl-ch4-title">{chapter4.title}</h2>
            {chapter4.intro ? <p>{chapter4.intro}</p> : null}
          </Reveal>
          <ul className="lyl-whatif-list">
            {chapter4.questions.map((q) => (
              <li key={q}>
                <span className="lyl-whatif-prefix">What if...</span>
                {q}
              </li>
            ))}
          </ul>
          <Reveal>
            <p className="lyl-whatif-close">{chapter4.closing}</p>
          </Reveal>
        </div>
      </section>

      {/* Chapter 5 — We Believe */}
      <section className="lyl-chapter lyl-ch5" id={chapter5.id} aria-labelledby="lyl-ch5-title">
        <div className="lyl-container lyl-ch5-grid">
          <Reveal className="lyl-ch5-copy">
            <h2 id="lyl-ch5-title">{chapter5.title}</h2>
            <p className="lyl-ch5-intro">{chapter5.intro}</p>
            <ul className="lyl-beliefs">
              {chapter5.beliefs.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <p className="lyl-ch5-close">{chapter5.closing}</p>
          </Reveal>
          <Reveal className="lyl-ch5-visual" delay={0.1}>
            <ScenePhoto src={chapter5.image} alt={chapter5.imageAlt} />
          </Reveal>
        </div>
      </section>

      {/* Chapter 6 — How We Think */}
      <section className="lyl-chapter lyl-ch6" id={chapter6.id} aria-labelledby="lyl-ch6-title">
        <div className="lyl-container">
          <Reveal className="lyl-ch-head lyl-ch-head-light">
            <h2 id="lyl-ch6-title">{chapter6.title}</h2>
            <p>{chapter6.intro}</p>
          </Reveal>
          <ol className="lyl-blueprint" aria-label="Methodology">
            {chapter6.steps.map((step, i) => (
              <li key={step.label} className="lyl-blueprint-step">
                <span className="lyl-blueprint-node">{step.label}</span>
                <p>{step.note}</p>
                {i < chapter6.steps.length - 1 ? (
                  <span className="lyl-blueprint-arrow" aria-hidden="true">
                    ↓
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Chapter 7 — Imagine the Possibilities */}
      <section className="lyl-chapter lyl-ch7" id={chapter7.id} aria-labelledby="lyl-ch7-title">
        <div className="lyl-container">
          <Reveal className="lyl-ch-head lyl-ch-head-light">
            <h2 id="lyl-ch7-title">{chapter7.title}</h2>
            <p>{chapter7.intro}</p>
          </Reveal>
        </div>
        <div className="lyl-stories">
          {chapter7.stories.map((story) => (
            <StoryPanel key={story.id} story={story} />
          ))}
        </div>
      </section>

      {/* Chapter 8 — Why Custom Matters */}
      <section className="lyl-chapter lyl-ch8" id={chapter8.id} aria-labelledby="lyl-ch8-title">
        <div className="lyl-ch8-visual">
          <ScenePhoto src={chapter8.image} alt={chapter8.imageAlt} />
          <div className="lyl-ch8-scrim" aria-hidden="true" />
        </div>
        <div className="lyl-container lyl-ch8-body">
          <Reveal className="lyl-ch-head lyl-ch-head-light">
            <h2 id="lyl-ch8-title">{chapter8.title}</h2>
            {chapter8.intro ? <p>{chapter8.intro}</p> : null}
          </Reveal>
          <ul className="lyl-custom-points">
            {chapter8.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <Reveal>
            <p className="lyl-ch8-conclusion">{chapter8.conclusion}</p>
          </Reveal>
        </div>
      </section>

      {/* Chapter 9 — Everything Connected */}
      <section className="lyl-chapter lyl-ch9" id={chapter9.id} aria-labelledby="lyl-ch9-title">
        <div className="lyl-container">
          <Reveal className="lyl-ch9-head">
            <p className="lyl-eyebrow">{chapter9.title}</p>
            <h2 id="lyl-ch9-title">
              {chapter9.headline}
              <span className="lyl-gold">{chapter9.headlineAccent}</span>
            </h2>
            <p>{chapter9.subheadline}</p>
          </Reveal>
          <Reveal className="lyl-eco-tags" delay={0.1}>
            {chapter9.ecosystem.map((tag) => (
              <span key={tag} className="lyl-eco-tag">
                {tag}
              </span>
            ))}
          </Reveal>
          <Reveal className="lyl-ch9-stage" delay={0.15}>
            <figure className="lyl-pulse-shot">
              <img src={chapter9.dashboardImage} alt={chapter9.dashboardAlt} loading="lazy" decoding="async" />
              <figcaption>{chapter9.caption}</figcaption>
            </figure>
          </Reveal>
          <Reveal className="lyl-ch9-quote" delay={0.2}>
            <blockquote className="lyl-quote-card">
              {chapter9.quote.lines.map((line) => (
                <span key={line} className="lyl-quote-line">
                  {line}
                </span>
              ))}
              <cite className="lyl-quote-attr">{chapter9.quote.attribution}</cite>
            </blockquote>
          </Reveal>
        </div>
      </section>

      {/* Chapter 10 — Consider */}
      <ConsiderJourney />

      {/* Final Screen */}
      <section className="lyl-final" aria-labelledby="lyl-final-title">
        <div className="lyl-final-bg">
          <ScenePhoto src={finalScreen.image} alt={finalScreen.imageAlt} />
          <div className="lyl-final-scrim" aria-hidden="true" />
        </div>
        <div className="lyl-container lyl-final-body">
          <ul className="lyl-final-themes" aria-label="What matters">
            {finalScreen.themes.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <Reveal className="lyl-final-copy">
            <h2 id="lyl-final-title">{finalScreen.headline}</h2>
            <p>{finalScreen.message}</p>
            <a href={finalScreen.cta.href} className="lyl-btn lyl-btn-solid">
              {finalScreen.cta.label}
            </a>
          </Reveal>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="lyl-bottom-cta" aria-labelledby="lyl-bottom-cta-title">
        <div className="lyl-container">
          <Reveal className="lyl-bottom-cta-inner">
            <h2 id="lyl-bottom-cta-title">{bottomCta.theme}</h2>
            <p>{bottomCta.message}</p>
            <Link href={bottomCta.cta.href} className="lyl-btn lyl-btn-solid">
              {bottomCta.cta.label}
            </Link>
          </Reveal>
        </div>
      </section>

      <footer className="lyl-footer">
        <p>Efficiency Architects · Live YOUR Life™</p>
        <nav aria-label="Legal">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </footer>
    </main>
  );
}

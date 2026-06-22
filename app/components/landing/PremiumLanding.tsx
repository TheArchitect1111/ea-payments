'use client';

import Image from 'next/image';
import Link from 'next/link';
import HeroMontage from './HeroMontage';
import ConsiderScroll from './ConsiderScroll';
import Reveal from './Reveal';

const GALLERY = [
  {
    src: 'https://images.unsplash.com/photo-1511895426328-ac872781f227?auto=format&fit=crop&w=1200&q=85',
    caption: 'Family dinner',
  },
  {
    src: 'https://images.unsplash.com/photo-1593113598148-3655c4d566bb?auto=format&fit=crop&w=1200&q=85',
    caption: 'Coach mentoring athlete',
  },
  {
    src: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1200&q=85',
    caption: 'Serving community',
  },
  {
    src: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=85',
    caption: 'Business growth',
  },
  {
    src: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=85',
    caption: 'Teacher and student',
  },
  {
    src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=85',
    caption: 'Volunteer changing a life',
  },
];

const POSSIBILITIES = [
  'More time.',
  'More opportunities.',
  'More impact.',
  'More confidence.',
  'More freedom.',
  'More life.',
];

const MISSION_LINES = [
  'To build.',
  'To serve.',
  'To teach.',
  'To coach.',
  'To lead.',
  'To create.',
  'To make a difference.',
];

export default function PremiumLanding() {
  return (
    <main className="pl-site">
      <header className="pl-nav">
        <Link href="/" className="pl-brand" aria-label="Efficiency Architects home">
          <Image src="/ea-logo.png" alt="" width={36} height={36} priority />
          <span>Efficiency Architects</span>
        </Link>
        <Link href="/assessment" className="pl-nav-link">
          Discover
        </Link>
      </header>

      {/* HERO — cinematic montage, three words */}
      <section className="pl-hero" id="top">
        <HeroMontage />
        <div className="pl-hero-content">
          <Reveal>
            <h1 className="pl-hero-title">DISCOVER THE POSSIBILITIES.</h1>
          </Reveal>
          <Reveal delay={0.12}>
            <ul className="pl-hero-sub">
              {POSSIBILITIES.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.2}>
            <Link href="/assessment" className="pl-cta">
              Discover What&apos;s Possible
            </Link>
          </Reveal>
        </div>
        <div className="pl-scroll-hint" aria-hidden="true">
          <span />
        </div>
      </section>

      {/* SECTION TWO */}
      <section className="pl-section pl-section-breathe" id="imagine">
        <div className="pl-wrap pl-wrap-narrow">
          <Reveal>
            <h2 className="pl-headline">What Would Become Possible?</h2>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="pl-prose pl-prose-large">
              <p>What would become possible if your time was spent on what matters most?</p>
              <p>What opportunities would you pursue?</p>
              <p>Who would you spend more time with?</p>
              <p>What impact could you create?</p>
              <p>What dream would finally have room to grow?</p>
            </div>
          </Reveal>
        </div>
        <div className="pl-gallery-track" aria-label="Moments of possibility">
          {GALLERY.map((item, i) => (
            <Reveal key={item.caption} delay={i * 0.04} className="pl-gallery-slide">
              <figure className="pl-gallery-figure">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.src} alt={item.caption} loading="lazy" />
                <figcaption>{item.caption}</figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* SECTION THREE */}
      <section className="pl-section">
        <div className="pl-wrap">
          <Reveal>
            <h2 className="pl-headline">You Started With A Mission.</h2>
          </Reveal>
          <Reveal delay={0.06}>
            <ul className="pl-mission-list">
              {MISSION_LINES.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="pl-mission-close">
              Imagine having more room for that.
            </p>
          </Reveal>
        </div>
        <Reveal className="pl-immersive-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="pl-immersive"
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2400&q=88"
            alt="Diverse leaders doing meaningful work — purpose, impact, and mission"
            loading="lazy"
          />
        </Reveal>
        <p className="pl-immersive-caption pl-wrap pl-wrap-narrow">
          No administration. No paperwork. No management. No technology.
          <br />
          Only purpose. Only impact. Only mission.
        </p>
      </section>

      {/* SECTION FOUR — CONSIDER THIS */}
      <section className="pl-section pl-section-consider" id="consider">
        <div className="pl-wrap pl-wrap-narrow pl-consider-intro">
          <Reveal>
            <h2 className="pl-headline">CONSIDER THIS.</h2>
          </Reveal>
        </div>
        <ConsiderScroll />
      </section>

      {/* SECTION FIVE */}
      <section className="pl-section pl-section-sunrise">
        <Reveal className="pl-sunrise-visual">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1527529487837-d4698031be93?auto=format&fit=crop&w=2400&q=88"
            alt="Diverse leaders overlooking a city at sunrise — quiet confidence and forward momentum"
            loading="lazy"
          />
        </Reveal>
        <div className="pl-wrap pl-wrap-narrow pl-sunrise-copy">
          <Reveal>
            <h2 className="pl-headline pl-headline-light">A DIFFERENT FUTURE IS POSSIBLE.</h2>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="pl-prose pl-prose-light">
              <p>Most people don&apos;t need more effort.</p>
              <p>Most people don&apos;t need more information.</p>
              <p>Most people simply haven&apos;t seen another way.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* SECTION SIX */}
      <section className="pl-section pl-section-final" id="discover">
        <div className="pl-wrap pl-wrap-narrow pl-final">
          <Reveal>
            <h2 className="pl-headline">LET&apos;S DISCOVER WHAT&apos;S POSSIBLE.</h2>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="pl-prose">
              <p>This experience helps uncover:</p>
              <ul className="pl-discover-list">
                <li>New opportunities.</li>
                <li>Hidden possibilities.</li>
                <li>Areas of growth.</li>
                <li>Future potential.</li>
                <li>And a clearer path forward.</li>
              </ul>
              <p className="pl-final-note">
                The goal is not to tell you what&apos;s wrong.
                <br />
                The goal is to help you see what might be possible.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <Link href="/assessment" className="pl-cta pl-cta-dark">
              Discover Your Possibilities
            </Link>
          </Reveal>
        </div>
      </section>

      <footer className="pl-footer">
        <p className="pl-footer-title">DISCOVER THE POSSIBILITIES.</p>
        <p className="pl-footer-lead">
          Imagine what might become possible if the things slowing you down no longer existed.
        </p>
        <p className="pl-footer-brand">Efficiency Architects.</p>
        <p className="pl-footer-tag">
          More time. More opportunity. More impact. More freedom. More life.
        </p>
        <nav className="pl-footer-nav" aria-label="Footer">
          <Link href="/assessment">Operational MRI™</Link>
          <Link href="/portal/login">Client Portal</Link>
          <Link href="/simplifi">Simplifi</Link>
        </nav>
      </footer>
    </main>
  );
}

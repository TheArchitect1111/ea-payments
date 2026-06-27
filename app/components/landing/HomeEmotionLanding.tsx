'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import {
  experienceStories,
  heroContent,
} from '@/lib/home-emotion';
import ExperienceScene from './ExperienceScene';
import PulseReveal from './PulseReveal';
import ConsiderFlow from './ConsiderFlow';

function HeroImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`he-photo he-hero-bg${failed ? ' is-missing' : ''}`}>
      {!failed && (
        <img
          src={src}
          alt={alt}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

export default function HomeEmotionLanding() {
  const reduce = useReducedMotion();
  const rise = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 28 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <main className="he" id="main-content">
      <header className="he-nav">
        <Link href="/" className="he-brand" aria-label="Efficiency Architects home">
          <Image src="/ea-logo.png" alt="" width={36} height={36} priority />
          <span>Efficiency Architects</span>
        </Link>
        <nav className="he-nav-links" aria-label="Primary">
          <a href="#experiences" className="he-nav-link">
            Experiences
          </a>
          <a href="#pulse" className="he-nav-link">
            Pulse
          </a>
          <a href="#consider" className="he-nav-link">
            Possibilities
          </a>
          <Link href="/contact" className="he-nav-link">
            Contact
          </Link>
          <a href="#consider" className="he-nav-cta">
            Consider the Possibilities™
          </a>
        </nav>
      </header>

      {/* Hero — emotion first, minimal copy */}
      <section className="he-hero" aria-labelledby="hero-title">
        <HeroImage src={heroContent.image} alt={heroContent.imageAlt} />
        <div className="he-hero-scrim" aria-hidden="true" />
        <motion.div className="he-hero-copy" {...rise}>
          <h1 id="hero-title" className="he-hero-headline">
            {heroContent.headline}
          </h1>
          <p className="he-hero-sub">{heroContent.subheadline}</p>
          <div className="he-hero-actions">
            <a href={heroContent.ctaPrimary.href} className="he-cta-solid">
              {heroContent.ctaPrimary.label}
            </a>
            <a href={heroContent.ctaSecondary.href} className="he-cta-ghost">
              {heroContent.ctaSecondary.label}
            </a>
          </div>
        </motion.div>
      </section>

      {/* Six experience stories — same layout, image tells the story */}
      <div className="he-experiences">
        {experienceStories.map((story, index) => (
          <ExperienceScene key={story.id} story={story} index={index} />
        ))}
      </div>

      {/* Pulse reveal — the reward */}
      <PulseReveal />

      {/* Consider the Possibilities — guided conversation, not a form */}
      <ConsiderFlow />

      <footer className="he-footer" id="contact">
        <p className="he-footer-title">Efficiency Architects</p>
        <p className="he-footer-lead">
          Custom systems quietly working in the background, so people remain the hero.
        </p>
        <nav className="he-footer-nav" aria-label="Explore">
          <Link href="/possibilities">Experience Book</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/portal/login">Client Portal</Link>
          <Link href="/simplifi">Simplifi</Link>
        </nav>
        <nav className="he-footer-legal" aria-label="Legal">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/cookies">Cookie Policy</Link>
          <Link href="/accessibility">Accessibility</Link>
        </nav>
      </footer>
    </main>
  );
}

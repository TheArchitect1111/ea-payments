'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import {
  futureSegmentOrder,
  futureSegments,
  storyScenes,
  type FutureKey,
  type StoryScene,
} from '@/lib/landing-story';
import {
  goosebumpsVisual,
  landingHero,
  trustStories,
  waitMomentVisual,
} from '@/lib/landing-visuals';

export default function PremiumLanding() {
  const prefersReducedMotion = useReducedMotion();
  const [activeScene, setActiveScene] = useState(storyScenes[0]);
  const [future, setFuture] = useState<FutureKey>('nonprofit');
  const [showStickyCta, setShowStickyCta] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowStickyCta(window.scrollY > window.innerHeight * 0.85);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>('[data-scene]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.getAttribute('data-scene');
          const scene = storyScenes.find((item) => item.id === id);
          if (scene) setActiveScene(scene);
        });
      },
      { threshold: 0.35, rootMargin: '-10% 0px -35% 0px' },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('ea-guide:story-section', {
      detail: {
        id: activeScene.id,
        title: activeScene.eyebrow,
        message: activeScene.guide,
        example: activeScene.story,
      },
    }));
  }, [activeScene]);

  const futureContent = useMemo(() => futureSegments[future], [future]);
  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 22 } as const,
        animate: { opacity: 1, y: 0 } as const,
        transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <main className="pl-site" id="main-content">
      <header className="pl-nav pl-nav-light">
        <Link href="/" className="pl-brand" aria-label="Efficiency Architects home">
          <Image src="/ea-logo.png" alt="" width={38} height={38} priority />
          <span>Efficiency Architects</span>
        </Link>
        <nav className="pl-nav-links" aria-label="Primary">
          <a href="#possibilities" className="pl-nav-link">
            Imagine
          </a>
          <Link href="/contact" className="pl-nav-link">
            Contact
          </Link>
        </nav>
      </header>

      <section className="pl-cinema-hero" id="top" data-scene="life">
        <div className="pl-hero-visual">
          <img
            src={landingHero.src}
            alt={landingHero.alt}
            fetchPriority="high"
            decoding="async"
            width={1600}
            height={1067}
          />
        </div>
        <motion.div className="pl-hero-copy" {...motionProps}>
          <p className="pl-kicker">Efficiency Architects</p>
          <h1>Your organization has become harder to run.</h1>
          <p>
            Not because people stopped caring. Because the work outgrew the systems holding it together.
          </p>
          <div className="pl-hero-actions">
            <a href="#communication" className="pl-cta">
              Begin the story
            </a>
            <Link href="/assessment" className="pl-cta-solid">
              Take the Operational MRI&trade;
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="pl-wait-moment" data-scene="dependency">
        <div className="pl-wait-visual">
          <img
            src={waitMomentVisual.src}
            alt={waitMomentVisual.alt}
            loading="lazy"
            decoding="async"
            width={1600}
            height={1067}
          />
        </div>
        <p>Everything depends on you.</p>
      </section>

      {storyScenes.slice(1).map((scene, index) => (
        <StorySection key={scene.id} scene={scene} index={index} />
      ))}

      <section className="pl-goosebumps" data-scene="future">
        <div className="pl-goosebumps-copy">
          <p className="pl-kicker">Future State</p>
          <h2>What would become possible if everything didn&apos;t depend on you?</h2>
          <p className="pl-goosebumps-lead">
            The mission becomes the focus again — coaching, serving, leading programs, supporting families, and building
            relationships that matter.
          </p>
        </div>
        <ComparePair
          currentLabel="Current Reality"
          possibleLabel="What's Possible"
          currentImage={goosebumpsVisual.current.src}
          possibleImage={goosebumpsVisual.possible.src}
          currentAlt={goosebumpsVisual.current.alt}
          possibleAlt={goosebumpsVisual.possible.alt}
          priority={false}
        />
      </section>

      <section className="pl-trust" aria-labelledby="trust-title">
        <div className="pl-trust-head">
          <p className="pl-kicker">Client Stories</p>
          <h2 id="trust-title">Leaders who chose clarity, capacity, and possibility.</h2>
        </div>
        <div className="pl-trust-grid">
          {trustStories.map((story) => (
            <article key={story.role} className="pl-trust-card">
              <p className="pl-trust-quote">&ldquo;{story.quote}&rdquo;</p>
              <p className="pl-trust-role">{story.role}</p>
              <p className="pl-trust-outcome">{story.outcome}</p>
            </article>
          ))}
        </div>
        <div className="pl-trust-actions">
          <Link href="/story/selena" className="pl-cta">
            Read a transformation story
          </Link>
          <Link href="/contact" className="pl-cta-solid">
            Book a discovery call
          </Link>
        </div>
      </section>

      <section className="pl-possibility-generator" id="possibilities">
        <div className="pl-generator-shell">
          <p className="pl-kicker">Possibility Generator</p>
          <h2>Imagine The Possibilities&trade;</h2>
          <p>
            What could your organization become if communication, training, visibility, and operations finally worked together?
          </p>
          <div className="pl-segments" role="tablist" aria-label="Choose organization type">
            {futureSegmentOrder.map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={future === key}
                className={future === key ? 'is-active' : ''}
                onClick={() => setFuture(key)}
              >
                {futureSegments[key].label}
              </button>
            ))}
          </div>
          <div className="pl-generator-visual" key={future}>
            <img
              src={futureContent.image}
              alt={futureContent.imageAlt}
              loading="lazy"
              decoding="async"
              width={1200}
              height={675}
            />
            <span className="pl-generator-visual-badge">What&apos;s Possible</span>
          </div>
          <div className="pl-future-lines">
            {futureContent.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <Link href="/assessment" className="pl-cta-solid pl-cta-solid-lg">
            Imagine The Possibilities&trade;
          </Link>
        </div>
      </section>

      <div className={`pl-sticky-cta${showStickyCta ? ' is-visible' : ''}`} aria-hidden={!showStickyCta}>
        <Link href="/assessment" className="pl-cta-solid pl-cta-solid-block">
          Take the Operational MRI&trade;
        </Link>
      </div>

      <footer className="pl-footer">
        <p className="pl-footer-title">Efficiency Architects</p>
        <p className="pl-footer-lead">
          A guided transformation experience for people who are ready to move from dependency to possibility.
        </p>
        <nav className="pl-footer-nav" aria-label="Explore">
          <Link href="/assessment">Operational MRI&trade;</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/story/selena">Client Stories</Link>
          <Link href="/portal/login">Client Portal</Link>
          <Link href="/simplifi">Simplifi</Link>
        </nav>
        <nav className="pl-footer-legal" aria-label="Legal">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/cookies">Cookie Policy</Link>
          <Link href="/accessibility">Accessibility</Link>
          <Link href="/disclaimer">Disclaimer</Link>
        </nav>
      </footer>
    </main>
  );
}

function StorySection({ scene, index }: { scene: StoryScene; index: number }) {
  return (
    <section className="pl-story-scene" id={scene.id} data-scene={scene.id}>
      <div className="pl-scene-copy">
        <p className="pl-kicker">{scene.eyebrow}</p>
        <div className="pl-reality-columns">
          <article>
            <span className="pl-column-label">{scene.currentLabel}</span>
            <h2>{scene.current}</h2>
          </article>
          <article>
            <span className="pl-column-label">{scene.possibleLabel}</span>
            <h2>{scene.possible}</h2>
          </article>
        </div>
        <p className="pl-micro-story">{scene.story}</p>
      </div>
      <ComparePair
        currentLabel={scene.currentLabel}
        possibleLabel={scene.possibleLabel}
        currentImage={scene.currentImage}
        possibleImage={scene.possibleImage}
        currentAlt={scene.currentAlt}
        possibleAlt={scene.possibleAlt}
        priority={index < 1}
      />
    </section>
  );
}

function ComparePair({
  currentLabel,
  possibleLabel,
  currentImage,
  possibleImage,
  currentAlt,
  possibleAlt,
  priority = false,
}: {
  currentLabel: string;
  possibleLabel: string;
  currentImage: string;
  possibleImage: string;
  currentAlt: string;
  possibleAlt: string;
  priority?: boolean;
}) {
  return (
    <div
      className="pl-compare-grid"
      role="group"
      aria-label={`${currentLabel} compared with ${possibleLabel}`}
    >
      <figure className="pl-compare-panel pl-compare-panel-reality">
        <div className="pl-compare-media">
          <img
            src={currentImage}
            alt={currentAlt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            width={1400}
            height={933}
          />
        </div>
        <figcaption>{currentLabel}</figcaption>
      </figure>
      <figure className="pl-compare-panel pl-compare-panel-possible">
        <div className="pl-compare-media">
          <img
            src={possibleImage}
            alt={possibleAlt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            width={1400}
            height={933}
          />
        </div>
        <figcaption>{possibleLabel}</figcaption>
      </figure>
    </div>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import DeviceFrame from './DeviceFrame';
import PulseDashboardShowcase from './PulseDashboardShowcase';
import {
  clientStories,
  currentRealityHero,
  ecosystemCapabilities,
  howItWorks,
  possibleOutcomes,
  recognitionMoments,
  roleScenes,
  type RoleScene,
} from '@/lib/landing-experience';

/** Self-hosted backdrop with a graceful gradient placeholder until the file exists. */
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
    <div className={`hx-photo${failed ? ' is-missing' : ''}${className ? ` ${className}` : ''}`}>
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
        <span className="hx-photo-fallback" aria-label={alt}>
          {alt}
        </span>
      )}
    </div>
  );
}

export default function PremiumLandingV2() {
  const prefersReducedMotion = useReducedMotion();

  const rise = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.35 },
        transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <main className="hx" id="main-content">
      <header className="hx-nav">
        <Link href="/" className="hx-brand" aria-label="Efficiency Architects home">
          <Image src="/ea-logo.png" alt="" width={36} height={36} priority />
          <span>Efficiency Architects</span>
        </Link>
        <nav className="hx-nav-links" aria-label="Primary">
          <a href="#better-way" className="hx-nav-link">A Better Way</a>
          <a href="#pulse" className="hx-nav-link">Pulse</a>
          <Link href="/contact" className="hx-nav-link">Contact</Link>
          <Link href="/assessment" className="hx-nav-cta">Operational MRI&trade;</Link>
        </nav>
      </header>

      {/* Section 1 — Current Reality */}
      <section className="hx-reality" aria-labelledby="reality-title">
        <SceneImage src={currentRealityHero.src} alt={currentRealityHero.alt} priority className="hx-reality-bg" />
        <div className="hx-reality-overlay" aria-hidden="true" />
        <motion.div className="hx-reality-copy" {...rise}>
          <p className="hx-kicker">Imagine The Possibilities&trade;</p>
          <h1 id="reality-title">
            Running an organization shouldn&apos;t feel like running in circles.
          </h1>
          <ul className="hx-reality-moments">
            {recognitionMoments.map((moment) => (
              <li key={moment}>{moment}</li>
            ))}
          </ul>
          <a href="#better-way" className="hx-cta-ghost">See a better way</a>
        </motion.div>
      </section>

      {/* Section 2 — A Better Way */}
      <section className="hx-better" id="better-way" aria-labelledby="better-title">
        <motion.div className="hx-section-head" {...rise}>
          <p className="hx-kicker">A Better Way</p>
          <h2 id="better-title">See what changes when everything works together.</h2>
        </motion.div>
        <div className="hx-scenes">
          {roleScenes.map((scene, index) => (
            <StoryScene key={scene.id} scene={scene} flip={index % 2 === 1} rise={rise} />
          ))}
        </div>
      </section>

      {/* Section 3 — How We Build Your Experience */}
      <section className="hx-build" aria-labelledby="build-title">
        <motion.div className="hx-section-head" {...rise}>
          <p className="hx-kicker">How We Build Your Experience</p>
          <h2 id="build-title">Not a stack of products. One experience, built around you.</h2>
          <p className="hx-lead">
            Every organization receives a custom digital experience shaped around how it actually
            operates. Information flows naturally between every part.
          </p>
        </motion.div>
        <div className="hx-ecosystem">
          {ecosystemCapabilities.map((cap) => (
            <motion.article key={cap.name} className="hx-eco-node" {...rise}>
              <span className="hx-eco-pulse" aria-hidden="true" />
              <h3>{cap.name}</h3>
              <p>{cap.note}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Section 4 — What's Possible */}
      <section className="hx-possible" aria-labelledby="possible-title">
        <motion.div className="hx-section-head" {...rise}>
          <p className="hx-kicker">What&apos;s Possible</p>
          <h2 id="possible-title">
            When your systems work together, your people can do their best work.
          </h2>
        </motion.div>
        <div className="hx-possible-grid">
          {possibleOutcomes.map((item) => (
            <motion.figure key={item.line} className="hx-possible-card" {...rise}>
              <SceneImage src={item.image} alt={item.alt} />
              <figcaption>{item.line}</figcaption>
            </motion.figure>
          ))}
        </div>
      </section>

      {/* Section 5 — How It Works */}
      <section className="hx-steps" aria-labelledby="steps-title">
        <motion.div className="hx-section-head" {...rise}>
          <p className="hx-kicker">How It Works</p>
          <h2 id="steps-title">Simple, start to finish.</h2>
        </motion.div>
        <ol className="hx-steps-row">
          {howItWorks.map((s, i) => (
            <motion.li key={s.step} className="hx-step" {...rise}>
              <span className="hx-step-num">{String(i + 1).padStart(2, '0')}</span>
              <h3>{s.step}</h3>
              <p>{s.note}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* Section 6 — Organizations We've Helped */}
      <section className="hx-clients" aria-labelledby="clients-title">
        <motion.div className="hx-section-head" {...rise}>
          <p className="hx-kicker">Organizations We&apos;ve Helped</p>
          <h2 id="clients-title">Real transformations, not logos.</h2>
        </motion.div>
        <div className="hx-clients-grid">
          {clientStories.map((story) => (
            <motion.article key={story.org} className="hx-client-card" {...rise}>
              <SceneImage src={story.image} alt={`${story.org} — ${story.kind}`} className="hx-client-photo" />
              <div className="hx-client-body">
                <p className="hx-client-kind">{story.kind}</p>
                <h3>{story.org}</h3>
                <dl className="hx-client-arc">
                  <div>
                    <dt>Challenge</dt>
                    <dd>{story.challenge}</dd>
                  </div>
                  <div>
                    <dt>Solution</dt>
                    <dd>{story.solution}</dd>
                  </div>
                  <div>
                    <dt>Outcome</dt>
                    <dd>{story.outcome}</dd>
                  </div>
                </dl>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Section 7 — Pulse */}
      <section className="hx-pulse" id="pulse" aria-labelledby="pulse-title">
        <motion.div className="hx-section-head" {...rise}>
          <p className="hx-kicker">Pulse</p>
          <h2 id="pulse-title">Your command center. One calm view of everything.</h2>
          <p className="hx-lead">
            Communication, training, engagement, opportunities, and organization health — together,
            so leaders gain confidence instead of chasing information.
          </p>
        </motion.div>
        <motion.div className="hx-pulse-stage" {...rise}>
          <PulseDashboardShowcase />
        </motion.div>
      </section>

      {/* Section 8 — Begin What's Possible */}
      <section className="hx-begin" aria-labelledby="begin-title">
        <motion.div className="hx-begin-copy" {...rise}>
          <p className="hx-kicker">Begin What&apos;s Possible</p>
          <h2 id="begin-title">
            What could your organization become if everything worked together?
          </h2>
          <p className="hx-lead">
            Start with the Operational MRI&trade; — a clear first step toward a calmer, more capable
            organization.
          </p>
          <Link href="/assessment" className="hx-cta-solid">Take the Operational MRI&trade;</Link>
        </motion.div>
      </section>

      <footer className="hx-footer">
        <p className="hx-footer-title">Efficiency Architects</p>
        <p className="hx-footer-lead">
          Helping organizations become easier to run — so people can do their best work.
        </p>
        <nav className="hx-footer-nav" aria-label="Explore">
          <Link href="/assessment">Operational MRI&trade;</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/story/selena">Client Stories</Link>
          <Link href="/portal/login">Client Portal</Link>
          <Link href="/simplifi">Simplifi</Link>
        </nav>
        <nav className="hx-footer-legal" aria-label="Legal">
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

function StoryScene({
  scene,
  flip,
  rise,
}: {
  scene: RoleScene;
  flip: boolean;
  rise: Record<string, unknown>;
}) {
  return (
    <motion.article className={`hx-scene${flip ? ' is-flipped' : ''}`} {...rise}>
      <div className="hx-scene-media">
        <SceneImage src={scene.image} alt={scene.imageAlt} />
        <DeviceFrame device={scene.device} screen={scene.screen} className="hx-scene-device" />
      </div>
      <div className="hx-scene-copy">
        <p className="hx-kicker">{scene.role}</p>
        <h3>{scene.headline}</h3>
        <p className="hx-scene-narrative">{scene.narrative}</p>
      </div>
    </motion.article>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import DeviceFrame from './DeviceFrame';
import {
  buildSectionLead,
  clientStories,
  currentRealityHero,
  ecosystemCapabilities,
  howItWorks,
  possibleOutcomes,
  pulseMockup,
  recognitionMoments,
  roleScenes,
  sectionHeroes,
  type ClientIcon,
  type HowStepIcon,
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

      {/* Section 2 — A Better Way (full-bleed cinematic scenes) */}
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
        <div className="hx-build-hero">
          <SceneImage src={sectionHeroes.build.src} alt={sectionHeroes.build.alt} />
          <div className="hx-build-hero-scrim" aria-hidden="true" />
          <motion.div className="hx-build-hero-copy" {...rise}>
            <p className="hx-kicker">How We Build Your Experience</p>
            <h2 id="build-title">Not a stack of products. One experience, built around you.</h2>
            <p className="hx-lead">{buildSectionLead}</p>
          </motion.div>
        </div>
        <div className="hx-ecosystem" aria-label="Capabilities in one connected ecosystem">
          <span className="hx-eco-flow" aria-hidden="true" />
          {ecosystemCapabilities.map((cap, i) => (
            <motion.article
              key={cap.name}
              className="hx-eco-node"
              style={{ ['--node-i' as string]: String(i) }}
              {...rise}
            >
              <span className="hx-eco-port" aria-hidden="true" />
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
        <div className="hx-steps-hero">
          <SceneImage src={sectionHeroes.steps.src} alt={sectionHeroes.steps.alt} />
          <div className="hx-steps-hero-scrim" aria-hidden="true" />
          <motion.div className="hx-steps-hero-copy" {...rise}>
            <p className="hx-kicker">How It Works</p>
            <h2 id="steps-title">Simple, start to finish.</h2>
          </motion.div>
        </div>
        <ol className="hx-steps-row">
          {howItWorks.map((s, i) => (
            <motion.li key={s.step} className="hx-step" {...rise}>
              <span className="hx-step-num">{String(i + 1).padStart(2, '0')}</span>
              <StepIcon icon={s.icon} />
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
            <motion.article key={story.org} className={`hx-client-card hx-client-card--${story.icon}`} {...rise}>
              <div className="hx-client-art" aria-hidden="true">
                <ClientArtIcon icon={story.icon} />
              </div>
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
                </dl>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Section 7 — Pulse command center (real Pulse portal) */}
      <section className="hx-pulse" id="pulse" aria-labelledby="pulse-title">
        <div className="hx-pulse-inner">
          <motion.div className="hx-section-head hx-pulse-head" {...rise}>
            <p className="hx-kicker">Pulse</p>
            <h2 id="pulse-title">Your command center. One calm view of everything.</h2>
            <p className="hx-lead">
              The place leaders gain confidence, not another application to manage.
            </p>
          </motion.div>
          <motion.figure className="hx-pulse-shot" {...rise}>
            <SceneImage src={pulseMockup.src} alt={pulseMockup.alt} />
          </motion.figure>
        </div>
      </section>

      {/* Section 8 — Begin What's Possible */}
      <section className="hx-begin" aria-labelledby="begin-title">
        <motion.div className="hx-begin-copy" {...rise}>
          <p className="hx-kicker">Begin What&apos;s Possible</p>
          <h2 id="begin-title">
            What could your organization become if everything worked together?
          </h2>
          <p className="hx-lead">
            Start with the Operational MRI&trade;. A clear first step toward a calmer, more capable
            organization.
          </p>
          <Link href="/assessment" className="hx-cta-solid">Take the Operational MRI&trade;</Link>
        </motion.div>
      </section>

      <footer className="hx-footer">
        <p className="hx-footer-title">Efficiency Architects</p>
        <p className="hx-footer-lead">
          Helping organizations become easier to run, so people can do their best work.
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
  const articleClass = [
    'hx-scene',
    `hx-scene--${scene.id}`,
    flip ? 'is-flipped' : '',
    scene.brightScene ? 'is-bright' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <motion.article className={articleClass} {...rise}>
      <div className="hx-scene-bg">
        <SceneImage src={scene.image} alt={scene.imageAlt} />
      </div>
      <div className="hx-scene-scrim" aria-hidden="true" />
      <div className="hx-scene-inner">
        <div className="hx-scene-copy">
          <p className="hx-kicker">{scene.role}</p>
          <h3>{scene.headline}</h3>
          <p className="hx-scene-narrative">{scene.narrative}</p>
        </div>
        {scene.mockup ? (
          <div className={`hx-scene-device hx-scene-mockup${scene.mockupRounded ? ' is-rounded' : ''}`}>
            <img src={scene.mockup} alt={scene.mockupAlt ?? ''} loading="lazy" decoding="async" />
          </div>
        ) : scene.screen ? (
          <DeviceFrame device={scene.device} screen={scene.screen} className="hx-scene-device" />
        ) : null}
      </div>
    </motion.article>
  );
}

const STEP_ICON_PATHS: Record<HowStepIcon, string> = {
  understand: 'M12 5c-4.5 0-8 3.5-8 7s3.5 7 8 7 8-3.5 8-7-3.5-7-8-7Zm0 4.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z',
  design: 'M4 16.5 14.5 6l3.5 3.5L7.5 20H4v-3.5ZM15.5 5 17 3.5 20.5 7 19 8.5 15.5 5Z',
  build: 'M4 7h7v7H4V7Zm9 3h7v7h-7v-7ZM6 16h3v3H6v-3Z',
  launch: 'M12 3c3.5 2 5 5.5 5 9l-2.5 2.5h-5L7 12c0-3.5 1.5-7 5-9Zm0 5.5A1.5 1.5 0 1 0 12 11a1.5 1.5 0 0 0 0-2.5ZM8 18l-1.5 3M12 18v3M16 18l1.5 3',
  support: 'M12 4a6 6 0 0 0-6 6v3a3 3 0 0 0 3 3h1v-6H8v-0a4 4 0 0 1 8 0v6h-2a2 2 0 0 1-2 2',
};

function StepIcon({ icon }: { icon: HowStepIcon }) {
  return (
    <svg className="hx-step-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={STEP_ICON_PATHS[icon]}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClientArtIcon({ icon }: { icon: ClientIcon }) {
  return (
    <svg className="hx-client-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {icon === 'arts' && (
        <>
          <path
            d="M9 17V6.2l9-1.8V15"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="7" cy="17" r="2" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="16" cy="15" r="2" stroke="currentColor" strokeWidth="1.6" />
        </>
      )}
      {icon === 'community' && (
        <>
          <path
            d="M12 20s-5.2-3.3-5.2-7a3 3 0 0 1 5.2-2 3 3 0 0 1 5.2 2c0 3.7-5.2 7-5.2 7Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {icon === 'family' && (
        <>
          <path
            d="M4 11 12 5l8 6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 10.5V19h12v-8.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 16.5s-2.2-1.4-2.2-2.9a1.3 1.3 0 0 1 2.2-.9 1.3 1.3 0 0 1 2.2.9c0 1.5-2.2 2.9-2.2 2.9Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {icon === 'youth' && (
        <>
          <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="16" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M4.5 19v-1.5a3.5 3.5 0 0 1 7 0V19M12.5 19v-1.5a3.5 3.5 0 0 1 7 0V19"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}

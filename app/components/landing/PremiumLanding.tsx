'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

type Scene = {
  id: string;
  eyebrow: string;
  currentLabel: string;
  possibleLabel: string;
  current: string;
  possible: string;
  story: string;
  currentImage: string;
  possibleImage: string;
  alt: string;
  guide: string;
};

const scenes: Scene[] = [
  {
    id: 'life',
    eyebrow: 'Life beyond the work',
    currentLabel: 'Current Reality',
    possibleLabel: "What's Possible",
    current: "You didn't start this to manage systems.",
    possible: 'You started this to build a life with room for purpose.',
    story: 'A founder moves from late-night dependency to mornings coaching, creating, volunteering, and being present with family.',
    currentImage: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2200&q=86',
    possibleImage: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=2200&q=86',
    alt: 'A racially diverse group of friends and volunteers laughing together outdoors',
    guide: 'This opening scene is about freedom, not software. Notice the contrast between being buried in work and having room for people, purpose, and life.',
  },
  {
    id: 'communication',
    eyebrow: 'Communication',
    currentLabel: 'Current Reality',
    possibleLabel: "What's Possible",
    current: "Nobody knows what's happening.",
    possible: 'Everyone knows what comes next.',
    story: 'A coach stops answering the same parent questions and spends that time with athletes instead.',
    currentImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=2200&q=86',
    possibleImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=2200&q=86',
    alt: 'A racially and ethnically diverse team aligned in a bright meeting space',
    guide: 'This scene names the cost of scattered updates. The possibility is simple: people receive the right information before confusion starts.',
  },
  {
    id: 'training',
    eyebrow: 'Training',
    currentLabel: 'Current Reality',
    possibleLabel: "What's Possible",
    current: 'Training starts over every day.',
    possible: 'Knowledge is always available.',
    story: 'A nonprofit leader stops repeating the same explanation and lets new staff learn naturally, at the moment they need it.',
    currentImage: 'https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=2200&q=86',
    possibleImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=2200&q=86',
    alt: 'A diverse group of adult learners working together around a table',
    guide: "Training transformation means knowledge no longer lives in one person's head. It becomes repeatable, visible, and easier to pass on.",
  },
  {
    id: 'visibility',
    eyebrow: 'Visibility',
    currentLabel: 'Current Reality',
    possibleLabel: "What's Possible",
    current: "You can't see what you can't see.",
    possible: 'See what matters sooner.',
    story: 'An executive director moves from reacting all day to recognizing patterns early enough to lead with calm.',
    currentImage: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=2200&q=86',
    possibleImage: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=2200&q=86',
    alt: 'A racially diverse leadership group reviewing priorities together with calm focus',
    guide: 'Visibility is the shift from surprise to awareness. Leaders get to see signals early enough to choose, not scramble.',
  },
  {
    id: 'capacity',
    eyebrow: 'Capacity',
    currentLabel: 'Current Reality',
    possibleLabel: "What's Possible",
    current: 'Everyone is busy.',
    possible: 'People have space to thrive.',
    story: 'A stretched team stops surviving the week and starts contributing ideas, improving the work, and breathing again.',
    currentImage: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=2200&q=86',
    possibleImage: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=2200&q=86',
    alt: 'A diverse group of colleagues smiling and collaborating in a sunlit workspace',
    guide: 'Capacity is not about asking people to do more. It is about removing the repetition and friction that keep good people stretched thin.',
  },
  {
    id: 'impact',
    eyebrow: 'Impact',
    currentLabel: 'Current Reality',
    possibleLabel: "What's Possible",
    current: 'Too much potential gets lost.',
    possible: 'More of what matters gets done.',
    story: 'A community organization captures more opportunities, serves more people, and turns good intentions into visible progress.',
    currentImage: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=2200&q=86',
    possibleImage: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=2200&q=86',
    alt: 'A racially diverse volunteer group serving a community together',
    guide: 'Impact is where the story becomes practical. When fewer things fall through the cracks, more people receive the help you meant to give.',
  },
];

const futures = {
  school: [
    'Imagine every parent knowing exactly what is happening before they need to ask.',
    'Imagine new staff learning the rhythm of the school in days, not months.',
    'Imagine administrators seeing small issues before they become urgent.',
  ],
  nonprofit: [
    'Imagine volunteers arriving prepared, confident, and clear on what matters.',
    'Imagine programs moving without every answer depending on one leader.',
    'Imagine more families helped because the work finally has room to scale.',
  ],
  sports: [
    'Imagine parents, athletes, and coaches sharing one clear rhythm.',
    'Imagine training, updates, and opportunities reaching the right people at the right time.',
    'Imagine coaches spending less time repeating details and more time developing athletes.',
  ],
  business: [
    'Imagine your team knowing what matters without chasing you for every answer.',
    'Imagine customers feeling guided, informed, and remembered.',
    'Imagine leadership energy returning to growth, relationships, and vision.',
  ],
};

type FutureKey = keyof typeof futures;

export default function PremiumLanding() {
  const prefersReducedMotion = useReducedMotion();
  const [activeScene, setActiveScene] = useState(scenes[0]);
  const [future, setFuture] = useState<FutureKey>('nonprofit');

  useEffect(() => {
    if (prefersReducedMotion) return;
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let raf = 0;
    const tick = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const triggers = scenes.map((scene) => ScrollTrigger.create({
      trigger: `[data-scene="${scene.id}"]`,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => setActiveScene(scene),
      onEnterBack: () => setActiveScene(scene),
    }));

    gsap.utils.toArray<HTMLElement>('.pl-story-scene').forEach((section) => {
      const image = section.querySelector('.pl-possibility-img');
      const veil = section.querySelector('.pl-reality-veil');
      gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 65%',
          end: 'bottom 35%',
          scrub: 0.9,
        },
      })
        .fromTo(image, { scale: 1.06, opacity: 0.2 }, { scale: 1, opacity: 1, ease: 'none' }, 0)
        .fromTo(veil, { opacity: 0.72 }, { opacity: 0.08, ease: 'none' }, 0);
    });

    return () => {
      triggers.forEach((trigger) => trigger.kill());
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [prefersReducedMotion]);

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

  const futureLines = useMemo(() => futures[future], [future]);

  return (
    <main className="pl-site">
      <header className="pl-nav pl-nav-light">
        <Link href="/" className="pl-brand" aria-label="Efficiency Architects home">
          <Image src="/ea-logo.png" alt="" width={38} height={38} priority />
          <span>Efficiency Architects</span>
        </Link>
        <a href="#possibilities" className="pl-nav-link">
          Imagine
        </a>
      </header>

      <section className="pl-cinema-hero" id="top" data-scene="life">
        <div className="pl-hero-grid" aria-hidden="true">
          {[
            'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=82',
            'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=82',
            'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=82',
            'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=900&q=82',
          ].map((src) => (
            <img key={src} src={src} alt="" />
          ))}
        </div>
        <motion.div
          className="pl-hero-copy"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="pl-kicker">Imagine The Possibilities&trade;</p>
          <h1>You didn&apos;t start this to manage systems.</h1>
          <p>
            You started it to coach, serve, build, teach, create, lead, and make room for a life beyond the work.
          </p>
          <a href="#communication" className="pl-cta">
            Begin the story
          </a>
        </motion.div>
      </section>

      <section className="pl-wait-moment">
        <p>Everything depends on you.</p>
      </section>

      {scenes.slice(1).map((scene, index) => (
        <RealityPossibilityScene key={scene.id} scene={scene} index={index} />
      ))}

      <section className="pl-goosebumps">
        <div className="pl-goosebumps-current">
          <img
            src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=2200&q=86"
            alt="A leader working alone late at night with messages and responsibilities piling up"
          />
        </div>
        <div className="pl-goosebumps-possible">
          <img
            src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=2200&q=86"
            alt="A racially and ethnically diverse group of people enjoying community, family, and purpose together"
          />
        </div>
        <div className="pl-goosebumps-copy">
          <p>Future State</p>
          <h2>What would become possible if everything didn&apos;t depend on you?</h2>
        </div>
      </section>

      <section className="pl-reveal-section" aria-labelledby="reveal-title">
        <div className="pl-reveal-copy">
          <p className="pl-kicker">Reality &rarr; Possibility&trade;</p>
          <h2 id="reveal-title">Drag from pressure into possibility.</h2>
        </div>
        <RealityReveal
          before="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1800&q=84"
          after="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1800&q=84"
        />
      </section>

      <section className="pl-possibility-generator" id="possibilities">
        <div className="pl-generator-shell">
          <p className="pl-kicker">Possibility Generator</p>
          <h2>Imagine The Possibilities&trade;</h2>
          <p>
            What could your organization become if communication, training, visibility, and operations finally worked together?
          </p>
          <div className="pl-segments" aria-label="Choose organization type">
            {(Object.keys(futures) as FutureKey[]).map((key) => (
              <button key={key} type="button" className={future === key ? 'is-active' : ''} onClick={() => setFuture(key)}>
                {key}
              </button>
            ))}
          </div>
          <div className="pl-future-lines">
            {futureLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <Link href="/assessment" className="pl-cta pl-cta-dark">
            Imagine The Possibilities&trade;
          </Link>
        </div>
      </section>

      <footer className="pl-footer">
        <p className="pl-footer-title">Efficiency Architects</p>
        <p className="pl-footer-lead">
          A guided transformation experience for people who are ready to move from dependency to possibility.
        </p>
        <nav className="pl-footer-nav" aria-label="Footer">
          <Link href="/assessment">Operational MRI&trade;</Link>
          <Link href="/portal/login">Client Portal</Link>
          <Link href="/simplifi">Simplifi</Link>
        </nav>
      </footer>
    </main>
  );
}

function RealityPossibilityScene({ scene, index }: { scene: Scene; index: number }) {
  return (
    <section className="pl-story-scene" id={scene.id} data-scene={scene.id}>
      <div className="pl-scene-media">
        <img className="pl-current-img" src={scene.currentImage} alt="" loading={index < 1 ? 'eager' : 'lazy'} />
        <img className="pl-possibility-img" src={scene.possibleImage} alt={scene.alt} loading="lazy" />
        <span className="pl-reality-veil" />
      </div>
      <div className="pl-scene-copy">
        <p className="pl-kicker">{scene.eyebrow}</p>
        <div className="pl-reality-columns">
          <article>
            <span>{scene.currentLabel}</span>
            <h2>{scene.current}</h2>
          </article>
          <article>
            <span>{scene.possibleLabel}</span>
            <h2>{scene.possible}</h2>
          </article>
        </div>
        <p className="pl-micro-story">{scene.story}</p>
      </div>
    </section>
  );
}

function RealityReveal({ before, after }: { before: string; after: string }) {
  const [value, setValue] = useState(50);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  function updateFromClientX(clientX: number) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    setValue(Math.max(8, Math.min(92, next)));
  }

  return (
    <div
      ref={wrapRef}
      className="pl-reality-reveal"
      onPointerMove={(event) => {
        if (event.buttons === 1) updateFromClientX(event.clientX);
      }}
      onPointerDown={(event) => updateFromClientX(event.clientX)}
    >
      <img src={before} alt="Current reality with scattered communication and pressure" />
      <div className="pl-reveal-after" style={{ clipPath: `inset(0 0 0 ${value}%)` }}>
        <img src={after} alt="Possibility with a diverse aligned team communicating clearly" />
      </div>
      <input
        type="range"
        min="8"
        max="92"
        value={value}
        aria-label="Reveal possibility"
        onChange={(event) => setValue(Number(event.target.value))}
      />
      <span className="pl-reveal-handle" style={{ left: `${value}%` }} />
      <span className="pl-reveal-label pl-reveal-left">Current Reality</span>
      <span className="pl-reveal-label pl-reveal-right">What&apos;s Possible</span>
    </div>
  );
}

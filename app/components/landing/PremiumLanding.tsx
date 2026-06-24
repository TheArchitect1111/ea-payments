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
  currentAlt: string;
  possibleAlt: string;
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
    currentImage: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=2200&q=86',
    possibleImage: 'https://images.unsplash.com/photo-1476705147036-43cd080da2f3?auto=format&fit=crop&w=2200&q=86',
    currentAlt: 'A leader working alone late at night with responsibilities piling up',
    possibleAlt: 'A multigenerational family enjoying time together outdoors',
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
    currentImage: 'https://images.unsplash.com/photo-1573497019940-88c6a86b0a2f?auto=format&fit=crop&w=2200&q=86',
    possibleImage: 'https://images.unsplash.com/photo-1593113598148-3655c4d566bb?auto=format&fit=crop&w=2200&q=86',
    currentAlt: 'A coach overwhelmed by messages and scattered updates on her phone',
    possibleAlt: 'A diverse youth sports team in a focused huddle with their coach',
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
    currentImage: 'https://images.unsplash.com/photo-1582213782179-0a00d435e7de?auto=format&fit=crop&w=2200&q=86',
    possibleImage: 'https://images.unsplash.com/photo-1523245775816-ff31a218c6be?auto=format&fit=crop&w=2200&q=86',
    currentAlt: 'A nonprofit leader walking a new volunteer through the same steps again',
    possibleAlt: 'A racially diverse group of adult learners confidently working together',
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
    currentImage: 'https://images.unsplash.com/photo-1454165804606-ff69b5c36a2c?auto=format&fit=crop&w=2200&q=86',
    possibleImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=2200&q=86',
    currentAlt: 'A leader surrounded by scattered reports and surprises they did not see coming',
    possibleAlt: 'A Black woman executive director reviewing priorities with calm focus',
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
    possibleImage: 'https://images.unsplash.com/photo-1573164574514-8a0c5e0e8c3b?auto=format&fit=crop&w=2200&q=86',
    currentAlt: 'An exhausted team buried in back-to-back work with no room to breathe',
    possibleAlt: 'A diverse team with breathing room to think, contribute, and improve the work',
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
    possibleImage: 'https://images.unsplash.com/photo-1469571486212-0f58a3e6062a?auto=format&fit=crop&w=2200&q=86',
    currentAlt: 'Community need going unmet while resources sit unused',
    possibleAlt: 'A racially diverse volunteer group serving meals to their community',
    guide: 'Impact is where the story becomes practical. When fewer things fall through the cracks, more people receive the help you meant to give.',
  },
];

const heroMontage = [
  {
    src: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=82',
    alt: 'A coach guiding young athletes on the field',
  },
  {
    src: 'https://images.unsplash.com/photo-1507692049795-dee435f2d06b?auto=format&fit=crop&w=900&q=82',
    alt: 'A pastor greeting members of a diverse congregation',
  },
  {
    src: 'https://images.unsplash.com/photo-1580582938317-8005863959d1?auto=format&fit=crop&w=900&q=82',
    alt: 'A school administrator walking a bright school hallway',
  },
  {
    src: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=82',
    alt: 'A creator working at a desk with purpose and focus',
  },
];

const futures = {
  school: {
    label: 'Schools',
    lines: [
      'Imagine every parent knowing exactly what is happening before they need to ask.',
      'Imagine new staff learning the rhythm of the school in days, not months.',
      'Imagine administrators seeing small issues before they become urgent.',
    ],
    image: 'https://images.unsplash.com/photo-1580582938317-8005863959d1?auto=format&fit=crop&w=1600&q=86',
    imageAlt: 'School administrators and staff moving with clarity through a bright campus',
  },
  nonprofit: {
    label: 'Nonprofits',
    lines: [
      'Imagine volunteers arriving prepared, confident, and clear on what matters.',
      'Imagine programs moving without every answer depending on one leader.',
      'Imagine more families helped because the work finally has room to scale.',
    ],
    image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1600&q=86',
    imageAlt: 'A diverse volunteer team serving their community with confidence',
  },
  sports: {
    label: 'Sports',
    lines: [
      'Imagine parents, athletes, and coaches sharing one clear rhythm.',
      'Imagine training, updates, and opportunities reaching the right people at the right time.',
      'Imagine coaches spending less time repeating details and more time developing athletes.',
    ],
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1600&q=86',
    imageAlt: 'A coach developing athletes on the field with full presence',
  },
  church: {
    label: 'Churches',
    lines: [
      'Imagine volunteers knowing exactly where to serve before Sunday morning.',
      'Imagine pastoral care continuing without every detail living in one inbox.',
      'Imagine your congregation feeling informed, connected, and ready to respond.',
    ],
    image: 'https://images.unsplash.com/photo-1438232953991-611fd813685f?auto=format&fit=crop&w=1600&q=86',
    imageAlt: 'A diverse congregation gathered in worship and community',
  },
  business: {
    label: 'Business',
    lines: [
      'Imagine your team knowing what matters without chasing you for every answer.',
      'Imagine customers feeling guided, informed, and remembered.',
      'Imagine leadership energy returning to growth, relationships, and vision.',
    ],
    image: 'https://images.unsplash.com/photo-1507679616480-389c2a94501a?auto=format&fit=crop&w=1600&q=86',
    imageAlt: 'A business owner leading with clarity while the team moves with confidence',
  },
  creators: {
    label: 'Creators',
    lines: [
      'Imagine your audience receiving what you promised without you repeating yourself.',
      'Imagine your systems running while you create, teach, and build.',
      'Imagine more of your energy going into the work only you can do.',
    ],
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=86',
    imageAlt: 'Creators and collaborators building something meaningful together',
  },
};

type FutureKey = keyof typeof futures;

const segmentOrder: FutureKey[] = ['school', 'nonprofit', 'sports', 'church', 'business', 'creators'];

export default function PremiumLanding() {
  const prefersReducedMotion = useReducedMotion();
  const [activeScene, setActiveScene] = useState(scenes[0]);
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

    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    const hiddenClip = isMobile ? 'inset(0 75% 0 0)' : 'inset(0 100% 0 0)';
    const dividerStart = isMobile ? '25%' : '0%';

    gsap.utils.toArray<HTMLElement>('.pl-story-scene').forEach((section) => {
      const possible = section.querySelector<HTMLElement>('.pl-possibility-img');
      const divider = section.querySelector<HTMLElement>('.pl-scene-divider');
      if (!possible || !divider) return;

      gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 70%',
          end: 'bottom 30%',
          scrub: 0.6,
        },
      })
        .fromTo(possible, { clipPath: hiddenClip }, { clipPath: 'inset(0 0% 0 0)', ease: 'none' }, 0)
        .fromTo(divider, { left: dividerStart }, { left: '100%', ease: 'none' }, 0);
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

  const futureContent = useMemo(() => futures[future], [future]);

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
        <div className="pl-hero-mobile">
          <img src={heroMontage[0].src} alt={heroMontage[0].alt} />
          <p className="pl-hero-mobile-caption">For coaches, churches, schools, and creators</p>
        </div>
        <div className="pl-hero-grid" aria-hidden="true">
          {heroMontage.map((frame) => (
            <img key={frame.src} src={frame.src} alt="" />
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

      <section className="pl-wait-moment">
        <p>Everything depends on you.</p>
      </section>

      {scenes.slice(1).map((scene, index) => (
        <RealityPossibilityScene key={scene.id} scene={scene} index={index} reducedMotion={!!prefersReducedMotion} />
      ))}

      <section className="pl-goosebumps">
        <div className="pl-goosebumps-current">
          <img
            src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=2200&q=86"
            alt="A leader alone at a desk late at night, carrying every responsibility"
          />
          <span className="pl-goosebumps-badge pl-goosebumps-badge-current">Current Reality</span>
        </div>
        <div className="pl-goosebumps-possible">
          <img
            src="https://images.unsplash.com/photo-1511895426328-ac872781f227?auto=format&fit=crop&w=2200&q=86"
            alt="A multigenerational family and community sharing a meal together"
          />
          <span className="pl-goosebumps-badge pl-goosebumps-badge-possible">What&apos;s Possible</span>
        </div>
        <div className="pl-goosebumps-copy">
          <p>Future State</p>
          <h2>What would become possible if everything didn&apos;t depend on you?</h2>
        </div>
      </section>

      <section className="pl-reveal-section" aria-labelledby="reveal-title">
        <div className="pl-reveal-copy">
          <p className="pl-kicker">Reality &rarr; Possibility&trade;</p>
          <h2 id="reveal-title">Slide right to reveal what&apos;s possible.</h2>
          <p className="pl-reveal-hint">Left is where you are. Right is where you could be.</p>
        </div>
        <RealityReveal
          before="https://images.unsplash.com/photo-1573497019940-88c6a86b0a2f?auto=format&fit=crop&w=1800&q=84"
          after="https://images.unsplash.com/photo-1593113598148-3655c4d566bb?auto=format&fit=crop&w=1800&q=84"
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
            {segmentOrder.map((key) => (
              <button key={key} type="button" className={future === key ? 'is-active' : ''} onClick={() => setFuture(key)}>
                {futures[key].label}
              </button>
            ))}
          </div>
          <div className="pl-generator-visual" key={future}>
            <img src={futureContent.image} alt={futureContent.imageAlt} />
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
        <nav className="pl-footer-nav" aria-label="Footer">
          <Link href="/assessment">Operational MRI&trade;</Link>
          <Link href="/portal/login">Client Portal</Link>
          <Link href="/simplifi">Simplifi</Link>
        </nav>
      </footer>
    </main>
  );
}

function RealityPossibilityScene({
  scene,
  index,
  reducedMotion,
}: {
  scene: Scene;
  index: number;
  reducedMotion: boolean;
}) {
  return (
    <section className="pl-story-scene" id={scene.id} data-scene={scene.id}>
      <div className="pl-scene-media">
        <img
          className="pl-current-img"
          src={scene.currentImage}
          alt={scene.currentAlt}
          loading={index < 1 ? 'eager' : 'lazy'}
        />
        <img
          className={`pl-possibility-img${reducedMotion ? ' is-revealed' : ''}`}
          src={scene.possibleImage}
          alt={scene.possibleAlt}
          loading="lazy"
        />
        <span className={`pl-scene-divider${reducedMotion ? ' is-revealed' : ''}`} aria-hidden="true" />
        <span className="pl-scene-badge pl-scene-badge-current">{scene.currentLabel}</span>
        <span className="pl-scene-badge pl-scene-badge-possible">{scene.possibleLabel}</span>
      </div>
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
        <p className="pl-micro-story pl-micro-story-mobile">{scene.story}</p>
      </div>
    </section>
  );
}

function RealityReveal({ before, after }: { before: string; after: string }) {
  const [value, setValue] = useState(82);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  function updateFromClientX(clientX: number) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    setValue(Math.max(8, Math.min(92, next)));
  }

  return (
    <div className="pl-reveal-wrap">
      <div
        ref={wrapRef}
        className="pl-reality-reveal"
        onPointerMove={(event) => {
          if (event.buttons === 1) updateFromClientX(event.clientX);
        }}
        onPointerDown={(event) => updateFromClientX(event.clientX)}
      >
        <div className="pl-reveal-before">
          <img src={before} alt="Current reality — pressure, scattered communication, dependency" />
          <span className="pl-reveal-tint pl-reveal-tint-current" aria-hidden="true" />
        </div>
        <div className="pl-reveal-after" style={{ clipPath: `inset(0 0 0 ${value}%)` }}>
          <img src={after} alt="What's possible — a diverse team aligned and communicating clearly" />
          <span className="pl-reveal-tint pl-reveal-tint-possible" aria-hidden="true" />
        </div>
        <input
          type="range"
          min="8"
          max="92"
          value={value}
          aria-label="Slide right to reveal what's possible"
          aria-valuetext={`${Math.round(value)}% revealed`}
          onChange={(event) => setValue(Number(event.target.value))}
        />
        <span className="pl-reveal-handle" style={{ left: `${value}%` }} aria-hidden="true">
          <span className="pl-reveal-handle-grip" />
        </span>
        <span className="pl-reveal-label pl-reveal-label-top pl-reveal-left">
          <span className="pl-reveal-direction" aria-hidden="true">&larr;</span>
          Current Reality
        </span>
        <span className="pl-reveal-label pl-reveal-label-top pl-reveal-right">
          What&apos;s Possible
          <span className="pl-reveal-direction" aria-hidden="true">&rarr;</span>
        </span>
      </div>
      <p className="pl-reveal-mobile-hint">Drag the handle right to reveal possibility</p>
    </div>
  );
}

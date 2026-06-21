'use client';

import Image from 'next/image';
import Link from 'next/link';
import PulseDashboardShowcase from './PulseDashboardShowcase';
import Reveal from './Reveal';

const IMG = {
  hero:
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=85',
  tenHours:
    'https://images.unsplash.com/photo-1476705147036-43cd080da2f3?auto=format&fit=crop&w=2000&q=85',
  frictionStress:
    'https://images.unsplash.com/photo-1454165804606-c7243bc1247c?auto=format&fit=crop&w=1200&q=85',
  frictionCalm:
    'https://images.unsplash.com/photo-1511895426328-ac872781f227?auto=format&fit=crop&w=1200&q=85',
  montage: [
    'https://images.unsplash.com/photo-1576678926784-842712e09893?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1476705147036-43cd080da2f3?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1593113598148-3655c4d566bb?auto=format&fit=crop&w=800&q=80',
  ],
  possibilities:
    'https://images.unsplash.com/photo-1527529487837-d4698031be93?auto=format&fit=crop&w=2000&q=85',
  beforeAfter: [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1464226184743-18fd08086df7?auto=format&fit=crop&w=900&q=80',
  ],
  hiddenCost:
    'https://images.unsplash.com/photo-1517457371039-4793677d1c49?auto=format&fit=crop&w=1600&q=85',
};

const roles = [
  { title: 'Business Owner', line: 'To build something meaningful.' },
  { title: 'Coach', line: 'To develop players.' },
  { title: 'Pastor', line: 'To serve people.' },
  { title: 'Nonprofit Leader', line: 'To create impact.' },
  { title: 'Parent', line: 'To create opportunities.' },
];

const orgTypes = [
  { icon: '◆', label: 'Businesses' },
  { icon: '✦', label: 'Churches' },
  { icon: '◇', label: 'Nonprofits' },
  { icon: '◈', label: 'Athletic Organizations' },
  { icon: '○', label: 'Schools' },
  { icon: '◎', label: 'Membership Organizations' },
  { icon: '◉', label: 'Entrepreneurs' },
];

const hiddenCosts = [
  'Missed opportunities',
  'Delayed decisions',
  'Lost time',
  'Burnout',
  'Frustration',
  "Moments you'll never get back",
];

function CinematicImage({
  src,
  alt,
  className,
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={`ea-cinematic ${className ?? ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} />
    </div>
  );
}

export default function PremiumLanding() {
  return (
    <main className="ea-landing">
      <header className="ea-nav">
        <div className="ea-nav-inner">
          <Link href="/" className="ea-brand" aria-label="Efficiency Architects home">
            <Image src="/images/ea-logo.png" alt="" width={44} height={44} priority />
            <div className="ea-brand-text">
              <span>Efficiency</span>
              <strong>Architects</strong>
            </div>
          </Link>
          <nav className="ea-nav-links" aria-label="Primary">
            <a href="#pulse">Pulse</a>
            <a href="#possibilities">Possibilities</a>
            <Link href="/assessment" className="ea-nav-cta">
              Operational MRI™
            </Link>
          </nav>
        </div>
      </header>

      {/* SECTION 1 — HERO */}
      <section className="ea-section ea-hero-split" id="top">
        <div className="ea-container ea-hero-split-grid">
          <Reveal className="ea-hero-copy">
            <h1 className="ea-display">
              Imagine What Becomes Possible When Everything Isn&apos;t On Your Shoulders.
            </h1>
            <p className="ea-lead ea-lead-tight">
              You didn&apos;t start your business, organization, team, or mission to spend your days chasing
              information, answering the same questions, and putting out fires.
            </p>
            <p className="ea-body">
              We help you create a system that gives you more time, more clarity, more opportunities, and more
              freedom to focus on what matters most.
            </p>
            <div className="ea-actions">
              <a href="#possibilities" className="ea-btn ea-btn-primary">
                See What&apos;s Possible
              </a>
              <Link href="/assessment" className="ea-btn ea-btn-secondary">
                Take the Operational MRI™
              </Link>
            </div>
          </Reveal>
          <Reveal className="ea-hero-visual" delay={0.1}>
            <CinematicImage
              src={IMG.hero}
              alt="Diverse leaders and families enjoying the outcomes of success together"
              priority
            />
          </Reveal>
        </div>
      </section>

      {/* SECTION 2 — 10 MORE HOURS */}
      <section className="ea-section ea-section-center soft" id="time">
        <div className="ea-container ea-narrow">
          <Reveal>
            <h2 className="ea-display-md ea-display-center">
              What Would You Do With 10 More Hours Every Week?
            </h2>
            <ul className="ea-minimal-list">
              <li>More family time.</li>
              <li>More opportunities.</li>
              <li>More impact.</li>
              <li>More life.</li>
            </ul>
          </Reveal>
        </div>
        <Reveal className="ea-full-bleed-wrap" delay={0.08}>
          <CinematicImage
            src={IMG.tenHours}
            alt="A father watching his child play sports, phone away, fully present in golden hour light"
            className="ea-full-bleed"
          />
        </Reveal>
      </section>

      {/* SECTION 3 — FRICTION */}
      <section className="ea-section" id="friction">
        <div className="ea-container">
          <Reveal>
            <h2 className="ea-display-md ea-display-center">
              Most Organizations Don&apos;t Need More People.
              <br />
              They Need Less Friction.
            </h2>
            <p className="ea-lead ea-display-center">The problem isn&apos;t effort. The problem is:</p>
            <ul className="ea-problem-list">
              <li>Information is scattered.</li>
              <li>Communication is inconsistent.</li>
              <li>Training is repeated.</li>
              <li>Everything depends on a few people.</li>
            </ul>
          </Reveal>
          <div className="ea-duo-visual">
            <Reveal delay={0.05}>
              <figure className="ea-duo-card ea-duo-stress">
                <CinematicImage
                  src={IMG.frictionStress}
                  alt="Overwhelmed leader surrounded by demands, sticky notes, and interruptions"
                />
                <figcaption>Before — everything on your shoulders</figcaption>
              </figure>
            </Reveal>
            <Reveal delay={0.1}>
              <figure className="ea-duo-card ea-duo-calm">
                <CinematicImage
                  src={IMG.frictionCalm}
                  alt="Calm, focused leader present with family in the background"
                />
                <figcaption>After — present, confident, supported</figcaption>
              </figure>
            </Reveal>
          </div>
        </div>
      </section>

      {/* SECTION 4 — WHY YOU STARTED */}
      <section className="ea-section soft" id="mission">
        <div className="ea-container">
          <Reveal>
            <h2 className="ea-display-md">Get Back To Why You Started</h2>
          </Reveal>
          <div className="ea-roles-grid">
            {roles.map((role, i) => (
              <Reveal key={role.title} delay={i * 0.04}>
                <div className="ea-role-card">
                  <h3>{role.title}</h3>
                  <p>{role.line}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1}>
            <p className="ea-mission-close">
              The mission didn&apos;t change.
              <br />
              The workload did.
            </p>
          </Reveal>
          <div className="ea-montage">
            {IMG.montage.map((src, i) => (
              <Reveal key={src} delay={i * 0.03}>
                <CinematicImage
                  src={src}
                  alt="Human moment of coaching, serving, creating, parenting, or community impact"
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — PULSE */}
      <section className="ea-section ea-section-pulse dark" id="pulse">
        <div className="ea-container ea-pulse-section">
          <Reveal className="ea-pulse-copy">
            <span className="ea-product-label">Pulse™</span>
            <h2 className="ea-display-md ea-display-light">The Heartbeat Of Your Organization</h2>
            <div className="ea-copy-stack ea-copy-light">
              <p>Pulse helps you see what matters without chasing information.</p>
              <p>Know what&apos;s happening. Know what&apos;s working. Know what needs attention.</p>
              <p>Know where opportunities exist — all from one place.</p>
              <p>So you can spend less time managing and more time leading.</p>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <PulseDashboardShowcase />
          </Reveal>
        </div>
      </section>

      {/* SECTION 6 — CONSIDER THE POSSIBILITIES */}
      <section className="ea-section" id="possibilities">
        <div className="ea-container">
          <Reveal>
            <h2 className="ea-display-md ea-display-center">Consider The Possibilities™</h2>
            <p className="ea-lead ea-display-center">
              What becomes possible when the right systems are working behind the scenes?
            </p>
          </Reveal>
          <div className="ea-trio">
            <Reveal>
              <article className="ea-trio-card">
                <h3>More Time</h3>
                <p>For family. For vacations. For coaching. For ministry. For growth.</p>
              </article>
            </Reveal>
            <Reveal delay={0.05}>
              <article className="ea-trio-card">
                <h3>More Opportunities</h3>
                <p>For clients. For members. For athletes. For students. For your organization.</p>
              </article>
            </Reveal>
            <Reveal delay={0.1}>
              <article className="ea-trio-card">
                <h3>More Impact</h3>
                <p>Because your energy is spent creating value instead of managing chaos.</p>
              </article>
            </Reveal>
          </div>
          <Reveal delay={0.12}>
            <CinematicImage
              src={IMG.possibilities}
              alt="Diverse families traveling, celebrating, and experiencing freedom together"
              className="ea-mt-lg"
            />
          </Reveal>
        </div>
      </section>

      {/* SECTION 7 — BEFORE & AFTER */}
      <section className="ea-section soft" id="progress">
        <div className="ea-container">
          <Reveal>
            <div className="ea-before-after-head">
              <div>
                <span className="ea-tag">Before</span>
                <p>Everything depends on you.</p>
              </div>
              <div>
                <span className="ea-tag ea-tag-gold">After</span>
                <p>The system supports you.</p>
              </div>
            </div>
          </Reveal>
          <div className="ea-timeline">
            {[
              { month: 'Month 1', caption: 'Overwhelmed — carrying it all alone', img: IMG.beforeAfter[0] },
              { month: 'Month 3', caption: 'Focused — clarity returning', img: IMG.beforeAfter[1] },
              { month: 'Month 6', caption: 'Confident — life while the organization runs', img: IMG.beforeAfter[2] },
            ].map((step, i) => (
              <Reveal key={step.month} delay={i * 0.06}>
                <figure className="ea-timeline-card">
                  <CinematicImage src={step.img} alt={step.caption} />
                  <figcaption>
                    <strong>{step.month}</strong>
                    <span>{step.caption}</span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 8 — EVERY ORGANIZATION IS DIFFERENT */}
      <section className="ea-section" id="organizations">
        <div className="ea-container ea-narrow">
          <Reveal>
            <h2 className="ea-display-md ea-display-center">Every Organization Is Different</h2>
            <p className="ea-lead ea-display-center">That&apos;s why every system is customized.</p>
          </Reveal>
          <div className="ea-icon-grid">
            {orgTypes.map((org, i) => (
              <Reveal key={org.label} delay={i * 0.03}>
                <div className="ea-icon-card">
                  <span className="ea-icon-mark" aria-hidden="true">
                    {org.icon}
                  </span>
                  <span>{org.label}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 9 — HIDDEN COST */}
      <section className="ea-section soft" id="cost">
        <div className="ea-container ea-split">
          <Reveal className="ea-split-copy">
            <h2 className="ea-display-md">The Hidden Cost Of Chaos</h2>
            <p className="ea-lead">What is it costing you?</p>
            <ul className="ea-cost-list">
              {hiddenCosts.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal className="ea-visual" delay={0.08}>
            <CinematicImage
              src={IMG.hiddenCost}
              alt="Parent working late while family waits — a quiet, thought-provoking moment"
            />
          </Reveal>
        </div>
      </section>

      {/* SECTION 10 — FREEDOM STARTS HERE */}
      <section className="ea-section ea-section-final dark" id="start">
        <div className="ea-container ea-final">
          <Reveal>
            <h2 className="ea-display-md ea-display-light ea-display-center">Freedom Starts Here</h2>
            <p className="ea-lead ea-display-center ea-copy-light">
              You already have the vision. You already have the potential. The right system simply helps remove the
              obstacles standing in the way.
            </p>
            <div className="ea-actions ea-actions-center">
              <Link href="/assessment" className="ea-btn ea-btn-light">
                Take the Operational MRI™
              </Link>
              <a href="mailto:freedom@efficiencyarchitects.online" className="ea-btn ea-btn-ghost">
                Schedule A Discovery Conversation
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="ea-footer">
        <nav className="ea-footer-links" aria-label="Footer">
          <Link href="/assessment">Operational MRI™</Link>
          <Link href="/portal/login">Client Portal</Link>
          <Link href="/scorecard">Visibility Scorecard</Link>
        </nav>
        <small>Efficiency Architects · Reclaim time. Create possibilities. Focus on what matters most.</small>
      </footer>
    </main>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import Reveal from './Reveal';

const outcomes = [
  'More family.',
  'More growth.',
  'More opportunities.',
  'More experiences.',
  'More freedom.',
  'More life.',
];

const possibilities = [
  {
    title: 'More Time',
    copy: 'Imagine what becomes possible when the hours you lose to chaos return to you.',
    image: 'https://images.unsplash.com/photo-1511895426328-ac872781f227?auto=format&fit=crop&w=1200&q=80',
    alt: 'Family spending meaningful time together outdoors',
  },
  {
    title: 'More Growth',
    copy: 'More capacity means more room for the opportunities you have been waiting to pursue.',
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80',
    alt: 'Leader envisioning growth with their team',
  },
  {
    title: 'More Opportunities',
    copy: 'When capacity opens up, the paths you could not pursue suddenly become reachable.',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    alt: 'Friends sharing a joyful experience together',
  },
  {
    title: 'Greater Peace Of Mind',
    copy: 'Less stress. More confidence that what matters is actually happening.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80',
    alt: 'Professional feeling calm and present at work',
  },
  {
    title: 'A Team That Just Gets It',
    copy: 'Everyone aligned. Everyone informed. Less repeating yourself.',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    alt: 'Diverse team collaborating with calm confidence',
  },
  {
    title: 'More Capacity',
    copy: 'Your organization gains room to grow without burning out the people who make it run.',
    image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=80',
    alt: 'Multicultural team moving forward together',
  },
  {
    title: 'More Life',
    copy: 'Because every hour saved is a possibility waiting to be lived.',
    image: 'https://images.unsplash.com/photo-1464226184743-18fd08086df7?auto=format&fit=crop&w=1200&q=80',
    alt: 'Parent present with family at a meaningful moment',
  },
];

function SplitSection({
  id,
  label,
  title,
  lines,
  image,
  imageAlt,
  cta,
  ctaHref,
  reverse,
  dark,
}: {
  id: string;
  label?: string;
  title: string;
  lines: string[];
  image: string;
  imageAlt: string;
  cta?: string;
  ctaHref?: string;
  reverse?: boolean;
  dark?: boolean;
}) {
  return (
    <section className={`ea-section${dark ? ' dark' : ''}${reverse ? ' soft' : ''}`} id={id}>
      <div className={`ea-container ea-split${reverse ? ' ea-split-reverse' : ''}`}>
        <Reveal className="ea-split-copy">
          {label ? <span className="ea-product-label">{label}</span> : null}
          <h2 className="ea-display-md">{title}</h2>
          <div className="ea-copy-stack">
            {lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          {cta && ctaHref ? (
            <div className="ea-actions">
              {ctaHref.startsWith('/') ? (
                <Link href={ctaHref} className={`ea-btn ${dark ? 'ea-btn-light' : 'ea-btn-primary'}`}>
                  {cta}
                </Link>
              ) : (
                <a href={ctaHref} className={`ea-btn ${dark ? 'ea-btn-light' : 'ea-btn-primary'}`}>
                  {cta}
                </a>
              )}
            </div>
          ) : null}
        </Reveal>
        <Reveal className="ea-visual" delay={0.08}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={imageAlt} loading="lazy" />
        </Reveal>
      </div>
    </section>
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
            <a href="#possibilities">Discover</a>
            <Link href="/simplifi">Simplifi</Link>
            <Link href="/assessment" className="ea-nav-cta">
              Take The Assessment
            </Link>
          </nav>
        </div>
      </header>

      <section className="ea-hero-cinematic">
        <div className="ea-hero-bg" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=2000&q=80"
            alt=""
          />
        </div>
        <div className="ea-hero-overlay" />
        <div className="ea-container ea-hero-cinematic-inner">
          <Reveal>
            <h1 className="ea-display ea-display-light">
              What would become possible if more got done and more of your time belonged to you?
            </h1>
            <div className="ea-pill-list" aria-label="Outcomes">
              {outcomes.map((item) => (
                <span key={item} className="ea-pill ea-pill-light">
                  {item}
                </span>
              ))}
            </div>
            <div className="ea-actions">
              <a href="#possibilities" className="ea-btn ea-btn-light">
                Discover What&apos;s Possible
              </a>
              <Link href="/assessment" className="ea-btn ea-btn-ghost">
                Take The Assessment
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="ea-section soft" id="possibilities">
        <div className="ea-container">
          <Reveal>
            <h2 className="ea-display-md">Imagine The Possibilities</h2>
            <p className="ea-lead">
              Every improvement creates capacity for the organization — and possibilities for the people inside it.
            </p>
          </Reveal>
          <div className="ea-cards">
            {possibilities.map((card, index) => (
              <Reveal key={card.title} delay={index * 0.05}>
                <article className="ea-card" tabIndex={0}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={card.image} alt={card.alt} loading="lazy" />
                  <div className="ea-card-overlay">
                    <h3>{card.title}</h3>
                    <p>{card.copy}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <SplitSection
        id="unifi"
        label="Unifi™"
        title="A Team That Just Gets It"
        lines={[
          'Clear communication.',
          'Less confusion.',
          'Less repeating yourself.',
          'More confidence.',
          'More alignment.',
        ]}
        image="https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?auto=format&fit=crop&w=1400&q=80"
        imageAlt="Diverse team working together with calm energy — everyone informed, no visible confusion"
        cta="Explore Unifi"
        ctaHref="/assessment"
      />

      <SplitSection
        id="fortifi"
        label="Fortifi™"
        title="Build Once. Teach Forever."
        lines={[
          "The best organizations don't rely on memory.",
          'They capture knowledge, share experience, and help people grow.',
          'Current staff continue improving. New team members gain confidence faster.',
          'The lessons learned today continue creating value tomorrow.',
        ]}
        image="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80"
        imageAlt="Experienced team member mentoring a newer colleague while knowledge is shared and multiplied"
        cta="Explore Fortifi"
        ctaHref="/portal/login?next=/portal/demo-client/updates"
        reverse
      />

      <SplitSection
        id="amplifi"
        label="Amplifi™"
        title="Share More. Reach More."
        lines={[
          'One message can create visibility across your entire organization.',
          'Show impact. Show reach. Show momentum.',
          'Help people stay informed without chasing updates.',
        ]}
        image="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=80"
        imageAlt="Diverse community connected through shared purpose and momentum"
        cta="Explore Amplifi"
        ctaHref="/portal/login?next=/portal/demo-client/amplifi"
      />

      <SplitSection
        id="pulse"
        label="Pulse™"
        title="One Place To See What Matters."
        lines={[
          'Communication. Training. Participation. Growth. Capacity. Opportunities. Progress.',
          'Everything comes together here — so leaders can finally know what is happening.',
        ]}
        image="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80"
        imageAlt="Clean, elegant view of organizational health — calm confidence, not complexity"
        cta="Explore Pulse"
        ctaHref="/portal/login?next=/portal/demo-client/pulse"
        reverse
        dark
      />

      <section className="ea-section" id="assessment">
        <div className="ea-container ea-split">
          <Reveal className="ea-split-copy">
            <h2 className="ea-display-md">Start With What You Can See.</h2>
            <div className="ea-copy-stack">
              <p>Most people don&apos;t need another opinion. They need a clearer picture.</p>
              <p>
                The Capacity Assessment helps uncover opportunities, hidden costs, and areas for growth — so you can see
                what becomes possible before you invest time, money, and energy.
              </p>
            </div>
            <div className="ea-actions">
              <Link href="/assessment" className="ea-btn ea-btn-primary">
                Take The Assessment
              </Link>
            </div>
          </Reveal>
          <Reveal className="ea-visual" delay={0.08}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=1400&q=80"
              alt="Leader reviewing insights with clarity and confidence — discovery, not audit"
              loading="lazy"
            />
          </Reveal>
        </div>
      </section>

      <footer className="ea-footer">
        <nav className="ea-footer-links" aria-label="Footer">
          <Link href="/simplifi">Simplifi</Link>
          <Link href="/assessment">Capacity Assessment</Link>
          <Link href="/portal/login">Client Portal</Link>
          <Link href="/scorecard">Visibility Scorecard</Link>
        </nav>
        <small>Efficiency Architects · Turn wasted time into possibilities.</small>
      </footer>
    </main>
  );
}

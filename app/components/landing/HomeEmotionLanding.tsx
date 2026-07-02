'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

const sportsScenes = [
  { name: 'Basketball', image: '/home/he-coach-athletes.jpg', position: 'center 34%' },
  { name: 'Football', image: '/home/scene-sports-org.jpg', position: 'center 42%' },
  { name: 'Baseball', image: '/home/client-canadian-prospects.jpg', position: 'center 38%' },
  { name: 'Volleyball', image: '/ea-athletics-samples/1000037821.png', position: 'top center' },
  { name: 'Tennis', image: '/ea-athletics-samples/1000037822.png', position: 'top center' },
  { name: 'Training', image: '/home/possible-coach.jpg', position: 'center 34%' },
];

const growthMoments = [
  'One athlete',
  'One team',
  'More families',
  'More teams',
  'More camps',
  'More clinics',
  'More volunteers',
  'More conversations',
];

const weightItems = [
  'Parent questions',
  'Registration requests',
  'Payments',
  'Waivers',
  'Schedules',
  'Travel',
  'Hotels',
  'Film',
  'Recruiting',
  'Merchandise',
  'Volunteers',
  'Social media',
  'Sponsors',
  'Messages',
];

const dashboardTabs = [
  {
    label: 'Coach',
    image: '/ea-athletics-samples/1000037823.png',
    items: ['Today at 5:30 PM', '12 athletes checked in', 'Film room ready'],
  },
  {
    label: 'Parent',
    image: '/ea-athletics-samples/1000037824.png',
    items: ['Waiver approved', 'Payment received', 'Travel details sent'],
  },
  {
    label: 'Athlete',
    image: '/ea-athletics-samples/1000037823.png',
    items: ['Development plan updated', 'Recruiting profile live', 'Training resource added'],
  },
  {
    label: 'Director',
    image: '/ea-athletics-samples/1000037824.png',
    items: ['Camp 84% full', 'New sponsor pending', 'Schedule conflict resolved'],
  },
];

const quietSignals = [
  'Registration complete',
  'Payment received',
  'Schedule updated',
  'Reminder sent',
  'Waiver approved',
  'Attendance recorded',
  'Camp filled',
  'Volunteer confirmed',
  'Profile updated',
  'Travel delivered',
];

const sportOptions = ['Basketball', 'Football', 'Soccer', 'Baseball', 'Volleyball', 'Swimming', 'Golf', 'Track', 'Tennis', 'Hockey'];
const orgOptions = ['High school program', 'AAU organization', 'Prep school', 'Club program', 'Training academy', 'Camp or clinic', 'League operator'];
const athleteOptions = ['Under 50 athletes', '50-150 athletes', '150-500 athletes', '500+ athletes'];

function FadeIn({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.28 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function CinematicImage({
  src,
  alt,
  position,
  priority,
}: {
  src: string;
  alt: string;
  position?: string;
  priority?: boolean;
}) {
  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      style={position ? { objectPosition: position } : undefined}
    />
  );
}

function ChoiceGroup({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="he-choice-group">
      <p>{label}</p>
      <div>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={selected === option ? 'is-selected' : ''}
            onClick={() => onSelect(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function HomeEmotionLanding() {
  const reduce = useReducedMotion();
  const [activeDashboard, setActiveDashboard] = useState(0);
  const [sport, setSport] = useState('');
  const [organization, setOrganization] = useState('');
  const [athletes, setAthletes] = useState('');

  useEffect(() => {
    if (reduce) return;
    const interval = window.setInterval(() => {
      setActiveDashboard((current) => (current + 1) % dashboardTabs.length);
    }, 2600);

    return () => window.clearInterval(interval);
  }, [reduce]);

  const vision = useMemo(() => {
    if (!sport || !organization || !athletes) return null;

    return {
      title: `${sport}. ${organization}. ${athletes}.`,
      href: `/contact?sport=${encodeURIComponent(sport)}&organization=${encodeURIComponent(organization)}&athletes=${encodeURIComponent(athletes)}`,
      landing: `A public ${sport.toLowerCase()} experience where families see the program, trust the standard, and register without confusion.`,
      portal: `A private operating system for your ${organization} where coaches, parents, athletes, volunteers, and staff each know what comes next.`,
      coach: 'A coach dashboard that protects practice time, organizes the day, and keeps the late-night work from taking over.',
    };
  }, [sport, organization, athletes]);

  const currentDashboard = dashboardTabs[activeDashboard];

  return (
    <main className="he" id="main-content">
      <header className="he-nav" aria-label="Experience navigation">
        <Link href="/" className="he-brand" aria-label="EA Athletics Experience home">
          <Image src="/ea-logo.png" alt="" width={34} height={34} priority />
          <span>EA Athletics Experience</span>
        </Link>
        <nav className="he-nav-links" aria-label="Primary">
          <a href="#story">Story</a>
          <a href="#landing-page">Landing Page</a>
          <a href="#portal">Portal</a>
          <a href="#imagine">Imagine Yours</a>
        </nav>
      </header>

      <section className="he-hero he-chapter" aria-labelledby="hero-title">
        <div className="he-media">
          <CinematicImage
            src="/home/he-coach-athletes.jpg"
            alt="Coach guiding athletes during practice"
            position="center 34%"
            priority
          />
        </div>
        <div className="he-scrim" />
        <FadeIn className="he-hero-copy">
          <p className="he-kicker">A coach journey</p>
          <h1 id="hero-title">Every coach starts with the same dream.</h1>
        </FadeIn>
      </section>

      <section className="he-sports-film" id="story" aria-label="Different sports, same beginning">
        {sportsScenes.map((scene, index) => (
          <motion.figure
            key={scene.name}
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, delay: index * 0.04 }}
          >
            <CinematicImage src={scene.image} alt={`${scene.name} athletics moment`} position={scene.position} />
            <figcaption>{scene.name}</figcaption>
          </motion.figure>
        ))}
      </section>

      <section className="he-growth he-chapter" aria-labelledby="growth-title">
        <FadeIn className="he-centered">
          <h2 id="growth-title">Success changes everything.</h2>
          <div className="he-growth-rings" aria-label="Growth moments">
            {growthMoments.map((moment, index) => (
              <motion.span
                key={moment}
                initial={reduce ? false : { opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                {moment}
              </motion.span>
            ))}
          </div>
          <p>Success creates complexity.</p>
        </FadeIn>
      </section>

      <section className="he-weight he-chapter" aria-labelledby="weight-title">
        <div className="he-media">
          <CinematicImage src="/home/ch2-invisible-work.jpg" alt="Coach covered by administrative work" position="center" />
        </div>
        <div className="he-scrim he-scrim-heavy" />
        <div className="he-weight-cloud" aria-hidden="true">
          {weightItems.map((item, index) => (
            <motion.span
              key={item}
              style={{ ['--i' as string]: String(index) }}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
            >
              {item}
            </motion.span>
          ))}
        </div>
        <FadeIn className="he-bottom-line">
          <h2 id="weight-title">There has to be a better way.</h2>
        </FadeIn>
      </section>

      <section className="he-landing-reveal he-chapter" id="landing-page" aria-labelledby="landing-title">
        <FadeIn className="he-section-title">
          <h2 id="landing-title">The Landing Page starts the relationship.</h2>
        </FadeIn>
        <motion.figure
          className="he-landing-device"
          initial={reduce ? false : { opacity: 0, y: 44, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <img src="/ea-athletics-samples/1000037821.png" alt="Premium athletics landing page sample" loading="lazy" decoding="async" />
        </motion.figure>
      </section>

      <section className="he-transition" aria-labelledby="transition-title">
        <FadeIn className="he-transition-inner">
          <h2 id="transition-title">A parent presses register.</h2>
          <motion.div
            className="he-register-button"
            animate={reduce ? undefined : { scale: [1, 1.04, 1], boxShadow: ['0 0 0 0 rgba(255,255,255,0.24)', '0 0 0 28px rgba(255,255,255,0)', '0 0 0 0 rgba(255,255,255,0)'] }}
            transition={{ duration: 2.2, repeat: Infinity }}
          >
            Register
          </motion.div>
          <p>The page becomes the organization itself.</p>
        </FadeIn>
      </section>

      <section className="he-portal he-chapter" id="portal" aria-labelledby="portal-title">
        <FadeIn className="he-section-title">
          <h2 id="portal-title">Everyone has exactly what they need.</h2>
        </FadeIn>
        <div className="he-live-portal">
          <div className="he-dashboard-tabs" role="tablist" aria-label="Portal dashboards">
            {dashboardTabs.map((tab, index) => (
              <button
                key={tab.label}
                type="button"
                role="tab"
                aria-selected={activeDashboard === index}
                className={activeDashboard === index ? 'is-active' : ''}
                onClick={() => setActiveDashboard(index)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <motion.figure
            key={currentDashboard.label}
            className="he-dashboard-screen"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <img src={currentDashboard.image} alt={`${currentDashboard.label} dashboard`} loading="lazy" decoding="async" />
            <figcaption>
              <strong>{currentDashboard.label} Dashboard</strong>
              {currentDashboard.items.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </figcaption>
          </motion.figure>
        </div>
      </section>

      <section className="he-while he-chapter" aria-labelledby="while-title">
        <div className="he-media">
          <CinematicImage src="/home/possible-coach.jpg" alt="Coach teaching athletes while operations happen quietly" position="center 38%" />
        </div>
        <div className="he-scrim" />
        <div className="he-quiet-signals" aria-label="Organization updates">
          {quietSignals.map((signal, index) => (
            <motion.span
              key={signal}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              whileInView={{ opacity: [0, 1, 0.78], y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.12 }}
            >
              {signal}
            </motion.span>
          ))}
        </div>
        <FadeIn className="he-bottom-line">
          <h2 id="while-title">The coach never stops coaching.</h2>
        </FadeIn>
      </section>

      <section className="he-every-sport" aria-labelledby="sport-title">
        <FadeIn className="he-section-title">
          <h2 id="sport-title">Every sport deserves the same experience.</h2>
        </FadeIn>
        <div className="he-sample-strip">
          <img src="/ea-athletics-samples/1000037821.png" alt="Volleyball landing page" loading="lazy" decoding="async" />
          <img src="/ea-athletics-samples/1000037822.png" alt="Tennis landing page" loading="lazy" decoding="async" />
          <img src="/ea-athletics-samples/1000037823.png" alt="Baseball portal" loading="lazy" decoding="async" />
          <img src="/ea-athletics-samples/1000037824.png" alt="Basketball portal" loading="lazy" decoding="async" />
        </div>
      </section>

      <section className="he-relief he-chapter" aria-labelledby="relief-title">
        <div className="he-media">
          <CinematicImage src="/home/scene-coach.jpg" alt="Quiet athletic space after the day ends" position="center" />
        </div>
        <div className="he-scrim he-scrim-heavy" />
        <FadeIn className="he-relief-copy">
          <p>Phone in the pocket.</p>
          <p>No paperwork waiting.</p>
          <p>No unanswered messages.</p>
          <h2 id="relief-title">When your organization works together, you get to coach again.</h2>
        </FadeIn>
      </section>

      <section className="he-imagine" id="imagine" aria-labelledby="imagine-title">
        <FadeIn className="he-imagine-inner">
          <div className="he-section-title">
            <h2 id="imagine-title">Imagine Your Organization</h2>
          </div>
          <div className="he-choices">
            <ChoiceGroup label="What sport do you serve?" options={sportOptions} selected={sport} onSelect={setSport} />
            <ChoiceGroup label="What type of organization do you lead?" options={orgOptions} selected={organization} onSelect={setOrganization} />
            <ChoiceGroup label="Approximately how many athletes do you support?" options={athleteOptions} selected={athletes} onSelect={setAthletes} />
          </div>
          {vision ? (
            <motion.div
              className="he-vision"
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <p className="he-vision-title">{vision.title}</p>
              <p>{vision.landing}</p>
              <p>{vision.portal}</p>
              <p>{vision.coach}</p>
              <Link href={vision.href}>Design My Organization {'->'}</Link>
            </motion.div>
          ) : null}
        </FadeIn>
      </section>
    </main>
  );
}

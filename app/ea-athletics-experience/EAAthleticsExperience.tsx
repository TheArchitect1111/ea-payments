'use client';

import Lenis from 'lenis';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type SportMoment = {
  sport: string;
  image: string;
  position: string;
  tone: string;
};

type RoleView = {
  role: string;
  headline: string;
  schedule: string;
  primary: string;
  secondary: string;
  feed: string[];
};

const EAX = '/ea-athletics-experience';

const sportMoments: SportMoment[] = [
  { sport: 'Football', image: `${EAX}/eax-sport-football.jpg`, position: 'center 55%', tone: 'Before the first whistle.' },
  { sport: 'Baseball', image: `${EAX}/eax-sport-baseball.jpg`, position: 'center 50%', tone: 'Before the first lineup.' },
  { sport: 'Soccer', image: `${EAX}/eax-sport-soccer.jpg`, position: 'center 50%', tone: 'Before the dew burns off.' },
  { sport: 'Volleyball', image: `${EAX}/eax-sport-volleyball.jpg`, position: 'center 50%', tone: 'Before the gym fills.' },
  { sport: 'Swimming', image: `${EAX}/eax-sport-swimming.jpg`, position: 'center 50%', tone: 'Before the water breaks.' },
  { sport: 'Track', image: `${EAX}/eax-sport-track.jpg`, position: 'center 55%', tone: 'Before the first stride.' },
];

const everySportFrames: { sport: string; image: string; position: string }[] = [
  { sport: 'Basketball', image: `${EAX}/eax-opening-hero.jpg`, position: 'center 40%' },
  { sport: 'Football', image: `${EAX}/eax-sport-football.jpg`, position: 'center 55%' },
  { sport: 'Soccer', image: `${EAX}/eax-sport-soccer.jpg`, position: 'center 50%' },
  { sport: 'Baseball', image: `${EAX}/eax-sport-baseball.jpg`, position: 'center 50%' },
  { sport: 'Volleyball', image: `${EAX}/eax-sport-volleyball.jpg`, position: 'center 50%' },
  { sport: 'Swimming', image: `${EAX}/eax-sport-swimming.jpg`, position: 'center 50%' },
  { sport: 'Track', image: `${EAX}/eax-sport-track.jpg`, position: 'center 55%' },
];

const growthWords = [
  'One athlete',
  'One team',
  'More families',
  'More teams',
  'More camps',
  'More clinics',
  'More volunteers',
  'More tournaments',
  'More conversations',
];

const burdenMessages = [
  'Parent question',
  'Registration request',
  'Payment reminder',
  'Missing waiver',
  'Schedule change',
  'Hotel question',
  'Film upload',
  'Recruiting profile',
  'Merchandise order',
  'Volunteer request',
  'Sponsor follow-up',
  'Camp registration',
  'Clinic payment',
  'Travel update',
  'Practice time changed',
  'Uniform size needed',
  'Assistant coach message',
  'Tournament deadline',
];

const roles: RoleView[] = [
  {
    role: 'Coach',
    headline: "Today's Practice",
    schedule: '5:30 PM - Court 2',
    primary: 'Athlete Check-ins',
    secondary: 'Registration Status',
    feed: ['14 checked in', '3 waivers needed', 'Camp capacity 82%', 'Recruiting notes updated'],
  },
  {
    role: 'Parent',
    headline: 'Upcoming Schedule',
    schedule: 'Tournament weekend confirmed',
    primary: 'Payment Status',
    secondary: 'Required Forms',
    feed: ['Travel information sent', 'Coach update posted', 'Camp details available', 'Message center clear'],
  },
  {
    role: 'Athlete',
    headline: 'Training Focus',
    schedule: 'Strength block: week 3',
    primary: 'Film Uploads',
    secondary: 'Recruiting Profile',
    feed: ['Coach feedback ready', 'Progress notes updated', 'Event reminders synced', 'Tasks complete'],
  },
  {
    role: 'Volunteer',
    headline: 'Event Check-in',
    schedule: 'Saturday 8:00 AM',
    primary: 'Volunteer Assignment',
    secondary: 'Required Info',
    feed: ['Time slot confirmed', 'Gate list shared', 'Uniform pickup noted', 'Updates delivered'],
  },
  {
    role: 'Sponsor',
    headline: 'Event Visibility',
    schedule: 'Spring showcase',
    primary: 'Sponsor Assets',
    secondary: 'Impact Snapshot',
    feed: ['Banner proof ready', 'Deliverables tracked', 'Activation live', 'Thank-you scheduled'],
  },
];

const quietUpdates = [
  'Registration Complete',
  'Payment Received',
  'Schedule Updated',
  'Reminder Sent',
  'Waiver Approved',
  'Attendance Recorded',
  'Camp Filled',
  'Volunteer Confirmed',
  'Recruiting Profile Updated',
  'Travel Information Delivered',
  'Parent Message Sent',
  'Document Uploaded',
];

const sports = ['Basketball', 'Football', 'Soccer', 'Baseball', 'Softball', 'Volleyball', 'Swimming', 'Track', 'Golf', 'Tennis', 'Lacrosse', 'Cheer', 'Wrestling', 'Hockey', 'Other'];
const organizations = ['High School Program', 'AAU Organization', 'Prep School', 'Youth Sports Organization', 'Travel Team', 'Club Program', 'Training Academy', 'Camp or Clinic', 'Tournament', 'Recruiting Service', 'League', 'Private Training Business', 'Other'];
const athletes = ['Under 25', '25-75', '75-150', '150-300', '300+'];

function useSmoothScroll() {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const lenis = new Lenis({ lerp: 0.075, wheelMultiplier: 0.82, touchMultiplier: 1.05 });
    let rafId = 0;

    function raf(time: number) {
      lenis.raf(time);
      rafId = window.requestAnimationFrame(raf);
    }

    rafId = window.requestAnimationFrame(raf);
    return () => {
      window.cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [reduce]);
}

function Fade({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.32 }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function ChoiceGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="eax-choice">
      <legend>{label}</legend>
      <div>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={value === option ? 'is-selected' : ''}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function LandingMockup() {
  return (
    <div className="eax-landing-mock" aria-label="Athletics landing page mockup">
      <div className="eax-landing-hero">
        <span>EA Athletics</span>
        <h3>Build the program families believe in.</h3>
        <p>A premium digital experience for athletes, parents, coaches, and everyone helping your organization grow.</p>
        <div>
          <button type="button">Register</button>
          <a>Explore Programs</a>
        </div>
      </div>
      <div className="eax-landing-body">
        <section>
          <p>One place for every family to begin.</p>
          <strong>Teams. Camps. Clinics. Training. Recruiting. Events.</strong>
        </section>
        <section>
          <span>Coach Bios</span>
          <span>Upcoming Events</span>
          <span>Family Info</span>
          <span>Testimonials</span>
        </section>
      </div>
      <div className="eax-phone-preview">
        <span />
        <p>Mobile registration</p>
        <strong>3 steps</strong>
      </div>
    </div>
  );
}

function DashboardMockup({ view }: { view: RoleView }) {
  return (
    <div className="eax-dashboard-mock" aria-label={`${view.role} portal dashboard`}>
      <aside>
        <strong>EA Portal</strong>
        {['Overview', 'Schedule', 'Athletes', 'Families', 'Messages', 'Registration', 'Payments', 'Waivers', 'Camps', 'Recruiting', 'Documents'].map((item) => (
          <span key={item}>{item}</span>
        ))}
      </aside>
      <main>
        <header>
          <div>
            <span>{view.role} Dashboard</span>
            <h3>{view.headline}</h3>
          </div>
          <p>{view.schedule}</p>
        </header>
        <div className="eax-dashboard-quiet-grid">
          <section>
            <span>{view.primary}</span>
            <strong>Live</strong>
          </section>
          <section>
            <span>{view.secondary}</span>
            <strong>Clear</strong>
          </section>
          <section>
            <span>Messages</span>
            <strong>Handled</strong>
          </section>
        </div>
        <div className="eax-dashboard-feed">
          {view.feed.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function EAAthleticsExperience() {
  useSmoothScroll();
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 70, damping: 22, mass: 0.35 });
  const heroScale = useTransform(scrollYProgress, [0, 0.16], [1, 1.08]);
  const [roleIndex, setRoleIndex] = useState(0);
  const [sport, setSport] = useState('');
  const [organization, setOrganization] = useState('');
  const [athleteCount, setAthleteCount] = useState('');

  useEffect(() => {
    if (reduce) return;
    const interval = window.setInterval(() => {
      setRoleIndex((current) => (current + 1) % roles.length);
    }, 2600);
    return () => window.clearInterval(interval);
  }, [reduce]);

  const activeRole = roles[roleIndex];
  const vision = useMemo(() => {
    if (!sport || !organization || !athleteCount) return null;
    return {
      title: `Your ${sport} ${organization} does not need more scattered tools.`,
      body: `It needs one experience where families register, athletes stay connected, coaches see what matters, and your organization grows without losing control.`,
      details: [
        `A landing page that makes ${sport.toLowerCase()} families trust the program before the first conversation.`,
        `A portal shaped for ${athleteCount} athletes, with coaches, parents, athletes, volunteers, sponsors, and staff connected in one rhythm.`,
        'A coach dashboard that gives the program back its focus.',
      ],
    };
  }, [sport, organization, athleteCount]);

  return (
    <main className="eax" id="main-content">
      <motion.div className="eax-progress" style={{ scaleX: progress }} aria-hidden="true" />
      <div className="eax-brand" aria-label="Efficiency Architects">
        <img src="/ea-logo.png" alt="" />
        <span>Efficiency Architects</span>
      </div>

      <section className="eax-opening" aria-labelledby="eax-opening-title">
        <motion.img
          src={`${EAX}/eax-opening-hero.jpg`}
          alt="Coach speaking to young athletes in a gym at dawn"
          style={{ scale: heroScale }}
        />
        <div className="eax-image-wash" />
        <Fade className="eax-opening-line">
          <p>EA Athletics Experience</p>
          <h1 id="eax-opening-title">Every coach starts with the same dream.</h1>
          <span>To teach. To build. To believe before anyone else does.</span>
        </Fade>
      </section>

      <section className="eax-sports-story" aria-label="Why coaches coach">
        {sportMoments.map((moment, index) => (
          <motion.figure
            key={moment.sport}
            initial={reduce ? false : { opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.22 }}
            transition={{ duration: 0.8, delay: index * 0.05 }}
          >
            <img src={moment.image} alt={`${moment.sport} coaching moment`} style={{ objectPosition: moment.position }} />
            <figcaption>
              <strong>{moment.sport}</strong>
              <span>{moment.tone}</span>
            </figcaption>
          </motion.figure>
        ))}
      </section>

      <section className="eax-growth" aria-labelledby="eax-growth-title">
        <Fade className="eax-chapter-line">
          <p>Then the dream starts working.</p>
          <h2 id="eax-growth-title">More athletes. More families. More teams. More opportunity.</h2>
        </Fade>
        <div className="eax-growth-rhythm" aria-label="Growth sequence">
          {growthWords.map((word, index) => (
            <motion.span
              key={word}
              initial={reduce ? false : { opacity: 0, scale: 0.72 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: index * 0.08 }}
            >
              {word}
            </motion.span>
          ))}
        </div>
        <Fade className="eax-sentence">
          <h2>Success creates complexity.</h2>
        </Fade>
      </section>

      <section className="eax-weight" aria-labelledby="eax-weight-title">
        <img src={`${EAX}/eax-the-weight.jpg`} alt="A coach standing alone in a dim gym" />
        <div className="eax-image-wash" />
        <div className="eax-burden-cloud" aria-hidden="true">
          {burdenMessages.map((message, index) => (
            <motion.span
              key={message}
              initial={reduce ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.42, delay: index * 0.04 }}
            >
              {message}
            </motion.span>
          ))}
        </div>
        <Fade className="eax-weight-line">
          <p>The work starts hiding the reason you started.</p>
          <h2 id="eax-weight-title">There has to be a better way.</h2>
        </Fade>
      </section>

      <section className="eax-landing-reveal" aria-labelledby="eax-landing-title">
        <Fade className="eax-chapter-line">
          <p>The relationship starts before the first conversation.</p>
          <h2 id="eax-landing-title">Parents understand. Athletes engage. Families know where to go.</h2>
        </Fade>
        <div className="eax-reveal-stage">
          <LandingMockup />
          <div className="eax-proof-screens" aria-label="Attached landing page references">
            <img src="/ea-athletics-samples/1000037821.png" alt="Volleyball landing page sample" />
            <img src="/ea-athletics-samples/1000037822.png" alt="Tennis landing page sample" />
          </div>
        </div>
      </section>

      <section className="eax-transition" aria-labelledby="eax-transition-title">
        <Fade className="eax-transition-core">
          <p>Then the experience continues.</p>
          <h2 id="eax-transition-title">Register</h2>
          <motion.div
            className="eax-portal-ripple"
            animate={reduce ? undefined : { scale: [1, 1.42, 1.9], opacity: [0.5, 0.25, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden="true"
          />
        </Fade>
      </section>

      <section className="eax-portal-reveal" aria-labelledby="eax-portal-title">
        <Fade className="eax-chapter-line">
          <p>Behind the public story, the organization starts working together.</p>
          <h2 id="eax-portal-title">Everyone has exactly what they need.</h2>
        </Fade>
        <div className="eax-portal-stage">
          <nav aria-label="Portal role views">
            {roles.map((role, index) => (
              <button
                key={role.role}
                type="button"
                className={roleIndex === index ? 'is-active' : ''}
                onClick={() => setRoleIndex(index)}
              >
                {role.role}
              </button>
            ))}
          </nav>
          <motion.div
            key={activeRole.role}
            initial={reduce ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <DashboardMockup view={activeRole} />
          </motion.div>
          <div className="eax-proof-screens eax-proof-screens--portal" aria-label="Attached portal references">
            <img src="/ea-athletics-samples/1000037823.png" alt="Baseball portal sample" />
            <img src="/ea-athletics-samples/1000037824.png" alt="Basketball portal sample" />
          </div>
        </div>
      </section>

      <section className="eax-while" aria-labelledby="eax-while-title">
        <img src={`${EAX}/eax-while-you-coach.jpg`} alt="A coach encouraging a young athlete during practice" />
        <div className="eax-image-wash" />
        <div className="eax-quiet-updates" aria-label="System updates">
          {quietUpdates.map((update, index) => (
            <motion.span
              key={update}
              initial={reduce ? false : { opacity: 0, x: 18 }}
              whileInView={{ opacity: [0, 1, 0.72], x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.82, delay: index * 0.1 }}
            >
              {update}
            </motion.span>
          ))}
        </div>
        <Fade className="eax-while-line">
          <p>While you coach, the organization keeps moving.</p>
          <h2 id="eax-while-title">Quietly. Together.</h2>
        </Fade>
      </section>

      <section className="eax-every-sport" aria-labelledby="eax-sport-title">
        <Fade className="eax-chapter-line">
          <h2 id="eax-sport-title">Every sport deserves the same experience.</h2>
          <p>Different athletes. Different seasons. Different demands. Same clarity.</p>
        </Fade>
        <div className="eax-sport-film" aria-label="The same experience across every sport">
          {everySportFrames.map((frame, index) => (
            <motion.figure
              key={frame.sport}
              initial={reduce ? false : { opacity: 0, scale: 1.06 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.7, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              <img src={frame.image} alt={`${frame.sport} — the same EA experience`} style={{ objectPosition: frame.position }} />
              <figcaption>{frame.sport}</figcaption>
            </motion.figure>
          ))}
        </div>
        <div className="eax-sport-transform">
          {['Softball', 'Golf', 'Tennis', 'Lacrosse', 'Cheer', 'Wrestling', 'Hockey'].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="eax-sustainable" aria-labelledby="eax-sustainable-title">
        <Fade className="eax-chapter-line">
          <p>Growth should not punish the people who made it possible.</p>
          <h2 id="eax-sustainable-title">Growth can finally feel sustainable.</h2>
        </Fade>
        <div className="eax-system-map" aria-hidden="true">
          {['Teams', 'Camps', 'Clinics', 'Coaches', 'Locations', 'Sponsors', 'Families', 'Opportunities'].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="eax-relief" aria-labelledby="eax-relief-title">
        <img src={`${EAX}/eax-relief.jpg`} alt="A coach locking the gym doors at dusk" />
        <div className="eax-image-wash" />
        <Fade className="eax-relief-line">
          <p>Phone in the pocket.</p>
          <p>No paperwork waiting.</p>
          <p>No unanswered messages.</p>
          <h2 id="eax-relief-title">
            When your organization works together...
            <span>You get to coach again.</span>
          </h2>
          <strong>Efficiency Architects</strong>
        </Fade>
      </section>

      <section className="eax-imagine" aria-labelledby="eax-imagine-title">
        <Fade className="eax-imagine-inner">
          <p>Continue the story</p>
          <h2 id="eax-imagine-title">Imagine Your Organization</h2>
          <div className="eax-choices">
            <ChoiceGroup label="What sport do you serve?" options={sports} value={sport} onChange={setSport} />
            <ChoiceGroup label="What type of organization do you lead?" options={organizations} value={organization} onChange={setOrganization} />
            <ChoiceGroup label="Approximately how many athletes do you support?" options={athletes} value={athleteCount} onChange={setAthleteCount} />
          </div>
          {vision ? (
            <motion.div
              className="eax-vision"
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <strong>{vision.title}</strong>
              <p>{vision.body}</p>
              {vision.details.map((detail) => (
                <span key={detail}>{detail}</span>
              ))}
              <a href={`/contact?sport=${encodeURIComponent(sport)}&organization=${encodeURIComponent(organization)}&athletes=${encodeURIComponent(athleteCount)}`}>
                Design My Organization -&gt;
              </a>
            </motion.div>
          ) : null}
        </Fade>
      </section>
    </main>
  );
}

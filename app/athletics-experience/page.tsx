import type { Metadata } from 'next';
import './athletics-experience.css';

export const metadata: Metadata = {
  title: 'EA Athletics Experience | Efficiency Architects',
  description:
    'A cinematic story-driven experience for athletic organizations ready for a landing page and portal designed around their mission.',
  openGraph: {
    title: 'EA Athletics Experience',
    description:
      'Every athletic organization deserves an organization designed around its mission.',
    type: 'website',
  },
};

const notifications = [
  'Did you get my payment?',
  'Can I still register?',
  'Where is practice?',
  'Can you send the schedule again?',
  'Where is the waiver?',
  'Where do I upload film?',
  'What hotel are we using?',
  'Can I order another jersey?',
  'Can I volunteer?',
  'Can my child switch teams?',
  'Can I speak with coach?',
  'Is the tournament still on?',
];

const roles = [
  'Administrator',
  'Accountant',
  'Customer Service',
  'Travel Coordinator',
  'Registration Manager',
  'Scheduler',
  'Fundraiser',
  'Social Media Manager',
  'Recruiter',
  'Coach',
];

const organizedWork = [
  ['Emails', 'organized conversations'],
  ['Registrations', 'player profiles'],
  ['Payments', 'completed checkmarks'],
  ['Schedules', 'live calendars'],
  ['Documents', 'searchable libraries'],
  ['Questions', 'self-service answers'],
];

const portalViews = ['Parents', 'Players', 'Coaches', 'Volunteers', 'Sponsors', 'Board Members'];

const athleteJourney = [
  'Discovery',
  'Registration',
  'Camp',
  'Team',
  'Travel',
  'Tournament',
  'Training',
  'Recruitment',
  'College Commitment',
  'Returns As Coach',
];

const sports = [
  'Basketball Academy',
  'Soccer Club',
  'Football Program',
  'Volleyball Club',
  'Track Program',
  'Golf Academy',
  'Swimming Club',
  'League',
  'Camp',
  'Tournament',
];

export default function AthleticsExperiencePage() {
  return (
    <main className="athletics-story">
      <section className="athletics-hero" aria-label="Opening scene">
        <div className="athletics-hero__topline">EA Athletics Experience&trade;</div>
        <div className="athletics-bounce" aria-hidden="true" />
        <div className="athletics-whistle" aria-hidden="true">single whistle</div>
        <div className="athletics-hero__copy">
          <p className="athletics-kicker">One season becomes a movement.</p>
          <h1>You did not start coaching to manage paperwork.</h1>
          <p>
            Every mission deserves an organization designed around it.
          </p>
        </div>
      </section>

      <section className="athletics-chapter athletics-chapter--light">
        <div className="athletics-chapter__media athletics-photo athletics-photo--dream" />
        <div className="athletics-chapter__copy">
          <p className="athletics-kicker">Chapter One</p>
          <h2>Every Great Program Begins With A Dream</h2>
          <p>
            A coach. A vision. One team. One season. Then growth arrives.
            More athletes. More parents. More volunteers. More tournaments.
            More communication.
          </p>
          <p>
            Success does not feel like failure at first. It feels like momentum.
            Then momentum becomes complexity.
          </p>
        </div>
      </section>

      <section className="athletics-notifications" aria-label="The hidden job nobody talks about">
        <div className="athletics-notifications__intro">
          <p className="athletics-kicker">Chapter Two</p>
          <h2>The Hidden Job Nobody Talks About</h2>
        </div>
        <div className="athletics-notification-grid">
          {notifications.map((item, index) => (
            <div className="athletics-note" style={{ ['--delay' as string]: `${index * 90}ms` }} key={item}>
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="athletics-roles">
        <p>You did not become a coach to become...</p>
        <div className="athletics-roles__list">
          {roles.map((role, index) => (
            <span className={index === roles.length - 1 ? 'athletics-role athletics-role--coach' : 'athletics-role'} key={role}>
              {role}
            </span>
          ))}
        </div>
      </section>

      <section className="athletics-freeze">
        <div>
          <p className="athletics-kicker">Everything freezes.</p>
          <h2>Organizations do not become difficult because they grow.</h2>
          <p>They become difficult because nothing grows together.</p>
        </div>
      </section>

      <section className="athletics-system">
        <div className="athletics-system__copy">
          <p className="athletics-kicker">Chapter Five</p>
          <h2>Not software. An invisible team member.</h2>
          <p>
            The EA Landing Page + Portal Experience&trade; quietly organizes the work
            while coaches keep coaching.
          </p>
        </div>
        <div className="athletics-workflow" aria-label="Work organizing itself">
          {organizedWork.map(([from, to]) => (
            <div className="athletics-workflow__row" key={from}>
              <span>{from}</span>
              <strong>{to}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="athletics-landing">
        <div className="athletics-landing__screen">
          <div className="athletics-browser-bar" />
          <div className="athletics-landing__image athletics-photo athletics-photo--landing" />
          <div className="athletics-landing__actions">
            <span>Register</span>
            <span>Apply</span>
            <span>Donate</span>
            <span>Join</span>
            <span>Volunteer</span>
            <span>Book Camps</span>
          </div>
        </div>
        <div className="athletics-chapter__copy">
          <p className="athletics-kicker">Chapter Six</p>
          <h2>The landing page starts the relationship.</h2>
          <p>
            Families discover the organization, understand the mission, and take the next step
            without needing a staff member to explain where everything lives.
          </p>
        </div>
      </section>

      <section className="athletics-portal">
        <div className="athletics-portal__intro">
          <p className="athletics-kicker">Chapter Seven</p>
          <h2>Then the experience becomes personal.</h2>
        </div>
        <div className="athletics-portal-grid">
          {portalViews.map((view) => (
            <div className="athletics-portal-tile" key={view}>
              <span>{view}</span>
              <strong>One clear dashboard</strong>
              <p>What they need. When they need it.</p>
            </div>
          ))}
        </div>
      </section>

      <section className="athletics-journey">
        <div className="athletics-photo athletics-photo--journey" />
        <div className="athletics-journey__copy">
          <p className="athletics-kicker">Chapter Eight</p>
          <h2>One athlete. One complete journey.</h2>
          <div className="athletics-timeline">
            {athleteJourney.map((step) => (
              <span key={step}>{step}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="athletics-invisible">
        <div className="athletics-invisible__sticky">
          <p className="athletics-kicker">Chapter Nine</p>
          <h2>While the coach teaches, the organization keeps working.</h2>
        </div>
        <div className="athletics-invisible__list">
          {[
            'Schedules update',
            'Payments process',
            'Forms collect',
            'Messages send',
            'Reminders deliver',
            'Training unlocks',
            'Volunteers check in',
            'Travel information appears',
            'Sponsors receive updates',
            'Parents stay informed',
          ].map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </section>

      <section className="athletics-many">
        <p className="athletics-kicker">Chapter Ten</p>
        <h2>The same platform transforms each mission.</h2>
        <div className="athletics-sport-grid">
          {sports.map((sport) => (
            <span key={sport}>{sport}</span>
          ))}
        </div>
      </section>

      <section className="athletics-final">
        <div className="athletics-final__image athletics-photo athletics-photo--final" />
        <div className="athletics-final__copy">
          <p className="athletics-kicker">Final Scene</p>
          <h2>An empty gym. A quiet phone. No unanswered questions.</h2>
          <p>Your athletes deserve a better experience.</p>
          <p>Your families deserve better communication.</p>
          <p>Your staff deserve better tools.</p>
          <p>Your coaches deserve time to coach.</p>
          <strong>Every athletic organization deserves an organization designed around its mission.</strong>
          <a href="/discover" className="athletics-cta">Start The EA Athletics Discovery</a>
        </div>
      </section>
    </main>
  );
}

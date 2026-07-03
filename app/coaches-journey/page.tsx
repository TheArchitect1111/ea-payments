import type { Metadata } from 'next';
import './coaches-journey.css';

export const metadata: Metadata = {
  title: "A Coach's Journey | EA Athletics Experience",
  description:
    "A cinematic story for coaches, parents, athletes, and staff showing how the EA Landing Page and Portal Experience helps athletic organizations run smoothly.",
  openGraph: {
    title: "A Coach's Journey",
    description:
      'You coach the athletes. Efficiency Architects helps run the organization.',
    type: 'website',
  },
};

const sports = [
  'Football practice',
  'Soccer field',
  'Basketball gym',
  'Volleyball match',
  'Baseball diamond',
  'Wrestling room',
  'Swimming pool',
  'Golf lesson',
  'Tennis court',
  'Cheer practice',
  'Track workout',
  'Lacrosse sideline',
];

const growthSignals = [
  ['One athlete', 'twenty'],
  ['Twenty', 'one hundred'],
  ['One team', 'multiple teams'],
  ['One season', 'year-round'],
  ['One message thread', 'hundreds of questions'],
  ['One volunteer', 'a staff that needs direction'],
];

const adminWork = [
  'Recruiting athletes',
  'Answering parent questions',
  'Collecting registrations',
  'Processing payments',
  'Managing waivers',
  'Scheduling practices',
  'Updating games',
  'Planning travel',
  'Sharing documents',
  'Organizing camps',
  'Running clinics',
  'Managing volunteers',
  'Training staff',
  'Promoting events',
  'Ordering apparel',
  'Responding to messages',
];

const perspectives = [
  {
    title: 'Head Coach',
    before: 'Sees the administrative burden growing around the mission.',
    after: 'Gets time back to teach, lead, recruit, and develop athletes.',
  },
  {
    title: 'Parent',
    before: 'Wonders where to register, pay, find schedules, and ask questions.',
    after: 'Receives clear communication and always knows where to go.',
  },
  {
    title: 'Athlete',
    before: 'Waits for details, support, reminders, film, and opportunity.',
    after: 'Feels guided through practices, camps, teams, training, and recruiting.',
  },
  {
    title: 'Assistant Coach',
    before: 'Chases rosters, practice plans, updates, attendance, and assignments.',
    after: 'Works from one organized place with the right information ready.',
  },
];

const systemPromises = [
  'Never sleeps',
  'Never forgets a deadline',
  'Never loses a form',
  'Never misses a payment',
  'Never forgets a family',
  'Never leaves staff guessing',
];

const landingActions = [
  'Discover the mission',
  'Register',
  'Apply',
  'Book camps',
  'Join clinics',
  'Purchase merchandise',
  'Donate',
  'Volunteer',
];

const portalOutcomes = [
  ['Parents', 'always know what is happening'],
  ['Athletes', 'know schedules, resources, and next steps'],
  ['Assistant Coaches', 'access rosters, practice plans, and updates'],
  ['Volunteers', 'know assignments before they arrive'],
  ['Recruiters', 'find player profiles and film'],
  ['Sponsors', 'see impact and stay connected'],
];

const whileYouCoach = [
  'Registrations confirm',
  'Payments process',
  'Receipts send',
  'Schedules update',
  'Practice changes publish',
  'Reminders deliver',
  'Documents store',
  'Travel organizes',
  'Attendance tracks',
  'Announcements publish',
  'Training unlocks',
  'Recruiting profiles stay current',
];

const finalScenes = [
  'A coach locking the gym',
  'A coach walking off a soccer field',
  'A coach leaving a baseball diamond',
  'A swim coach turning off the lights',
  'A golf instructor finishing the last lesson',
  'A wrestling coach rolling up the mats',
];

function PerspectiveBand({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return (
    <div className={`journey-perspectives journey-perspectives--${tone}`}>
      {perspectives.map((item) => (
        <article key={item.title}>
          <span>{item.title}</span>
          <p>{item.before}</p>
          <strong>{item.after}</strong>
        </article>
      ))}
    </div>
  );
}

export default function CoachesJourneyPage() {
  return (
    <main className="journey">
      <section className="journey-hero" aria-label="A Coach's Journey opening scene">
        <nav className="journey-nav" aria-label="Experience navigation">
          <span>EA Athletics Experience</span>
          <a href="/discover">Start discovery</a>
        </nav>
        <div className="journey-hero__content">
          <p className="journey-kicker">Every Coach&apos;s Journey</p>
          <h1>You coach the athletes. We help run the organization.</h1>
          <p>
            Whether you coach one team or twenty, the same story unfolds: passion grows,
            complexity follows, and the right system gives time back to everyone.
          </p>
        </div>
        <div className="journey-hero__sports" aria-label="Sports represented">
          {sports.slice(0, 8).map((sport) => (
            <span key={sport}>{sport}</span>
          ))}
        </div>
      </section>

      <section className="journey-chapter journey-chapter--white">
        <div className="journey-photo journey-photo--why" />
        <div className="journey-copy">
          <p className="journey-kicker">Chapter One</p>
          <h2>Why We Coach</h2>
          <p>
            Different sports. Different gyms, fields, pools, courts, and courses. One purpose:
            teaching, encouraging, developing character, changing lives.
          </p>
          <p>
            Winning matters. Helping athletes grow matters even more.
          </p>
        </div>
      </section>

      <section className="journey-growth">
        <div className="journey-copy journey-copy--center">
          <p className="journey-kicker">Chapter Two</p>
          <h2>The program begins to grow.</h2>
          <p>The program becomes a business whether the coach wanted it to or not.</p>
        </div>
        <div className="journey-growth__grid">
          {growthSignals.map(([from, to]) => (
            <article key={from}>
              <span>{from}</span>
              <strong>{to}</strong>
            </article>
          ))}
        </div>
        <PerspectiveBand />
      </section>

      <section className="journey-burden">
        <div className="journey-burden__sticky">
          <p className="journey-kicker">Chapter Three</p>
          <h2>The work nobody warned you about.</h2>
          <p>Every coach experiences it. The coach slowly spends less time coaching.</p>
        </div>
        <div className="journey-burden__list">
          {adminWork.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="journey-pause">
        <p>The sport is different.</p>
        <h2>The challenges are not.</h2>
      </section>

      <section className="journey-system">
        <div className="journey-copy">
          <p className="journey-kicker">Chapter Five</p>
          <h2>Imagine if your organization had another coach.</h2>
          <p>
            Not another person. Another system. One that quietly carries the repeated work
            so people can focus on people.
          </p>
        </div>
        <div className="journey-system__promises">
          {systemPromises.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <PerspectiveBand tone="dark" />
      </section>

      <section className="journey-landing">
        <div className="journey-screen">
          <div className="journey-screen__bar" />
          <div className="journey-photo journey-photo--landing" />
          <div className="journey-screen__actions">
            {landingActions.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
        <div className="journey-copy">
          <p className="journey-kicker">Chapter Six</p>
          <h2>The Landing Page creates confidence before the first conversation.</h2>
          <p>
            Before someone joins, they discover the mission, understand what makes the
            program different, and know exactly how to take the next step.
          </p>
        </div>
      </section>

      <section className="journey-portal">
        <div className="journey-copy journey-copy--center">
          <p className="journey-kicker">Chapter Seven</p>
          <h2>The Portal strengthens the relationship every day.</h2>
          <p>No confusion. No searching. No repeated questions. Everyone has one place to go.</p>
        </div>
        <div className="journey-portal__grid">
          {portalOutcomes.map(([person, outcome]) => (
            <article key={person}>
              <span>{person}</span>
              <strong>{outcome}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="journey-while">
        <div className="journey-photo journey-photo--coach" />
        <div className="journey-while__content">
          <p className="journey-kicker">Chapter Eight</p>
          <h2>While you coach, everything keeps moving.</h2>
          <div className="journey-while__list">
            {whileYouCoach.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="journey-universal">
        <div className="journey-copy journey-copy--center">
          <p className="journey-kicker">The universal layer</p>
          <h2>It elevates everyone connected to the program.</h2>
        </div>
        <div className="journey-universal__grid">
          {perspectives.map((item) => (
            <article key={item.title}>
              <span>{item.title}</span>
              <p>{item.after}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="journey-growth-chaos">
        <p className="journey-kicker">Chapter Nine</p>
        <h2>Growth without chaos.</h2>
        <p>
          More athletes. More camps. More clinics. More teams. More locations. More coaches.
          More opportunities. But not more confusion.
        </p>
        <div className="journey-sports-cloud">
          {sports.map((sport) => (
            <span key={sport}>{sport}</span>
          ))}
        </div>
      </section>

      <section className="journey-final">
        <div className="journey-photo journey-photo--final" />
        <div className="journey-final__copy">
          <p className="journey-kicker">Final Chapter</p>
          <h2>Different sports. The same feeling.</h2>
          <div className="journey-final__scenes">
            {finalScenes.map((scene) => (
              <span key={scene}>{scene}</span>
            ))}
          </div>
          <p>Every athlete deserves an exceptional experience.</p>
          <p>Every family deserves clear communication.</p>
          <p>Every staff member deserves the right tools.</p>
          <p>Every coach deserves time to coach.</p>
          <strong>
            The Landing Page starts the relationship. The Portal strengthens it every day.
            Together, they become the teammate behind every successful program.
          </strong>
          <a href="/discover" className="journey-cta">Start A Coach&apos;s Journey</a>
        </div>
      </section>
    </main>
  );
}

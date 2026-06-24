import Link from 'next/link';
import { getConnectOrg } from '@/lib/connect-store';
import '../connect.css';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ org: string }>;
};

export default async function ConnectJourneyPage({ params }: Props) {
  const { org: orgSlug } = await params;
  const org = getConnectOrg(orgSlug);
  const isCpr = org.slug === 'cpr';

  return (
    <main
      className={`connect-site${isCpr ? ' connect-cpr' : ''}`}
      style={{
        '--connect-ink': org.colors.ink,
        '--connect-accent': org.colors.accent,
        '--connect-soft': org.colors.soft,
      } as React.CSSProperties}
    >
      <section className="connect-journey-hero">
        <p className="connect-kicker">{isCpr ? 'Faith. Family. Basketball. Future.' : org.name}</p>
        <h1>Your journey starts here.</h1>
        <p>
          Explore programs, tryouts, camps, and opportunities built to help athletes train,
          compete, grow, and succeed.
        </p>
        <div className="connect-guide-actions">
          <a className="connect-primary" href="#programs">Programs & Camps</a>
          <a className="connect-ghost" href="#events">Upcoming Events</a>
        </div>
      </section>

      <section className="connect-journey-grid" id="programs">
        {[
          ['Train', 'Skill development, evaluation, and habits that translate.'],
          ['Compete', 'Showcase, camp, and team opportunities with the right visibility.'],
          ['Grow', 'Academic, recruiting, and leadership guidance for the long game.'],
          ['Succeed', 'A guided pathway toward the next level and the future beyond basketball.'],
        ].map(([title, copy]) => (
          <article key={title}>
            <span>{title.slice(0, 1)}</span>
            <h2>{title}</h2>
            <p>{copy}</p>
          </article>
        ))}
      </section>

      <section className="connect-events" id="events">
        <p className="connect-kicker">Upcoming Events</p>
        <h2>Next opportunities</h2>
        <div>
          {['Toronto Showcase', 'Charlotte Tournament Follow-Up', 'Summer Camp Evaluation', 'Open Gym Invitation'].map((event) => (
            <article key={event}>
              <b>{event}</b>
              <span>Details and registration pathway coming through CPR.</span>
            </article>
          ))}
        </div>
      </section>

      <section className="connect-consultation" id="consultation">
        <p className="connect-kicker">Personal follow-up</p>
        <h2>Want CPR to review the best next step?</h2>
        <p>Use the connection you already made. Mike and the CPR team can follow up with the right pathway.</p>
        <Link className="connect-primary" href={`/connect/${org.slug}?source=Direct&event=Consultation%20Request`}>
          Request Follow-Up
        </Link>
      </section>
    </main>
  );
}

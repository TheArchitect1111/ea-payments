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

  return (
    <main
      className={`connect-site${org.theme === 'cpr' ? ' connect-cpr' : ''}`}
      style={{
        '--connect-ink': org.colors.ink,
        '--connect-accent': org.colors.accent,
        '--connect-soft': org.colors.soft,
      } as React.CSSProperties}
    >
      <section className="connect-journey-hero">
        <p className="connect-kicker">{org.journey.kicker}</p>
        <h1>{org.journey.title}</h1>
        <p>{org.journey.intro}</p>
        <div className="connect-guide-actions">
          <a className="connect-primary" href="#programs">{org.journey.primaryCta}</a>
          <a className="connect-ghost" href="#events">{org.journey.secondaryCta}</a>
        </div>
      </section>

      <section className="connect-journey-grid" id="programs">
        {org.journey.pillars.map((pillar) => (
          <article key={pillar.title}>
            <span>{pillar.title.slice(0, 1)}</span>
            <h2>{pillar.title}</h2>
            <p>{pillar.copy}</p>
          </article>
        ))}
      </section>

      <section className="connect-events" id="events">
        <p className="connect-kicker">Upcoming Events</p>
        <h2>{org.journey.eventsTitle}</h2>
        <div>
          {org.journey.events.map((event) => (
            <article key={event}>
              <b>{event}</b>
              <span>{org.journey.eventNote}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="connect-consultation" id="consultation">
        <p className="connect-kicker">Personal follow-up</p>
        <h2>{org.journey.consultationTitle}</h2>
        <p>{org.journey.consultationCopy}</p>
        <Link className="connect-primary" href={`/connect/${org.slug}?source=Direct&event=Consultation%20Request`}>
          {org.journey.consultationCta}
        </Link>
      </section>
    </main>
  );
}

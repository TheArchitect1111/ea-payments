import Link from 'next/link';
import { getConnectOrg } from '@/lib/connect-store';
import '../connect.css';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ org: string }>;
};

export default async function ConnectGuidePage({ params }: Props) {
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
      <section className="connect-resource-page">
        <p className="connect-kicker">{org.name}</p>
        <h1>{isCpr ? 'Parent Recruiting Guide' : org.offer.resourceTitle}</h1>
        <p>
          A clear first look at what families should understand after meeting Canadian Prospects:
          visibility, development, exposure, academics, and the next right conversation.
        </p>

        <div className="connect-guide-grid">
          {[
            ['1', 'Know the path', 'Recruiting is a process, not a single event. Families need a plan for development, exposure, communication, and decisions.'],
            ['2', 'Build the profile', 'Academics, video, measurable growth, coachability, and consistency all shape the opportunity picture.'],
            ['3', 'Choose the next step', 'The right next step is usually evaluation, guidance, and a realistic plan for where the athlete can grow.'],
          ].map(([num, title, copy]) => (
            <article key={num}>
              <span>{num}</span>
              <h2>{title}</h2>
              <p>{copy}</p>
            </article>
          ))}
        </div>

        <section className="connect-faq" id="faq">
          <p className="connect-kicker">Recruiting FAQ</p>
          <div>
            <h2>When should families start?</h2>
            <p>Start by understanding the athlete’s current level, development needs, academics, and realistic opportunities.</p>
          </div>
          <div>
            <h2>What happens after a showcase?</h2>
            <p>The best follow-up is specific: profile review, film/evaluation, academic fit, and a clear next action.</p>
          </div>
          <div>
            <h2>How does CPR help?</h2>
            <p>CPR helps families move from confusion to a guided pathway built around the athlete’s future.</p>
          </div>
        </section>

        <div className="connect-guide-actions">
          <Link className="connect-primary" href={`/connect/${org.slug}/journey#programs`}>
            View Programs & Camps
          </Link>
          <Link className="connect-ghost" href={`/connect/${org.slug}/journey#consultation`}>
            Schedule Consultation
          </Link>
        </div>
      </section>
    </main>
  );
}

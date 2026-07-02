import Link from 'next/link';
import { getConnectOrg } from '@/lib/connect-store';
import '../connect.css';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ org: string }>;
};

export default async function ConnectGuidePage({ params }: Props) {
  const { org: orgSlug } = await params;
  const org = await getConnectOrg(orgSlug);

  return (
    <main
      className={`connect-site${org.theme === 'cpr' ? ' connect-cpr' : ''}`}
      style={{
        '--connect-ink': org.colors.ink,
        '--connect-accent': org.colors.accent,
        '--connect-soft': org.colors.soft,
      } as React.CSSProperties}
    >
      <section className="connect-resource-page">
        <p className="connect-kicker">{org.name}</p>
        <h1>{org.guide.title}</h1>
        <p>{org.guide.intro}</p>

        <div className="connect-guide-grid">
          {org.guide.sections.map((section) => (
            <article key={section.number}>
              <span>{section.number}</span>
              <h2>{section.title}</h2>
              <p>{section.copy}</p>
            </article>
          ))}
        </div>

        <section className="connect-faq" id="faq">
          <p className="connect-kicker">{org.guide.faqTitle}</p>
          {org.guide.faqs.map((faq) => (
            <div key={faq.question}>
              <h2>{faq.question}</h2>
              <p>{faq.answer}</p>
            </div>
          ))}
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

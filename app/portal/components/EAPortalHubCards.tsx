import { getEAPortalHubModules } from '@/lib/ea-portal-hub-modules';

type Props = {
  slug: string;
};

export default async function EAPortalHubCards({ slug }: Props) {
  const modules = await getEAPortalHubModules(slug);

  return (
    <section className="ep-hub-section">
      <p className="ep-hub-eyebrow">Your EA platform</p>
      <h2 className="ep-hub-title">Everything in one place</h2>
      <p className="ep-hub-intro">
        Pulse, Simplifi, Magnifi, and Amplifi — the full operating rhythm for clients and testers.
      </p>
      <div className="ep-hub-grid">
        {modules.map((mod) => (
          <a
            key={mod.href}
            href={mod.href}
            className={`ep-hub-card${
              mod.variant === 'pulse'
                ? ' ep-hub-card-pulse'
                : mod.variant === 'amplifi'
                  ? ' ep-hub-card-amplifi'
                  : mod.variant === 'simplifi'
                    ? ' ep-hub-card-simplifi'
                    : ''
            }`}
          >
            <span className="ep-hub-tag">{mod.tag}</span>
            <strong>{mod.title}</strong>
            <p>{mod.description}</p>
            <span className="ep-hub-cta">Open →</span>
          </a>
        ))}
      </div>
    </section>
  );
}

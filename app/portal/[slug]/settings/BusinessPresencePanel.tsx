import { BUSINESS_PRESENCE_PROVIDERS } from '@/lib/business-presence';

export function BusinessPresencePanel() {
  return (
    <section className="ep-presence" aria-labelledby="business-presence-heading">
      <header className="ep-presence__header">
        <div>
          <p className="ep-presence__eyebrow">Connections · Business presence</p>
          <h2 id="business-presence-heading">Help customers discover and trust your business</h2>
          <p>
            Prepare and manage how your organization appears where customers search, compare,
            and take action.
          </p>
        </div>
      </header>

      {BUSINESS_PRESENCE_PROVIDERS.map((provider) => (
        <article key={provider.id} className="ep-presence__provider">
          <div className="ep-presence__provider-heading">
            <div className="ep-presence__mark" aria-hidden="true">A</div>
            <div>
              <p className="ep-presence__eyebrow">{provider.category}</p>
              <h3>{provider.name}</h3>
            </div>
            <span className="ep-presence__status">Ready for guided setup</span>
          </div>

          <p className="ep-presence__summary">{provider.summary}</p>

          <div className="ep-presence__columns">
            <div>
              <h4>Business value</h4>
              <ul>{provider.value.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
            <div>
              <h4>EVA readiness</h4>
              <ul>{provider.evaReadinessChecks.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          </div>

          <details className="ep-presence__checklist">
            <summary>View the guided setup checklist</summary>
            <ol>{provider.setupChecklist.map((item) => <li key={item}>{item}</li>)}</ol>
            <p><strong>Available customer actions:</strong> {provider.supportedActions.join(' · ')}</p>
          </details>

          <div className="ep-presence__actions">
            <a className="ep-btn" href={provider.setupUrl} target="_blank" rel="noopener noreferrer">
              Set up Apple Business
            </a>
            <p>{provider.automationNote}</p>
          </div>
        </article>
      ))}
    </section>
  );
}

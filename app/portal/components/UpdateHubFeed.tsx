'use client';

import type { UpdateHubFeedItem } from '@/lib/update-hub-feed';

function formatWhen(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function UpdateHubFeed({
  items,
  organizationName,
}: {
  items: UpdateHubFeedItem[];
  organizationName: string;
}) {
  return (
    <section className="uh-feed ep-card mt-6">
      <p className="ep-card-title">Published updates</p>
      <p className="uh-feed-sub">
        Live communications for {organizationName} — what your stakeholders see after publish.
      </p>

      {items.length === 0 ? (
        <div className="uh-feed-empty">
          <p>No published updates yet.</p>
          <p className="uh-feed-empty-hint">Submit a request above — your EA team publishes here when ready.</p>
        </div>
      ) : (
        <div className="uh-feed-list">
          {items.map((item) => (
            <article key={item.id} className="uh-feed-item">
              <div className="uh-feed-meta">
                <span className="uh-feed-badge">{item.requestType}</span>
                <time dateTime={item.date}>{formatWhen(item.date)}</time>
              </div>
              <h2 className="uh-feed-title">{item.title}</h2>
              <p className="uh-feed-body">{item.body}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

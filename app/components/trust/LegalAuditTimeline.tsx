'use client';

import { CREAM, NAVY } from '@/lib/design-system';
import type { LegalAuditEvent } from '@/lib/trust-engine/types';

export function LegalAuditTimeline({
  events,
  title = 'Legal audit trail',
}: {
  events: LegalAuditEvent[];
  title?: string;
}) {
  return (
    <section aria-labelledby="legal-audit-heading">
      <h2
        id="legal-audit-heading"
        style={{ margin: '0 0 1rem', color: NAVY, fontSize: '1.2rem', fontWeight: 800 }}
      >
        {title}
      </h2>
      {events.length === 0 ? (
        <p style={{ color: '#666' }}>No legal events recorded yet.</p>
      ) : (
        <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {events.map((event) => (
            <li
              key={event.id}
              style={{
                background: CREAM,
                borderLeft: `2px solid ${NAVY}`,
                padding: '0.9rem 1rem',
                marginBottom: '0.65rem',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '0.7rem',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#775d12',
                  fontWeight: 700,
                }}
              >
                {event.type.replace(/_/g, ' ')}
              </p>
              <p style={{ margin: '0.35rem 0 0', color: NAVY, fontWeight: 600 }}>
                {event.summary}
              </p>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: '#666' }}>
                {new Date(event.at).toLocaleString()}
                {event.email ? ` · ${event.email}` : ''}
                {event.organizationName ? ` · ${event.organizationName}` : ''}
                {event.version ? ` · v${event.version}` : ''}
                {event.ipAddress ? ` · IP ${event.ipAddress}` : ''}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

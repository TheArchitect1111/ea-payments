'use client';

import Link from 'next/link';
import { CREAM, GOLD, NAVY } from '@/lib/design-system';
import type { ClientLegalDocRow, LegalDocDisplayStatus } from '@/lib/trust-engine/types';

const STATUS_LABEL: Record<LegalDocDisplayStatus, string> = {
  current: 'Current',
  update_required: 'Update Required',
  pending: 'Pending',
  signed: 'Signed',
};

const STATUS_TONE: Record<LegalDocDisplayStatus, string> = {
  current: '#047857',
  update_required: '#991b1b',
  pending: '#775d12',
  signed: NAVY,
};

export type LegalStatusDashboardProps = {
  documents: ClientLegalDocRow[];
  title?: string;
  lede?: string;
};

/**
 * Reusable client Legal Status — premium cards for Trust Engine documents.
 */
export function LegalStatusDashboard({
  documents,
  title = 'Legal status',
  lede = 'Your agreements with Efficiency Architects — versions, acceptance, and what needs attention.',
}: LegalStatusDashboardProps) {
  return (
    <section aria-labelledby="legal-status-heading">
      <h2
        id="legal-status-heading"
        style={{ margin: 0, color: NAVY, fontSize: '1.35rem', fontWeight: 800 }}
      >
        {title}
      </h2>
      <p style={{ margin: '0.5rem 0 1.5rem', color: '#555', maxWidth: '42rem', fontSize: '0.95rem' }}>
        {lede}
      </p>
      <div
        style={{
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        }}
      >
        {documents.map((doc) => (
          <article
            key={doc.docType}
            style={{
              background: CREAM,
              borderLeft: `3px solid ${STATUS_TONE[doc.status]}`,
              padding: '1.25rem 1.2rem',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '0.7rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontWeight: 700,
                color: STATUS_TONE[doc.status],
              }}
            >
              {STATUS_LABEL[doc.status]}
            </p>
            <h3 style={{ margin: '0.45rem 0 0.85rem', color: NAVY, fontSize: '1.05rem' }}>
              {doc.title}
            </h3>
            <dl style={{ margin: 0, fontSize: '0.85rem', color: '#444', lineHeight: 1.65 }}>
              <div>
                <dt style={{ display: 'inline', fontWeight: 600 }}>Current version: </dt>
                <dd style={{ display: 'inline', margin: 0 }}>{doc.currentVersion}</dd>
              </div>
              <div>
                <dt style={{ display: 'inline', fontWeight: 600 }}>Accepted version: </dt>
                <dd style={{ display: 'inline', margin: 0 }}>
                  {doc.acceptedVersion ?? '—'}
                </dd>
              </div>
              <div>
                <dt style={{ display: 'inline', fontWeight: 600 }}>Acceptance date: </dt>
                <dd style={{ display: 'inline', margin: 0 }}>
                  {doc.acceptanceDate
                    ? new Date(doc.acceptanceDate).toLocaleDateString()
                    : '—'}
                </dd>
              </div>
            </dl>
            <p style={{ margin: '1rem 0 0' }}>
              <Link
                href={doc.href}
                style={{
                  color: NAVY,
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  borderBottom: `1px solid ${GOLD}`,
                  textDecoration: 'none',
                }}
              >
                View document
              </Link>
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

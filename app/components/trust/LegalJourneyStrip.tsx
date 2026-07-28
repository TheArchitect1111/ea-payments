'use client';

import { NAVY, GOLD } from '@/lib/design-system';
import type { LegalJourneyMilestone } from '@/lib/trust-engine/types';

/** Lightweight journey strip reflecting legal + project milestones. */
export function LegalJourneyStrip({ milestones }: { milestones: LegalJourneyMilestone[] }) {
  return (
    <nav aria-label="Client journey" style={{ margin: '1.5rem 0 2rem' }}>
      <ol
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem 0.35rem',
          alignItems: 'center',
        }}
      >
        {milestones.map((m, i) => (
          <li key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '0.35rem 0.65rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: m.complete ? GOLD : '#666',
                background: m.complete ? NAVY : 'transparent',
                border: m.complete ? 'none' : '1px solid #ccc',
              }}
              title={m.legalLinked ? 'Legal milestone' : undefined}
            >
              {m.label}
            </span>
            {i < milestones.length - 1 ? (
              <span style={{ color: '#bbb', fontSize: '0.75rem' }} aria-hidden>
                →
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

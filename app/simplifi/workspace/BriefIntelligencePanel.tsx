'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { BriefIntelItem, BriefIntelSectionKey } from '@/lib/simplifi-os';

const SECTION_LABELS: Record<BriefIntelSectionKey, string> = {
  needsAttention: 'Needs Your Attention',
  momentum: 'Opportunities Gaining Momentum',
  commitmentsAtRisk: 'Commitments at Risk',
  recommendedFollowUps: 'Recommended Follow-ups',
  emergingConnections: 'Emerging Connections',
  nextBestActions: 'Next Best Actions',
};

const SECTION_ORDER: BriefIntelSectionKey[] = [
  'needsAttention',
  'commitmentsAtRisk',
  'momentum',
  'recommendedFollowUps',
  'emergingConnections',
  'nextBestActions',
];

type Props = {
  enabled: boolean;
  sections: Record<BriefIntelSectionKey, BriefIntelItem[]>;
};

export default function BriefIntelligencePanel({ enabled, sections }: Props) {
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const visibleKeys = SECTION_ORDER.filter((key) =>
    (sections[key] ?? []).some((i) => !hidden[i.id]),
  );
  const hasItems = visibleKeys.length > 0;

  useEffect(() => {
    if (!enabled || !hasItems) return;
    const ids = SECTION_ORDER.flatMap((key) => sections[key] ?? []).map((i) => i.id);
    for (const id of ids.slice(0, 12)) {
      void fetch('/api/simplifi/intelligence/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: id, action: 'viewed' }),
      }).catch(() => undefined);
    }
  }, [enabled, hasItems, sections]);

  if (!enabled || !hasItems) return null;

  const act = async (itemId: string, action: string) => {
    setBusy(`${itemId}:${action}`);
    try {
      await fetch('/api/simplifi/intelligence/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, action }),
      });
      if (action === 'completed' || action === 'dismissed' || action === 'ignored') {
        setHidden((h) => ({ ...h, [itemId]: true }));
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="sw-brief-intel" aria-label="Opportunity intelligence">
      <div className="sw-today-brief-head">
        <h2>Opportunity Intelligence</h2>
      </div>
      {SECTION_ORDER.map((key) => {
        const items = (sections[key] ?? []).filter((i) => !hidden[i.id]);
        if (items.length === 0) return null;
        return (
          <div key={key} className="sw-brief-intel-section">
            <h3>{SECTION_LABELS[key]}</h3>
            <ul className="sw-today-list">
              {items.map((item) => (
                <li key={item.id} className="sw-brief-intel-item">
                  <div className="sw-today-copy">
                    {item.href ? (
                      <Link href={item.href} onClick={() => void act(item.id, 'opened')}>
                        <strong>{item.title}</strong>
                      </Link>
                    ) : (
                      <strong>{item.title}</strong>
                    )}
                    <p>{item.detail}</p>
                    <p className="sw-muted">
                      <em>Why this matters:</em> {item.whyMatters}
                    </p>
                    <p className="sw-muted">
                      <em>Next:</em> {item.nextAction}
                    </p>
                    <div className="sw-brief-intel-actions">
                      {(
                        [
                          ['opened', 'Open'],
                          ['completed', 'Complete'],
                          ['deferred', 'Defer'],
                          ['dismissed', 'Dismiss'],
                          ['helpful', 'Helpful'],
                          ['incorrect', 'Incorrect'],
                        ] as const
                      ).map(([action, label]) => (
                        <button
                          key={action}
                          type="button"
                          className="sw-brief-intel-btn"
                          disabled={busy === `${item.id}:${action}`}
                          onClick={() => void act(item.id, action)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}

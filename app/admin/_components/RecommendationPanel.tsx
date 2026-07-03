'use client';

import { NAVY, GOLD } from '@/lib/design-system';
import type { CaptureRecord } from '@/lib/capture-records';
import TrustPanel from '../_components/TrustPanel';

function parsePriorities(summary?: string): string[] {
  if (!summary) return [];
  const lines = summary.split('\n');
  const start = lines.findIndex((l) => l.startsWith('Top 3 priorities:'));
  if (start === -1) return [];
  return lines.slice(start + 1).filter((l) => l.match(/^#\d/));
}

export default function RecommendationPanel({ capture }: { capture: CaptureRecord }) {
  const priorities = parsePriorities(capture.recommendationSummary);
  const template = capture.blueprintTemplate;

  if (!capture.recommendationSummary && !template) return null;

  return (
    <div className="space-y-3 mt-3">
      {template && (
        <p className="text-xs">
          <span className="font-bold uppercase tracking-wider text-neutral-500">Magnifi template · </span>
          <span className="font-semibold" style={{ color: NAVY }}>
            {template}
          </span>
        </p>
      )}

      {priorities.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
            Top 3 Priorities™
          </p>
          <ol className="space-y-2">
            {priorities.map((line, i) => (
              <li
                key={i}
                className="text-xs text-neutral-700 pl-3 border-l-2"
                style={{ borderColor: GOLD }}
              >
                {line.replace(/^#\d+\s*/, '')}
              </li>
            ))}
          </ol>
        </div>
      )}

      <TrustPanel
        confidence={capture.trustConfidence}
        compact
        sources={
          capture.sourceUrl
            ? [{ label: capture.title, url: capture.sourceUrl }]
            : [{ label: capture.title }]
        }
      />
    </div>
  );
}

'use client';

import type { AdoptionHealthResult } from '@/lib/adoption-engine';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';

const LABEL_COLOR: Record<string, string> = {
  Healthy: '#065F46',
  'At Risk': '#B45309',
  'Needs Attention': '#991B1B',
};

export default function AdoptionHealthPanel({
  adoption,
  compact = false,
}: {
  adoption: AdoptionHealthResult;
  compact?: boolean;
}) {
  return (
    <div
      className={`border rounded ${compact ? 'p-4' : 'p-6'}`}
      style={{ borderColor: `${GOLD}44`, backgroundColor: '#FAFAF8' }}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
          Adoption Engine™
        </p>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded"
          style={{ color: LABEL_COLOR[adoption.label], backgroundColor: '#fff' }}
        >
          {adoption.score}/100 · {adoption.label}
        </span>
      </div>

      {!compact && (
        <p className="text-sm text-neutral-600 mb-4">{adoption.recommendation}</p>
      )}

      <ul className="space-y-2">
        {adoption.factors.map((f) => (
          <li key={f.name} className="flex justify-between gap-3 text-xs">
            <span className="text-neutral-600">{f.name}</span>
            <span className="font-semibold shrink-0" style={{ color: NAVY }}>
              {Math.round(f.score)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

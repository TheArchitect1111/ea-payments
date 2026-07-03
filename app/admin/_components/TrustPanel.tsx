'use client';

import { NAVY, GOLD } from '@/lib/design-system';
export interface TrustPanelProps {
  confidence?: number;
  confidenceLabel?: 'High' | 'Medium' | 'Low';
  method?: string;
  sources?: { label: string; url?: string }[];
  reasoning?: string[];
  compact?: boolean;
}

function confidenceColor(label?: string): string {
  if (label === 'High') return '#065F46';
  if (label === 'Medium') return '#B45309';
  return '#991B1B';
}

export default function TrustPanel({
  confidence,
  confidenceLabel,
  method,
  sources,
  reasoning,
  compact = false,
}: TrustPanelProps) {
  if (confidence == null) return null;

  const label =
    confidenceLabel ??
    (confidence >= 75 ? 'High' : confidence >= 50 ? 'Medium' : 'Low');

  return (
    <div
      className={`border rounded ${compact ? 'p-3' : 'p-4'}`}
      style={{ borderColor: `${GOLD}55`, backgroundColor: '#FFFBF0' }}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
          Trust Layer™
        </p>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded"
          style={{ color: confidenceColor(label), backgroundColor: '#fff' }}
        >
          {confidence}/100 · {label} confidence
        </span>
      </div>

      {!compact && method && (
        <p className="text-xs text-neutral-600 mb-2">
          <span className="font-semibold">How:</span> {method}
        </p>
      )}

      {sources && sources.length > 0 && (
        <div className="mb-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
            Sources
          </p>
          <ul className="text-xs text-neutral-600 space-y-0.5">
            {sources.slice(0, compact ? 2 : 5).map((s, i) => (
              <li key={i}>
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: NAVY }}>
                    {s.label}
                  </a>
                ) : (
                  s.label
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {reasoning && reasoning.length > 0 && !compact && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
            Why
          </p>
          <ul className="text-xs text-neutral-600 space-y-1 list-disc pl-4">
            {reasoning.slice(0, 4).map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

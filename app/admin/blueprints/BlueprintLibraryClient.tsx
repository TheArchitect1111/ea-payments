'use client';

import { NAVY, GOLD } from '@/lib/design-system';
import { useState } from 'react';
import type { CaptureRecord } from '@/lib/capture-records';
import TrustPanel from '../_components/TrustPanel';

function parseBlueprintSections(summary?: string): { title: string; content: string }[] {
  if (!summary) return [];
  const parts = summary.split(/\n## /);
  return parts
    .slice(1)
    .map((block) => {
      const [titleLine, ...rest] = block.split('\n');
      return { title: titleLine.trim(), content: rest.join('\n').trim() };
    })
    .filter((s) => s.title);
}

export default function BlueprintLibraryClient({
  initialCaptures,
}: {
  initialCaptures: CaptureRecord[];
}) {
  const [selected, setSelected] = useState<CaptureRecord | null>(
    initialCaptures[0] ?? null
  );

  const sections = parseBlueprintSections(selected?.blueprintSummary);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: GOLD }}>
          Auto Blueprint™
        </p>
        <h2 className="text-2xl font-extrabold" style={{ color: NAVY }}>
          Blueprint Library
        </h2>
        <p className="text-sm text-neutral-500 mt-2 max-w-2xl">
          Wave 3 stubs generated from Magnifi templates — Opening Reveal, Hidden Opportunity,
          Future-State, Top 3 Priorities, First Step, and 30/60/90 roadmap.
        </p>
      </div>

      {initialCaptures.length === 0 ? (
        <div className="bg-white border border-neutral-200 p-12 text-center">
          <p className="text-neutral-500 mb-2">No blueprints yet.</p>
          <a href="/admin/resource-radar" className="text-sm underline" style={{ color: GOLD }}>
            Analyze a URL in Resource Radar →
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-2">
            {initialCaptures.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelected(c)}
                className={`w-full text-left p-4 border rounded transition ${
                  selected?.id === c.id
                    ? 'border-neutral-400 bg-white shadow-sm'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <p className="text-sm font-bold truncate" style={{ color: NAVY }}>
                  {c.title}
                </p>
                <p className="text-xs text-neutral-500 mt-1">{c.blueprintTemplate}</p>
                <p className="text-xs mt-2" style={{ color: GOLD }}>
                  EA Fit {c.eaFitScore ?? '—'} · Trust {c.trustConfidence ?? '—'}
                </p>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2 space-y-4">
            {selected && (
              <>
                <div className="bg-white border border-neutral-200 p-6">
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: GOLD }}>
                    {selected.blueprintTemplate}
                  </p>
                  <h3 className="text-xl font-extrabold mb-2" style={{ color: NAVY }}>
                    {selected.title}
                  </h3>
                  {selected.sourceUrl && (
                    <a
                      href={selected.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-neutral-400 hover:underline"
                    >
                      {selected.sourceUrl}
                    </a>
                  )}
                  <TrustPanel
                    confidence={selected.trustConfidence}
                    sources={
                      selected.sourceUrl
                        ? [{ label: selected.title, url: selected.sourceUrl }]
                        : [{ label: selected.title }]
                    }
                    compact
                  />
                </div>

                {sections.map((section) => (
                  <div key={section.title} className="bg-white border border-neutral-200 p-5">
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: GOLD }}>
                      {section.title}
                    </p>
                    <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">
                      {section.content}
                    </p>
                    <span className="inline-block mt-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border border-neutral-200 px-2 py-0.5 rounded">
                      Stub — Wave 3
                    </span>
                  </div>
                ))}

                {selected.recommendationSummary && (
                  <div className="bg-neutral-50 border border-neutral-200 p-5">
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: NAVY }}>
                      Full recommendation summary
                    </p>
                    <pre className="text-xs text-neutral-600 whitespace-pre-wrap font-sans">
                      {selected.recommendationSummary}
                    </pre>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

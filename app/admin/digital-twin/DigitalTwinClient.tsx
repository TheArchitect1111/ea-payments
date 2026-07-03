'use client';

import { NAVY, GOLD } from '@/lib/design-system';
import { useState } from 'react';
import type { DigitalTwinProfile } from '@/lib/digital-twin';
import TrustPanel from '../_components/TrustPanel';

const TREND_COLOR = {
  rising: '#065F46',
  stable: '#1D4ED8',
  'at-risk': '#B45309',
};

export default function DigitalTwinClient({
  platformTwin,
  entities,
  captureTwins,
}: {
  platformTwin: DigitalTwinProfile;
  entities: { id: string; name: string; type: string }[];
  captureTwins: DigitalTwinProfile[];
}) {
  const [selectedId, setSelectedId] = useState('ea-platform');

  const twin =
    selectedId === 'ea-platform'
      ? platformTwin
      : captureTwins.find((t) => t.entityId === selectedId) ?? platformTwin;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: GOLD }}>
          Digital Twin™
        </p>
        <h2 className="text-2xl font-extrabold" style={{ color: NAVY }}>
          Operational mirror
        </h2>
        <p className="text-sm text-neutral-500 mt-2 max-w-2xl">
          Live synthesis of platform health, capture intelligence, and adoption posture — the EA
          organizational mirror for decision-making.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {entities.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => setSelectedId(e.id)}
            className={`text-xs px-3 py-1.5 rounded border ${
              selectedId === e.id
                ? 'border-neutral-800 bg-neutral-900 text-white'
                : 'border-neutral-200 bg-white hover:border-neutral-400'
            }`}
          >
            {e.name.slice(0, 40)}
          </button>
        ))}
      </div>

      <div className="bg-white border border-neutral-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: GOLD }}>
          {twin.entityType}
        </p>
        <h3 className="text-xl font-extrabold mb-2" style={{ color: NAVY }}>
          {twin.name}
        </h3>
        <p className="text-sm text-neutral-600 mb-6">{twin.narrative}</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {twin.dimensions.map((d) => (
            <div key={d.name} className="border border-neutral-100 p-4 rounded">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-neutral-500">{d.name}</p>
                <span
                  className="text-[10px] font-bold uppercase"
                  style={{ color: TREND_COLOR[d.trend] }}
                >
                  {d.trend}
                </span>
              </div>
              <p className="text-2xl font-extrabold" style={{ color: NAVY }}>
                {d.score}
              </p>
              <p className="text-xs text-neutral-500 mt-2">{d.insight}</p>
            </div>
          ))}
        </div>

        {twin.adoptionScore != null && (
          <p className="text-sm mb-4">
            <span className="font-bold" style={{ color: GOLD }}>
              Adoption Health: {twin.adoptionScore}/100
            </span>
          </p>
        )}

        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              Active products
            </p>
            <div className="flex flex-wrap gap-1">
              {twin.activeProducts.map((p) => (
                <span
                  key={p}
                  className="text-xs px-2 py-0.5 rounded bg-neutral-100 text-neutral-700"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              Pipeline
            </p>
            <ol className="text-xs text-neutral-600 space-y-1 list-decimal pl-4">
              {twin.pipeline.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <TrustPanel
        confidence={72}
        confidenceLabel="Medium"
        method="Digital Twin engine — weighted dimensions from live Airtable signals"
        sources={[{ label: twin.name }]}
        reasoning={[
          'Platform twin aggregates captures and proposals.',
          'Entity twins inherit capture and proposal linkages.',
          'Refreshes on page load.',
        ]}
        compact
      />
    </div>
  );
}

'use client';

import { NAVY, GOLD } from '@/lib/design-system';
import { useCallback, useEffect, useState } from 'react';
import type {
  OpportunityGraph,
  OpportunityGraphEdge,
  OpportunityGraphNode,
} from '@ea/portal-chassis/opportunity-graph';
import TrustPanel from '../_components/TrustPanel';

const TYPE_COLOR: Record<string, string> = {
  organization: '#1D4ED8',
  capture: '#C9A844',
  product: '#065F46',
  partner: '#5B21B6',
  proof: '#B45309',
  proposal: '#991B1B',
  satellite: '#0F766E',
  intent: '#7C3AED',
  opportunity: '#EA580C',
  ctp_submission: '#0891B2',
  action: '#4B5563',
};

export default function OpportunityGraphClient() {
  const [graph, setGraph] = useState<OpportunityGraph | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<OpportunityGraphNode | null>(null);

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const url = q
        ? `/api/admin/opportunity-graph?q=${encodeURIComponent(q)}`
        : '/api/admin/opportunity-graph';
      const res = await fetch(url);
      const data = (await res.json()) as { ok?: boolean; graph?: OpportunityGraph };
      if (data.graph) {
        setGraph(data.graph);
        setSelected(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const displayNodes = graph?.nodes.slice(0, 60) ?? [];
  const displayEdges = graph?.edges.slice(0, 40) ?? [];

  const grouped = displayNodes.reduce<Record<string, OpportunityGraphNode[]>>((acc, node) => {
    acc[node.type] = acc[node.type] ?? [];
    acc[node.type].push(node);
    return acc;
  }, {});

  const priorityTypes = ['intent', 'opportunity', 'ctp_submission', 'capture', 'action'];
  const sortedGroups = Object.entries(grouped).sort(([a], [b]) => {
    const ai = priorityTypes.indexOf(a);
    const bi = priorityTypes.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: GOLD }}>
          Opportunity Graph™
        </p>
        <h2 className="text-2xl font-extrabold" style={{ color: NAVY }}>
          Intent, opportunity, and action topology
        </h2>
        <p className="text-sm text-neutral-500 mt-2 max-w-2xl">
          Merges organizational memory with ActivityEvents and resolved admin intents. Each intent
          you submit from Mission Control, EA Voice, or ⌘K is persisted and linked here.
        </p>
      </div>

      {graph && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Stat label="Nodes" value={String(graph.stats.nodeCount)} />
          <Stat label="Edges" value={String(graph.stats.edgeCount)} />
          <Stat label="Intents" value={String(graph.stats.intentCount)} />
          <Stat label="Opportunities" value={String(graph.stats.opportunityCount)} />
          <Stat label="Updated" value={new Date(graph.generatedAt).toLocaleTimeString()} />
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search intents, captures, opportunities…"
          className="flex-1 min-w-[200px] border border-neutral-200 rounded px-3 py-2 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && load(search)}
        />
        <button
          type="button"
          onClick={() => load(search)}
          className="px-4 py-2 text-sm font-bold text-white rounded"
          style={{ backgroundColor: NAVY }}
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => {
            setSearch('');
            load();
          }}
          className="px-4 py-2 text-sm border border-neutral-200 rounded"
        >
          Reset
        </button>
        <a
          href="/admin/knowledge-graph"
          className="px-4 py-2 text-sm border border-neutral-200 rounded text-neutral-600 hover:bg-neutral-50"
        >
          Knowledge Graph
        </a>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">Building opportunity graph…</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {sortedGroups.map(([type, nodes]) => (
              <div key={type} className="bg-white border border-neutral-200 p-4">
                <p
                  className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: TYPE_COLOR[type] ?? NAVY }}
                >
                  {type.replace(/_/g, ' ')} ({nodes.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {nodes.map((node) => (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => setSelected(node)}
                      className={`text-xs px-2 py-1 rounded border transition text-left ${
                        selected?.id === node.id
                          ? 'border-neutral-800 bg-neutral-50'
                          : 'border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      {node.label.slice(0, 40)}
                      {node.score != null && (
                        <span className="ml-1 opacity-60">{node.score}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {selected ? (
              <div className="bg-white border border-neutral-200 p-5">
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: GOLD }}>
                  {selected.type.replace(/_/g, ' ')}
                </p>
                <h3 className="font-bold mb-2" style={{ color: NAVY }}>
                  {selected.label}
                </h3>
                {selected.summary && (
                  <p className="text-xs text-neutral-600 mb-2">{selected.summary}</p>
                )}
                {selected.score != null && (
                  <p className="text-sm font-semibold" style={{ color: GOLD }}>
                    Score: {selected.score}
                  </p>
                )}
                {selected.href && (
                  <a
                    href={selected.href}
                    className="text-xs text-blue-700 underline mt-2 inline-block"
                  >
                    Open linked workspace
                  </a>
                )}
                <ul className="mt-3 text-xs text-neutral-600 space-y-1">
                  {displayEdges
                    .filter((e) => e.source === selected.id || e.target === selected.id)
                    .slice(0, 10)
                    .map((e) => (
                      <li key={e.id}>
                        {e.relationship.replace(/_/g, ' ')}
                        {e.label ? `: ${e.label.slice(0, 40)}` : ''}
                      </li>
                    ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-neutral-400">
                Select a node to see relationships. Intent nodes appear after you route commands
                from Mission Control.
              </p>
            )}

            <TrustPanel
              confidence={72}
              confidenceLabel="Medium"
              method="Opportunity graph merges knowledge graph seed + ActivityEvents + intent.resolved events"
              sources={[
                { label: 'Knowledge Graph (seed)' },
                { label: 'ActivityEvents' },
                { label: 'Intent Router' },
                { label: 'Pulse convergence' },
              ]}
              reasoning={[
                'Intent nodes persist on each /api/admin/intent call.',
                'Capture and CTP events link via activity stream.',
                'Search filters subgraph without losing edge context.',
              ]}
              compact
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-neutral-200 p-4">
      <p className="text-xl font-extrabold" style={{ color: NAVY }}>
        {value}
      </p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );
}

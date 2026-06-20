'use client';

import { useCallback, useEffect, useState } from 'react';
import type { GraphEdge, GraphNode, KnowledgeGraph } from '@/lib/knowledge-graph';
import TrustPanel from '../_components/TrustPanel';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';

const TYPE_COLOR: Record<string, string> = {
  organization: '#1D4ED8',
  capture: '#C9A844',
  product: '#065F46',
  partner: '#5B21B6',
  proof: '#B45309',
  proposal: '#991B1B',
  satellite: '#0F766E',
};

export default function KnowledgeGraphClient() {
  const [graph, setGraph] = useState<KnowledgeGraph | null>(null);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GraphNode | null>(null);

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const url = q ? `/api/admin/knowledge-graph?q=${encodeURIComponent(q)}` : '/api/admin/knowledge-graph';
      const res = await fetch(url);
      const data = (await res.json()) as {
        ok?: boolean;
        graph?: KnowledgeGraph;
        search?: { nodes: GraphNode[]; edges: GraphEdge[] };
      };
      if (data.graph) setGraph(data.graph);
      setResults(q ? data.search ?? null : null);
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

  const displayNodes = results?.nodes ?? graph?.nodes.slice(0, 40) ?? [];
  const displayEdges = results?.edges ?? graph?.edges.slice(0, 30) ?? [];

  const grouped = displayNodes.reduce<Record<string, GraphNode[]>>((acc, node) => {
    acc[node.type] = acc[node.type] ?? [];
    acc[node.type].push(node);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: GOLD }}>
          Knowledge Graph™
        </p>
        <h2 className="text-2xl font-extrabold" style={{ color: NAVY }}>
          Organizational memory
        </h2>
        <p className="text-sm text-neutral-500 mt-2 max-w-2xl">
          Connects captures, products, partners, proposals, proof stories, and satellite hubs.
          Ask EA Voice: &quot;Search graph for Simplifi&quot; or &quot;Who uses Community Hub?&quot;
        </p>
      </div>

      {graph && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Nodes" value={String(graph.stats.nodeCount)} />
          <Stat label="Edges" value={String(graph.stats.edgeCount)} />
          <Stat
            label="Top products"
            value={graph.stats.topProducts[0] ?? '—'}
            sub={graph.stats.topProducts.slice(1, 3).join(', ')}
          />
          <Stat label="Updated" value={new Date(graph.generatedAt).toLocaleTimeString()} />
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search graph…"
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
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">Building graph…</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {Object.entries(grouped).map(([type, nodes]) => (
              <div key={type} className="bg-white border border-neutral-200 p-4">
                <p
                  className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: TYPE_COLOR[type] ?? NAVY }}
                >
                  {type} ({nodes.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {nodes.map((node) => (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => setSelected(node)}
                      className={`text-xs px-2 py-1 rounded border transition ${
                        selected?.id === node.id
                          ? 'border-neutral-800 bg-neutral-50'
                          : 'border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      {node.label.slice(0, 36)}
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
                  {selected.type}
                </p>
                <h3 className="font-bold mb-2" style={{ color: NAVY }}>
                  {selected.label}
                </h3>
                {selected.meta && <p className="text-xs text-neutral-500 mb-2">{selected.meta}</p>}
                {selected.score != null && (
                  <p className="text-sm font-semibold" style={{ color: GOLD }}>
                    Score: {selected.score}
                  </p>
                )}
                <ul className="mt-3 text-xs text-neutral-600 space-y-1">
                  {displayEdges
                    .filter((e) => e.source === selected.id || e.target === selected.id)
                    .slice(0, 8)
                    .map((e) => (
                      <li key={e.id}>
                        {e.relationship.replace(/_/g, ' ')}
                        {e.label ? `: ${e.label.slice(0, 40)}` : ''}
                      </li>
                    ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-neutral-400">Select a node to see relationships.</p>
            )}

            <TrustPanel
              confidence={78}
              confidenceLabel="Medium"
              method="Graph synthesized from Airtable captures, proposals, and partner records"
              sources={[
                { label: 'Capture Records' },
                { label: 'Proposals + Assessments' },
                { label: 'Partner Network' },
                { label: 'Proof Library' },
              ]}
              reasoning={[
                'Nodes deduplicated by entity slug.',
                'Edges inferred from product alignment and referral data.',
                'Live data — refreshes on each load.',
              ]}
              compact
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-neutral-200 p-4">
      <p className="text-xl font-extrabold" style={{ color: NAVY }}>
        {value}
      </p>
      <p className="text-xs text-neutral-500">{label}</p>
      {sub && <p className="text-[10px] text-neutral-400 mt-1">{sub}</p>}
    </div>
  );
}

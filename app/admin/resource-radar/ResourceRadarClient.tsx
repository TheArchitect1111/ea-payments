'use client';

import { Fragment, useState } from 'react';
import type { CaptureRecord } from '@/lib/capture-records';
import RecommendationPanel from '../_components/RecommendationPanel';
import TrustPanel from '../_components/TrustPanel';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';

interface AnalysisResult {
  record: CaptureRecord;
  scores?: { eaFitScore: number; opportunityScore: number };
  trust?: {
    confidence: number;
    confidenceLabel: string;
    method: string;
    sources: { label: string; url?: string }[];
    reasoning: string[];
  };
  recommendations?: {
    template: { name: string; example?: string };
    firstStep: { action: string; cta: string; href?: string };
    priorities: { rank: number; title: string; eaProduct: string }[];
  };
  blueprint?: { blueprintId: string; title: string; templateName: string };
}

export default function ResourceRadarClient({
  initialCaptures,
}: {
  initialCaptures: CaptureRecord[];
}) {
  const [captures, setCaptures] = useState(initialCaptures);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<AnalysisResult | null>(null);

  const analyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setMessage('');
    setLastResult(null);
    try {
      const res = await fetch('/api/admin/captures/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), source: 'Resource Radar' }),
      });
      const data = (await res.json()) as AnalysisResult & { ok?: boolean; error?: string };
      if (!res.ok || !data.ok || !data.record) {
        setMessage(data.error ?? 'Analysis failed.');
        return;
      }
      setCaptures((prev) => [data.record!, ...prev]);
      setExpandedId(data.record.id);
      setLastResult(data);
      setUrl('');
      setMessage(
        `${data.recommendations?.template.name ?? 'Analyzed'} · EA Fit ${data.scores?.eaFitScore ?? data.record.eaFitScore}/100 · Trust ${data.trust?.confidence ?? data.record.trustConfidence}/100`
      );
    } catch {
      setMessage('Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: GOLD }}>
          Resource Radar™
        </p>
        <h2 className="text-2xl font-extrabold" style={{ color: NAVY }}>
          Opportunity & resource intelligence
        </h2>
        <p className="text-sm text-neutral-500 mt-2 max-w-2xl">
          Paste any URL — Firecrawl extracts, Resource Radar classifies, the Recommendation Engine
          picks a Magnifi template (BAS / Selena / JCSU patterns), and Auto Blueprint stubs are
          generated with Trust Layer confidence scores.
        </p>
      </div>

      <div className="bg-white border border-neutral-200 p-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[280px]">
          <label className="block text-xs font-semibold text-neutral-500 mb-1">Analyze URL</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/... or any website"
            className="w-full border border-neutral-200 rounded px-3 py-2 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && analyze()}
          />
        </div>
        <button
          type="button"
          disabled={loading || !url.trim()}
          onClick={analyze}
          className="px-5 py-2 text-sm font-bold text-white rounded disabled:opacity-50"
          style={{ backgroundColor: NAVY }}
        >
          {loading ? 'Analyzing…' : 'Capture & Analyze'}
        </button>
        <a
          href="/admin/blueprints"
          className="px-4 py-2 text-sm font-semibold border border-neutral-200 rounded hover:border-neutral-400"
          style={{ color: NAVY }}
        >
          Blueprint Library →
        </a>
      </div>

      {message && <p className="text-sm text-neutral-600">{message}</p>}

      {lastResult?.trust && (
        <TrustPanel
          confidence={lastResult.trust.confidence}
          confidenceLabel={lastResult.trust.confidenceLabel as 'High' | 'Medium' | 'Low'}
          method={lastResult.trust.method}
          sources={lastResult.trust.sources}
          reasoning={lastResult.trust.reasoning}
        />
      )}

      {lastResult?.recommendations && (
        <div className="bg-white border border-neutral-200 p-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
            Recommendation Engine™
          </p>
          <p className="text-sm font-bold" style={{ color: NAVY }}>
            {lastResult.recommendations.template.name}
            {lastResult.recommendations.template.example &&
              ` · ${lastResult.recommendations.template.example} pattern`}
          </p>
          <p className="text-sm text-neutral-600">{lastResult.recommendations.firstStep.action}</p>
          {lastResult.recommendations.firstStep.href && (
            <a
              href={lastResult.recommendations.firstStep.href}
              className="inline-block text-xs font-bold px-3 py-1.5 rounded text-white"
              style={{ backgroundColor: GOLD, color: NAVY }}
            >
              {lastResult.recommendations.firstStep.cta} →
            </a>
          )}
          {lastResult.blueprint && (
            <p className="text-xs text-neutral-500">
              Auto Blueprint {lastResult.blueprint.blueprintId} saved —{' '}
              <a href="/admin/blueprints" className="underline" style={{ color: GOLD }}>
                view in library
              </a>
            </p>
          )}
        </div>
      )}

      <div className="bg-white border border-neutral-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                Template
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                EA Fit
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                Trust
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                Opportunity
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                Source
              </th>
            </tr>
          </thead>
          <tbody>
            {captures.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-neutral-400">
                  No analyzed captures yet.
                </td>
              </tr>
            ) : (
              captures.map((c) => (
                <Fragment key={c.id}>
                  <tr
                    className="border-b border-neutral-100 cursor-pointer hover:bg-neutral-50"
                    onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium" style={{ color: NAVY }}>
                        {c.title}
                      </div>
                      {c.sourceUrl && (
                        <a
                          href={c.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-neutral-400 hover:underline truncate block max-w-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {c.sourceUrl}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-600 max-w-[140px]">
                      {c.blueprintTemplate ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: GOLD }}>
                      {c.eaFitScore ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-neutral-700">
                      {c.trustConfidence ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: NAVY }}>
                      {c.opportunityScore ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{c.source}</td>
                  </tr>
                  {expandedId === c.id && (
                    <tr className="border-b border-neutral-100 bg-neutral-50/50">
                      <td colSpan={6} className="px-4 py-4">
                        <RecommendationPanel capture={c} />
                        {c.blueprintSummary && (
                          <a
                            href="/admin/blueprints"
                            className="inline-block mt-3 text-xs font-semibold underline"
                            style={{ color: GOLD }}
                          >
                            View full Auto Blueprint in library →
                          </a>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

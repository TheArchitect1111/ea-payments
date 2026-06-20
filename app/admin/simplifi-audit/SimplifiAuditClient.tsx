'use client';

import { useState } from 'react';
import TrustPanel from '../_components/TrustPanel';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';

interface AuditResponse {
  ok?: boolean;
  error?: string;
  audit?: {
    url: string;
    title: string;
    clarityScore: number;
    source: string;
    findings: { severity: string; title: string; detail: string; category: string }[];
    patterns: string[];
    strengths: string[];
  };
  guidance?: {
    openingInsight: string;
    whatWeFound: {
      topIssues: string[];
      patterns: string[];
      missedOpportunities: string[];
      strengths: string[];
    };
    whyItMatters: string[];
    topPriorities: { rank: number; title: string; rationale: string; impact: string }[];
    firstStep: { action: string; cta: string };
    roadmap: { phase: string; focus: string }[];
    clarityScore: number;
  };
  trust?: {
    confidence: number;
    confidenceLabel: string;
    method: string;
    sources: { label: string; url?: string }[];
    reasoning: string[];
  };
}

export default function SimplifiAuditClient({ initialUrl = '' }: { initialUrl?: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<AuditResponse | null>(null);

  const runAudit = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setMessage('');
    setResult(null);
    try {
      const res = await fetch('/api/admin/audits/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = (await res.json()) as AuditResponse;
      if (!res.ok || !data.ok) {
        setMessage(data.error ?? 'Audit failed.');
        return;
      }
      setResult(data);
      setMessage(`Clarity ${data.guidance?.clarityScore ?? data.audit?.clarityScore}/100 · Simplifi guidance ready`);
    } catch {
      setMessage('Audit failed.');
    } finally {
      setLoading(false);
    }
  };

  const g = result?.guidance;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: GOLD }}>
          Simplifi™ · Playwright Audit Pipeline
        </p>
        <h2 className="text-2xl font-extrabold" style={{ color: NAVY }}>
          Website Clarity Assessment
        </h2>
        <p className="text-sm text-neutral-500 mt-2 max-w-2xl">
          Playwright pipeline audits any URL and feeds Simplifi Guidance Engine — Opening Insight,
          Top 3 Priorities, and First Step. Never a report. Always clarity.
        </p>
      </div>

      <div className="bg-white border border-neutral-200 p-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[280px]">
          <label className="block text-xs font-semibold text-neutral-500 mb-1">Website URL</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://yourclient.com"
            className="w-full border border-neutral-200 rounded px-3 py-2 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && runAudit()}
          />
        </div>
        <button
          type="button"
          disabled={loading || !url.trim()}
          onClick={runAudit}
          className="px-5 py-2 text-sm font-bold text-white rounded disabled:opacity-50"
          style={{ backgroundColor: NAVY }}
        >
          {loading ? 'Auditing…' : 'Run Simplifi Audit'}
        </button>
      </div>

      {message && <p className="text-sm text-neutral-600">{message}</p>}

      {result?.trust && (
        <TrustPanel
          confidence={result.trust.confidence}
          confidenceLabel={result.trust.confidenceLabel as 'High' | 'Medium' | 'Low'}
          method={result.trust.method}
          sources={result.trust.sources}
          reasoning={result.trust.reasoning}
        />
      )}

      {g && (
        <div className="space-y-6">
          <section className="bg-white border border-neutral-200 p-6">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: GOLD }}>
              Opening Insight™
            </p>
            <p className="text-lg font-medium leading-relaxed" style={{ color: NAVY }}>
              {g.openingInsight}
            </p>
          </section>

          <section className="bg-white border border-neutral-200 p-6">
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: GOLD }}>
              What We Found™
            </p>
            <div className="grid sm:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-xs font-bold text-neutral-500 mb-2">Top Issues</p>
                <ul className="space-y-1 text-neutral-700">
                  {g.whatWeFound.topIssues.map((t, i) => (
                    <li key={i}>• {t}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-500 mb-2">Strengths</p>
                <ul className="space-y-1 text-neutral-700">
                  {(g.whatWeFound.strengths.length ? g.whatWeFound.strengths : ['None flagged']).map(
                    (t, i) => (
                      <li key={i}>• {t}</li>
                    )
                  )}
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-white border border-neutral-200 p-6">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: GOLD }}>
              Why This Matters™
            </p>
            <ul className="space-y-2 text-sm text-neutral-700">
              {g.whyItMatters.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </section>

          <section className="bg-white border border-neutral-200 p-6">
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: GOLD }}>
              Your Top Three Priorities™
            </p>
            <ol className="space-y-4">
              {g.topPriorities.map((p) => (
                <li key={p.rank} className="border-l-2 pl-4" style={{ borderColor: GOLD }}>
                  <p className="text-sm font-bold" style={{ color: NAVY }}>
                    Priority #{p.rank}: {p.title}
                  </p>
                  <p className="text-sm text-neutral-600 mt-1">{p.rationale}</p>
                  <p className="text-xs text-neutral-400 mt-1">Impact: {p.impact}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="bg-neutral-950 text-white p-6 rounded">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: GOLD }}>
              Your First Step™
            </p>
            <p className="text-sm mb-4">{g.firstStep.action}</p>
            <a
              href="/assessment"
              className="inline-block text-xs font-bold px-4 py-2 rounded"
              style={{ backgroundColor: GOLD, color: NAVY }}
            >
              {g.firstStep.cta} →
            </a>
          </section>

          <section className="grid sm:grid-cols-3 gap-4">
            {g.roadmap.map((r) => (
              <div key={r.phase} className="bg-white border border-neutral-200 p-4">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: GOLD }}>
                  {r.phase}
                </p>
                <p className="text-sm text-neutral-700 mt-2">{r.focus}</p>
              </div>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}

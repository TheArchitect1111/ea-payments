'use client';

import { useState } from 'react';
import type { CaptureRecord } from '@/lib/capture-records';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';

interface AnalyzeResponse {
  ok?: boolean;
  error?: string;
  record?: CaptureRecord;
  scores?: { eaFitScore: number; opportunityScore: number };
  trust?: { confidence: number; confidenceLabel: string };
  recommendations?: {
    template: { name: string };
    firstStep: { action: string };
  };
  magnifiUrl?: string;
}

function scoreLabel(value?: number) {
  return value == null ? 'Not scored' : `${value}/100`;
}

export default function SimplifiPortalWorkspace({
  slug,
  initialCaptures,
}: {
  slug: string;
  initialCaptures: CaptureRecord[];
}) {
  const [captures, setCaptures] = useState(initialCaptures);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [lastResult, setLastResult] = useState<AnalyzeResponse | null>(null);

  const analyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setMessage('');
    setLastResult(null);
    try {
      const res = await fetch('/api/portal/captures/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = (await res.json()) as AnalyzeResponse;
      if (!res.ok || !data.ok || !data.record) {
        setMessage(data.error ?? 'Simplifi could not process this opportunity.');
        return;
      }
      setCaptures((prev) => [data.record!, ...prev]);
      setLastResult(data);
      setUrl('');
      setMessage('Opportunity captured. Open Magnifi to review the experience draft.');
    } catch {
      setMessage('Simplifi could not process this opportunity.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="ep-card">
        <p className="ep-card-title">Capture an Opportunity</p>
        <p className="ep-placeholder-text mb-4">
          Paste a website, profile, article, or company URL. Simplifi analyzes it and Magnifi
          drafts your opportunity experience.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 border border-neutral-200 rounded px-4 py-3 text-sm ep-input"
            onKeyDown={(e) => e.key === 'Enter' && analyze()}
          />
          <button
            type="button"
            disabled={loading || !url.trim()}
            onClick={analyze}
            className="ep-pulse-cta disabled:opacity-50"
          >
            {loading ? 'Processing…' : 'Capture Opportunity'}
          </button>
        </div>
        {lastResult?.record && (
          <div className="mt-4 border border-neutral-200 bg-neutral-50 p-4 space-y-2">
            <p className="text-sm font-bold" style={{ color: NAVY }}>
              {lastResult.record.title}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-neutral-600">
              <span>EA Fit: {scoreLabel(lastResult.scores?.eaFitScore)}</span>
              <span>Opportunity: {scoreLabel(lastResult.scores?.opportunityScore)}</span>
              <span>Trust: {scoreLabel(lastResult.trust?.confidence)}</span>
              <span>Template: {lastResult.recommendations?.template.name ?? 'None'}</span>
            </div>
            {lastResult.magnifiUrl && (
              <a
                href={lastResult.magnifiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs font-bold underline mt-2"
                style={{ color: GOLD }}
              >
                Open Magnifi experience →
              </a>
            )}
          </div>
        )}
        {message && <p className="text-sm text-neutral-600 mt-3">{message}</p>}
      </div>

      <div className="ep-card overflow-x-auto">
        <p className="ep-card-title">Your Captures</p>
        {captures.length === 0 ? (
          <p className="ep-placeholder-text">No captures yet. Paste a URL above to get started.</p>
        ) : (
          <table className="w-full text-sm mt-4">
            <thead>
              <tr className="border-b border-neutral-200">
                {['Opportunity', 'Score', 'Status', 'Magnifi'].map((head) => (
                  <th
                    key={head}
                    className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-neutral-500"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {captures.map((capture) => (
                <tr key={capture.id} className="border-b border-neutral-100">
                  <td className="px-2 py-3">
                    <p className="font-semibold" style={{ color: NAVY }}>
                      {capture.title}
                    </p>
                    {capture.sourceUrl && (
                      <a
                        href={capture.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-neutral-400 underline"
                      >
                        Source
                      </a>
                    )}
                  </td>
                  <td className="px-2 py-3 font-semibold" style={{ color: GOLD }}>
                    {capture.opportunityScore ?? capture.eaFitScore ?? '—'}
                  </td>
                  <td className="px-2 py-3 text-neutral-600">{capture.status}</td>
                  <td className="px-2 py-3">
                    {capture.blueprintSummary || capture.analysisSummary ? (
                      <a
                        href={`/magnifi/${capture.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold underline"
                        style={{ color: GOLD }}
                      >
                        Open
                      </a>
                    ) : (
                      <span className="text-xs text-neutral-400">Preparing</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import type { CaptureRecord } from '@/lib/capture-records';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';

export default function ResourceRadarClient({
  initialCaptures,
}: {
  initialCaptures: CaptureRecord[];
}) {
  const [captures, setCaptures] = useState(initialCaptures);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const analyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/captures/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), source: 'Resource Radar' }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        record?: CaptureRecord;
        scores?: { eaFitScore: number; opportunityScore: number };
      };
      if (!res.ok || !data.ok || !data.record) {
        setMessage(data.error ?? 'Analysis failed.');
        return;
      }
      setCaptures((prev) => [data.record!, ...prev]);
      setUrl('');
      setMessage(
        `Captured · EA Fit ${data.scores?.eaFitScore ?? data.record.eaFitScore}/100 · Opportunity ${data.scores?.opportunityScore ?? data.record.opportunityScore}/100`
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
          Paste any URL — Firecrawl extracts the page, Resource Radar classifies it, and the
          Opportunity Engine scores EA fit. Install the browser extension for one-click capture.
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
      </div>
      {message && <p className="text-sm text-neutral-600">{message}</p>}

      <div className="bg-white border border-neutral-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                EA Fit
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                Opportunity
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                Alignment
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
                <tr key={c.id} className="border-b border-neutral-100">
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
                      >
                        {c.sourceUrl}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{c.category ?? c.captureType}</td>
                  <td className="px-4 py-3 font-semibold" style={{ color: GOLD }}>
                    {c.eaFitScore ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-semibold" style={{ color: NAVY }}>
                    {c.opportunityScore ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500 max-w-[200px]">
                    {c.productAlignment?.join(', ') ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{c.source}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

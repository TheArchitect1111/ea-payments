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
    firstStep: { action: string; cta: string; href?: string };
    priorities: { rank: number; title: string; eaProduct: string }[];
  };
}

function scoreLabel(value?: number) {
  return value == null ? 'Not scored' : `${value}/100`;
}

export default function SimplifiWorkspaceClient({
  initialCaptures,
}: {
  initialCaptures: CaptureRecord[];
}) {
  const [captures, setCaptures] = useState(initialCaptures);
  const [url, setUrl] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteUrl, setNoteUrl] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [lastResult, setLastResult] = useState<AnalyzeResponse | null>(null);

  const analyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setMessage('');
    setLastResult(null);
    try {
      const res = await fetch('/api/admin/captures/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), source: 'Simplifi' }),
      });
      const data = (await res.json()) as AnalyzeResponse;
      if (!res.ok || !data.ok || !data.record) {
        setMessage(data.error ?? 'Simplifi could not process this opportunity.');
        return;
      }
      setCaptures((prev) => [data.record!, ...prev]);
      setLastResult(data);
      setUrl('');
      setMessage('Opportunity captured, analyzed, routed to Magnifi, and visible in Mission Control.');
    } catch {
      setMessage('Simplifi could not process this opportunity.');
    } finally {
      setLoading(false);
    }
  };

  const quickSave = async () => {
    if (!noteTitle.trim()) return;
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/captures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: noteTitle.trim(),
          sourceUrl: noteUrl.trim() || undefined,
          description: note.trim() || undefined,
          source: 'Simplifi Manual Entry',
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; record?: CaptureRecord };
      if (!res.ok || !data.ok || !data.record) {
        setMessage(data.error ?? 'Manual capture was not saved.');
        return;
      }
      setCaptures((prev) => [data.record!, ...prev]);
      setNoteTitle('');
      setNoteUrl('');
      setNote('');
      setMessage('Manual opportunity saved to Simplifi.');
    } catch {
      setMessage('Manual capture was not saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <section className="bg-white border border-neutral-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: GOLD }}>
          Simplifi&trade; Opportunity Intelligence
        </p>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold" style={{ color: NAVY }}>
              Capture once. Turn it into action.
            </h2>
            <p className="text-sm text-neutral-500 mt-2 max-w-3xl">
              Save a website, social profile, article, video, person, company, or opportunity.
              Simplifi analyzes it, Clarifi scores it, Magnifi drafts the opportunity experience,
              and Mission Control tracks the record.
            </p>
          </div>
          <a
            href="/admin/master"
            className="text-xs font-bold px-4 py-2 rounded text-white"
            style={{ backgroundColor: NAVY }}
          >
            View in Mission Control
          </a>
        </div>
      </section>

      <section className="grid lg:grid-cols-[1.2fr_0.8fr] gap-5">
        <div className="bg-white border border-neutral-200 p-6 space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
              Save To Simplifi
            </p>
            <h3 className="text-xl font-extrabold" style={{ color: NAVY }}>
              Analyze a URL
            </h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste any URL"
              className="flex-1 border border-neutral-200 rounded px-4 py-3 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && analyze()}
            />
            <button
              type="button"
              disabled={loading || !url.trim()}
              onClick={analyze}
              className="px-5 py-3 text-sm font-bold text-white rounded disabled:opacity-50"
              style={{ backgroundColor: GOLD, color: NAVY }}
            >
              {loading ? 'Processing...' : 'Capture Opportunity'}
            </button>
          </div>
          {lastResult?.record && (
            <div className="border border-neutral-200 bg-neutral-50 p-4 space-y-2">
              <p className="text-sm font-bold" style={{ color: NAVY }}>
                {lastResult.record.title}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <span>EA Fit: {scoreLabel(lastResult.scores?.eaFitScore)}</span>
                <span>Opportunity: {scoreLabel(lastResult.scores?.opportunityScore)}</span>
                <span>Trust: {scoreLabel(lastResult.trust?.confidence)}</span>
                <span>Template: {lastResult.recommendations?.template.name ?? 'None'}</span>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href={`/magnifi/${lastResult.record.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold underline"
                  style={{ color: GOLD }}
                >
                  Open Magnifi page
                </a>
                <a href="/admin/blueprints" className="text-xs font-bold underline" style={{ color: GOLD }}>
                  View Blueprint Library
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-neutral-200 p-6 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
            Manual Entry
          </p>
          <input
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="Opportunity title"
            className="w-full border border-neutral-200 rounded px-4 py-3 text-sm"
          />
          <input
            value={noteUrl}
            onChange={(e) => setNoteUrl(e.target.value)}
            placeholder="Optional link"
            className="w-full border border-neutral-200 rounded px-4 py-3 text-sm"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional notes"
            className="w-full border border-neutral-200 rounded px-4 py-3 text-sm min-h-28"
          />
          <button
            type="button"
            disabled={saving || !noteTitle.trim()}
            onClick={quickSave}
            className="w-full px-5 py-3 text-sm font-bold rounded disabled:opacity-50"
            style={{ backgroundColor: NAVY, color: 'white' }}
          >
            {saving ? 'Saving...' : 'Save Manual Opportunity'}
          </button>
        </div>
      </section>

      {message && <p className="text-sm text-neutral-600">{message}</p>}

      <section className="bg-white border border-neutral-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              {['Opportunity', 'Type', 'Score', 'Status', 'Magnifi'].map((head) => (
                <th
                  key={head}
                  className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500"
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {captures.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-400">
                  No Simplifi captures yet.
                </td>
              </tr>
            ) : (
              captures.map((capture) => (
                <tr key={capture.id} className="border-b border-neutral-100">
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3 text-neutral-600">{capture.captureType}</td>
                  <td className="px-4 py-3 font-semibold" style={{ color: GOLD }}>
                    {capture.opportunityScore ?? capture.eaFitScore ?? 'Not scored'}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{capture.status}</td>
                  <td className="px-4 py-3">
                    {capture.blueprintSummary ? (
                      <a
                        href={`/magnifi/${capture.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold underline"
                        style={{ color: GOLD }}
                      >
                        Open page
                      </a>
                    ) : (
                      <span className="text-xs text-neutral-400">Not generated</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}

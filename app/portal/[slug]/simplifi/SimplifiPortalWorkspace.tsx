'use client';

import { useRef, useState } from 'react';
import type { CaptureRecord } from '@/lib/capture-records';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';

interface AnalyzeResponse {
  ok?: boolean;
  error?: string;
  record?: CaptureRecord;
  scores?: { eaFitScore: number; opportunityScore: number };
  businessScores?: {
    visibility: number;
    exposure: number;
    conversion: number;
    differentiation: number;
    modernity: number;
    trust: number;
  };
  trust?: { confidence: number; confidenceLabel: string };
  recommendations?: {
    template: { name: string };
    firstStep: { action: string };
  };
  magnifiUrl?: string;
  guidanceUrl?: string;
  considerUrl?: string;
  considerSlug?: string;
  clientMessage?: string;
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [captures, setCaptures] = useState(initialCaptures);
  const [url, setUrl] = useState('');
  const [prospectName, setProspectName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [lastResult, setLastResult] = useState<AnalyzeResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const analyzeJson = async (body: Record<string, string>) => {
    const res = await fetch('/api/portal/captures/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return (await res.json()) as AnalyzeResponse & { error?: string };
  };

  const analyzeForm = async (form: FormData) => {
    const res = await fetch('/api/portal/captures/analyze', {
      method: 'POST',
      body: form,
    });
    return (await res.json()) as AnalyzeResponse & { error?: string };
  };

  const handleSuccess = (data: AnalyzeResponse) => {
    if (!data.ok || !data.record) {
      setMessage(data.error ?? 'Simplifi could not process this opportunity.');
      return;
    }
    setCaptures((prev) => [data.record!, ...prev]);
    setLastResult(data);
    setUrl('');
    setNotes('');
    setMessage('Opportunity captured. Share the Consider link with your prospect.');
  };

  const analyzeUrl = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setMessage('');
    setLastResult(null);
    try {
      const data = await analyzeJson({
        url: url.trim(),
        notes,
        prospectName,
      });
      if (!data.ok) {
        setMessage(data.error ?? 'Simplifi could not process this opportunity.');
        return;
      }
      handleSuccess(data);
    } catch {
      setMessage('Simplifi could not process this opportunity.');
    } finally {
      setLoading(false);
    }
  };

  const analyzeFile = async (file: File) => {
    setLoading(true);
    setMessage('');
    setLastResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      if (notes) form.append('notes', notes);
      if (prospectName) form.append('prospectName', prospectName);
      const data = await analyzeForm(form);
      if (!data.ok) {
        setMessage(data.error ?? 'Simplifi could not process this asset.');
        return;
      }
      handleSuccess(data);
    } catch {
      setMessage('Simplifi could not process this asset.');
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const copyMessage = async () => {
    if (!lastResult?.clientMessage) return;
    await navigator.clipboard.writeText(lastResult.clientMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="ep-card">
        <p className="ep-card-title">Capture an Opportunity</p>
        <p className="ep-placeholder-text mb-4">
          Upload an image, screenshot, flyer, PDF, or paste a website URL. Simplifi™ analyzes
          business opportunity — not design critique — and Magnifi™ builds a shareable experience
          stored in Pulse™.
        </p>

        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: NAVY }}>
          Prospect name (optional — used for /consider/slug)
        </label>
        <input
          value={prospectName}
          onChange={(e) => setProspectName(e.target.value)}
          placeholder="e.g. Selena"
          className="w-full border border-neutral-200 rounded px-4 py-3 text-sm ep-input mb-4"
        />

        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: NAVY }}>
          Notes (optional)
        </label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Event name, context, or follow-up notes"
          className="w-full border border-neutral-200 rounded px-4 py-3 text-sm ep-input mb-4"
        />

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com or social profile"
            className="flex-1 border border-neutral-200 rounded px-4 py-3 text-sm ep-input"
            onKeyDown={(e) => e.key === 'Enter' && analyzeUrl()}
          />
          <button
            type="button"
            disabled={loading || !url.trim()}
            onClick={analyzeUrl}
            className="ep-pulse-cta disabled:opacity-50"
          >
            {loading ? 'Processing…' : 'Capture URL'}
          </button>
        </div>

        <div className="border border-dashed border-neutral-300 rounded-lg p-6 text-center">
          <p className="text-sm text-neutral-600 mb-3">
            Or upload image, screenshot, flyer, ad, brochure, or PDF
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) analyzeFile(file);
            }}
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => fileRef.current?.click()}
            className="ep-pulse-cta disabled:opacity-50"
            style={{ backgroundColor: NAVY, color: GOLD }}
          >
            Upload asset
          </button>
        </div>

        {lastResult?.record && (
          <div className="mt-4 border border-neutral-200 bg-neutral-50 p-4 space-y-3">
            <p className="text-sm font-bold" style={{ color: NAVY }}>
              {lastResult.record.title}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-neutral-600">
              <span>Visibility: {scoreLabel(lastResult.businessScores?.visibility)}</span>
              <span>Conversion: {scoreLabel(lastResult.businessScores?.conversion)}</span>
              <span>Trust: {scoreLabel(lastResult.businessScores?.trust)}</span>
              <span>EA Fit: {scoreLabel(lastResult.scores?.eaFitScore)}</span>
              <span>Opportunity: {scoreLabel(lastResult.scores?.opportunityScore)}</span>
              <span>Template: {lastResult.recommendations?.template.name ?? 'None'}</span>
            </div>
            <div className="flex flex-wrap gap-4">
              {lastResult.considerUrl && (
                <a
                  href={lastResult.considerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold underline"
                  style={{ color: GOLD }}
                >
                  Consider share link →
                </a>
              )}
              {lastResult.magnifiUrl && (
                <a
                  href={lastResult.magnifiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold underline"
                  style={{ color: GOLD }}
                >
                  Magnifi cinematic →
                </a>
              )}
              {lastResult.guidanceUrl && (
                <a
                  href={lastResult.guidanceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold underline"
                  style={{ color: GOLD }}
                >
                  Simplifi guidance →
                </a>
              )}
            </div>
            {lastResult.clientMessage && (
              <div>
                <pre className="text-xs bg-white border border-neutral-200 p-3 whitespace-pre-wrap">
                  {lastResult.clientMessage}
                </pre>
                <button
                  type="button"
                  onClick={copyMessage}
                  className="mt-2 text-xs font-bold underline"
                  style={{ color: GOLD }}
                >
                  {copied ? 'Copied!' : 'Copy client message'}
                </button>
              </div>
            )}
          </div>
        )}
        {message && <p className="text-sm text-neutral-600 mt-3">{message}</p>}
      </div>

      <div className="ep-card overflow-x-auto">
        <p className="ep-card-title">Your Opportunities (Pulse™)</p>
        {captures.length === 0 ? (
          <p className="ep-placeholder-text">No captures yet. Upload or paste above to get started.</p>
        ) : (
          <table className="w-full text-sm mt-4">
            <thead>
              <tr className="border-b border-neutral-200">
                {['Opportunity', 'Scores', 'Status', 'Share'].map((head) => (
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
                      {capture.businessName || capture.title}
                    </p>
                    {capture.prospectStatus && (
                      <span className="text-xs text-neutral-400">{capture.prospectStatus}</span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-xs text-neutral-600">
                    V {capture.visibilityScore ?? '—'} · C {capture.conversionScore ?? '—'}
                  </td>
                  <td className="px-2 py-3 text-neutral-600">{capture.status}</td>
                  <td className="px-2 py-3">
                    <div className="flex flex-col gap-1">
                      {(capture.shareUrl || capture.considerSlug) && (
                        <a
                          href={capture.shareUrl ?? `/consider/${capture.considerSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold underline"
                          style={{ color: GOLD }}
                        >
                          Consider
                        </a>
                      )}
                      <a
                        href={`/magnifi/${capture.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold underline"
                        style={{ color: GOLD }}
                      >
                        Magnifi
                      </a>
                    </div>
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

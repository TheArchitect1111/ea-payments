'use client';

import { useRef, useState, useEffect } from 'react';
import type { CaptureRecord } from '@/lib/capture-records';
import CaptureSuccessPanel from '@/app/components/CaptureSuccessPanel';
import ActiveSavePanel from '@/app/components/ActiveSavePanel';
import CaptureProcessingPanel from '@/app/components/CaptureProcessingPanel';
import EmptyStateGuide from '@/app/components/guided-first-success/EmptyStateGuide';
import type { AmplifiSocialDraft } from '@/lib/amplifi-draft';
import { prepareCaptureUpload } from '@/lib/client-image-upload';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';

interface AnalyzeResponse {
  ok?: boolean;
  error?: string;
  processing?: boolean;
  captureId?: string;
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
  workspaceUrl?: string;
  amplifiDraft?: AmplifiSocialDraft;
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
  const [uploadLabel, setUploadLabel] = useState('');
  const [message, setMessage] = useState('');
  const [lastResult, setLastResult] = useState<AnalyzeResponse | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const manageCapture = async (body: { action: string; recordId?: string; slug?: string }) => {
    setActionMessage('');
    const res = await fetch('/api/portal/opportunities/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string; newSlug?: string };
    if (!data.ok) {
      setActionMessage(data.error ?? 'Action failed.');
      return;
    }
    if (body.action === 'archive' && body.recordId) {
      setCaptures((prev) =>
        prev.map((c) =>
          c.id === body.recordId ? { ...c, status: 'Archived', prospectStatus: 'Archived' } : c,
        ),
      );
      setActionMessage('Archived.');
    }
    if (body.action === 'duplicate' && data.newSlug) {
      setActionMessage(`Duplicate created: /consider/${data.newSlug}`);
    }
  };

  const parseAnalyzeResponse = async (res: Response): Promise<AnalyzeResponse & { error?: string }> => {
    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      if (res.status === 413) {
        return { ok: false, error: 'File is too large. Try a smaller photo or screenshot.' };
      }
      return { ok: false, error: `Upload failed (${res.status}). Try again.` };
    }
    const data = (await res.json()) as AnalyzeResponse & { error?: string };
    if (!res.ok && !data.error) {
      return { ok: false, error: 'Could not capture. Try again.' };
    }
    return data;
  };

  const analyzeJson = async (body: Record<string, string>) => {
    const res = await fetch('/api/portal/captures/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return parseAnalyzeResponse(res);
  };

  const analyzeForm = async (form: FormData) => {
    const res = await fetch('/api/portal/captures/analyze', {
      method: 'POST',
      body: form,
    });
    return parseAnalyzeResponse(res);
  };

  const handleSuccess = (data: AnalyzeResponse) => {
    if (!data.ok) {
      setMessage(data.error ?? 'Simplifi could not process this opportunity.');
      return;
    }
    if (data.processing && data.captureId) {
      if (data.record) {
        setCaptures((prev) => [data.record!, ...prev]);
      }
      setProcessingId(data.captureId);
      setLastResult(data);
      setUploadLabel('');
      setMessage('Upload received — Simplifi is analyzing your asset…');
      return;
    }
    if (!data.record) {
      setMessage(data.error ?? 'Simplifi could not process this opportunity.');
      return;
    }
    setProcessingId(null);
    setCaptures((prev) => [data.record!, ...prev]);
    setLastResult(data);
    setUrl('');
    setNotes('');
    setUploadLabel('');
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
    setProcessingId(null);
    setUploadLabel(file.name);
    try {
      const prepared = await prepareCaptureUpload(file);
      const form = new FormData();
      form.append('file', prepared);
      if (notes) form.append('notes', notes);
      if (prospectName) form.append('prospectName', prospectName);
      const data = await analyzeForm(form);
      handleSuccess(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Simplifi could not process this asset.';
      setMessage(msg);
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
          Upload a screenshot, flyer, PDF, or paste a link. Simplifi saves it, creates a summary, and helps you
          decide what to do next.
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
          {loading && uploadLabel ? (
            <p className="text-sm font-semibold mb-3" style={{ color: NAVY }}>
              Uploading {uploadLabel}…
            </p>
          ) : null}
          <label
            className={`ep-pulse-cta inline-block cursor-pointer relative${loading ? ' opacity-50 pointer-events-none' : ''}`}
            style={{ backgroundColor: NAVY, color: GOLD }}
          >
            {loading && uploadLabel ? 'Uploading…' : 'Upload asset'}
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf,application/pdf"
              className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
              style={{ clip: 'rect(0,0,0,0)' }}
              disabled={loading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void analyzeFile(file);
              }}
            />
          </label>
        </div>

        {processingId && (
          <div className="mt-4 border border-neutral-200 bg-neutral-50 p-4">
            <CaptureProcessingPanel
              captureId={processingId}
              title={lastResult?.record?.title}
              showActiveSave
              onComplete={(response) => {
                setProcessingId(null);
                setLastResult(response);
                if (response.record) {
                  setCaptures((prev) =>
                    prev.map((c) => (c.id === response.record!.id ? response.record! : c)),
                  );
                }
                setMessage('Opportunity captured. Share the Consider link with your prospect.');
              }}
              onError={(msg) => setMessage(msg)}
            />
          </div>
        )}

        {lastResult?.record && !processingId && (
          <div className="mt-4 border border-neutral-200 bg-neutral-50 p-4">
            <ActiveSavePanel
              recordId={lastResult.record.id}
              title={lastResult.record.title}
            />
            <CaptureSuccessPanel
              title={lastResult.record.title}
              links={{
                magnifiUrl: lastResult.magnifiUrl,
                considerUrl: lastResult.considerUrl,
                guidanceUrl: lastResult.guidanceUrl,
                workspaceUrl: `/portal/${slug}/simplifi`,
                clientMessage: lastResult.clientMessage,
              }}
              amplifiDraft={lastResult.amplifiDraft}
              autoOpenMagnifi={false}
            />
          </div>
        )}
        {message && (
          <p className={`text-sm mt-3${message.includes('could not') || message.includes('failed') || message.includes('too large') ? ' text-red-600 font-semibold' : ' text-neutral-600'}`}>
            {message}
          </p>
        )}
      </div>

      <div className="ep-card overflow-x-auto">
        <p className="ep-card-title">Your saved opportunities</p>
        {captures.length === 0 ? (
          <EmptyStateGuide
            title="No opportunities saved yet"
            explanation="Capture something worth remembering — Simplifi will summarize it and help you follow up."
            actionLabel="Capture now"
            actionHref="/simplifi/capture"
          />
        ) : (
          <table className="w-full text-sm mt-4">
            <thead>
              <tr className="border-b border-neutral-200">
                {['Opportunity', 'Scores', 'Status', 'Share', 'Actions'].map((head) => (
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
                  <td className="px-2 py-3">
                    <div className="flex flex-col gap-1">
                      {capture.considerSlug && capture.status !== 'Archived' && (
                        <button
                          type="button"
                          className="text-xs font-bold underline text-left"
                          style={{ color: NAVY }}
                          onClick={() =>
                            manageCapture({ action: 'duplicate', slug: capture.considerSlug! })
                          }
                        >
                          Duplicate
                        </button>
                      )}
                      {capture.status !== 'Archived' && (
                        <button
                          type="button"
                          className="text-xs font-bold underline text-left text-neutral-500"
                          onClick={() => manageCapture({ action: 'archive', recordId: capture.id })}
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {actionMessage && <p className="text-sm text-neutral-600 mt-3">{actionMessage}</p>}
      </div>
    </div>
  );
}

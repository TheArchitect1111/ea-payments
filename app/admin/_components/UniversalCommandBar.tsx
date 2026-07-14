'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { NAVY, GOLD } from '@/lib/design-system';
import { startGuidedTour } from './GuidedTour';

type ExecutiveCommandAction =
  | 'open'
  | 'review'
  | 'create'
  | 'capture'
  | 'analyze'
  | 'navigator'
  | 'voice'
  | 'tour'
  | 'disabled';

type ExecutiveCommandResult = {
  id: string;
  name: string;
  type: string;
  summary: string;
  owner: string;
  status: string;
  source: string;
  confidence: 'High' | 'Medium' | 'Low';
  destination?: string;
  action: ExecutiveCommandAction;
  keywords: string[];
};

type ExecutiveCommandIndex = {
  generatedAt: string;
  results: ExecutiveCommandResult[];
  recentContext: {
    available: boolean;
    message: string;
  };
  sources: string[];
};

type Props = {
  onOpenNavigator: () => void;
};

const FALLBACK_ACTIONS: ExecutiveCommandResult[] = [
  {
    id: 'fallback-executive-briefing',
    name: 'Open Executive Home',
    type: 'Action',
    summary: 'Return to today’s signals and next move.',
    owner: 'Executive Operating System',
    status: 'Available',
    source: 'Mission Control navigation',
    confidence: 'High',
    destination: '/admin/master',
    action: 'open',
    keywords: ['executive', 'briefing', 'mission', 'home'],
  },
  {
    id: 'fallback-decisions',
    name: 'Review Decisions',
    type: 'Action',
    summary: 'Open the Decision Intelligence queue.',
    owner: 'Executive Operating System',
    status: 'Available',
    source: 'Decision Intelligence',
    confidence: 'High',
    destination: '/admin/decisions',
    action: 'review',
    keywords: ['decisions', 'approve', 'review'],
  },
  {
    id: 'fallback-operations',
    name: 'Open Operations',
    type: 'Action',
    summary: 'Review platform health and launch readiness.',
    owner: 'Executive Operating System',
    status: 'Available',
    source: 'Operations Center',
    confidence: 'High',
    destination: '/admin/operations',
    action: 'open',
    keywords: ['operations', 'health', 'launch'],
  },
  {
    id: 'fallback-capture',
    name: 'Quick Capture',
    type: 'Action',
    summary: 'Capture an opportunity or operating signal.',
    owner: 'Executive Operating System',
    status: 'Available',
    source: 'Mission Control',
    confidence: 'High',
    action: 'capture',
    keywords: ['capture', 'opportunity', 'signal'],
  },
];

function confidenceColor(confidence: ExecutiveCommandResult['confidence']): string {
  if (confidence === 'High') return '#047857';
  if (confidence === 'Medium') return '#775d12';
  return '#991b1b';
}

function scoreResult(item: ExecutiveCommandResult, q: string): number {
  if (!q) return 1;
  const query = q.toLowerCase();
  const name = item.name.toLowerCase();
  const type = item.type.toLowerCase();
  const summary = item.summary.toLowerCase();
  const source = item.source.toLowerCase();
  const status = item.status.toLowerCase();
  const keywords = item.keywords.join(' ').toLowerCase();

  let score = 0;
  if (name === query) score += 100;
  if (name.startsWith(query)) score += 60;
  if (name.includes(query)) score += 40;
  if (type.includes(query)) score += 24;
  if (source.includes(query)) score += 18;
  if (status.includes(query)) score += 12;
  if (keywords.includes(query)) score += 28;
  if (summary.includes(query)) score += 10;
  return score;
}

function resultMatches(item: ExecutiveCommandResult, query: string): boolean {
  if (!query) return true;
  return scoreResult(item, query) > 0;
}

export default function UniversalCommandBar({ onOpenNavigator }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [index, setIndex] = useState<ExecutiveCommandIndex | null>(null);
  const [loadingIndex, setLoadingIndex] = useState(false);
  const [indexError, setIndexError] = useState('');
  const [captureOpen, setCaptureOpen] = useState(false);
  const [analyzeOpen, setAnalyzeOpen] = useState(false);
  const [analyzeUrl, setAnalyzeUrl] = useState('');
  const [captureTitle, setCaptureTitle] = useState('');
  const [captureDesc, setCaptureDesc] = useState('');
  const [captureUrl, setCaptureUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadIndex = useCallback(async () => {
    if (index || loadingIndex) return;
    setLoadingIndex(true);
    setIndexError('');
    try {
      const res = await fetch('/api/admin/command-bar', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Command index unavailable.');
      const data = (await res.json()) as ExecutiveCommandIndex;
      setIndex(data);
    } catch {
      setIndexError('Command index unavailable. Core actions are still available.');
    } finally {
      setLoadingIndex(false);
    }
  }, [index, loadingIndex]);

  const openCommandBar = useCallback(() => {
    setOpen(true);
    setSelectedIndex(0);
    void loadIndex();
  }, [loadIndex]);

  const closeCommandBar = useCallback(() => {
    setOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const results = useMemo(() => {
    const source = index?.results.length ? index.results : FALLBACK_ACTIONS;
    const q = query.toLowerCase().trim();
    return source
      .filter((item) => resultMatches(item, q))
      .sort((a, b) => scoreResult(b, q) - scoreResult(a, q) || a.name.localeCompare(b.name))
      .slice(0, 42);
  }, [index, query]);

  const selected = results[Math.min(selectedIndex, Math.max(results.length - 1, 0))];

  const runCommand = useCallback(
    (cmd: ExecutiveCommandResult | undefined) => {
      if (!cmd || cmd.action === 'disabled') return;
      closeCommandBar();
      if (cmd.action === 'navigator') {
        onOpenNavigator();
        return;
      }
      if (cmd.action === 'capture') {
        setCaptureOpen(true);
        return;
      }
      if (cmd.action === 'analyze') {
        setAnalyzeOpen(true);
        return;
      }
      if (cmd.action === 'tour') {
        startGuidedTour();
        return;
      }
      if (cmd.action === 'voice') {
        window.dispatchEvent(new CustomEvent('ea:open-voice'));
        return;
      }
      if (cmd.destination) {
        router.push(cmd.destination);
      }
    },
    [closeCommandBar, onOpenNavigator, router],
  );

  const routeNaturalIntent = useCallback(
    (text: string) => {
      const q = text.trim();
      if (!q && selected) {
        runCommand(selected);
        return;
      }
      if (selected) {
        runCommand(selected);
      }
    },
    [runCommand, selected],
  );

  const handleButtonClick = () => {
    openCommandBar();
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openCommandBar();
      }
      if (e.key === 'Escape') {
        closeCommandBar();
        setCaptureOpen(false);
        setAnalyzeOpen(false);
      }
    };
    const onCapture = () => {
      setCaptureOpen(true);
      closeCommandBar();
    };
    const onAnalyze = () => {
      setAnalyzeOpen(true);
      closeCommandBar();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('ea:open-capture', onCapture);
    window.addEventListener('ea:open-analyze', onAnalyze);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('ea:open-capture', onCapture);
      window.removeEventListener('ea:open-analyze', onAnalyze);
    };
  }, [closeCommandBar, openCommandBar]);

  const submitCapture = async () => {
    if (!captureTitle.trim()) return;
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/captures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: captureTitle,
          description: captureDesc || undefined,
          sourceUrl: captureUrl || undefined,
          source: 'Command Bar',
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setMessage(data.error ?? 'Capture failed.');
        return;
      }
      setMessage('Capture saved to Mission Control.');
      setCaptureTitle('');
      setCaptureDesc('');
      setCaptureUrl('');
      setTimeout(() => {
        setCaptureOpen(false);
        setMessage('');
      }, 1200);
    } catch {
      setMessage('Capture failed.');
    } finally {
      setSaving(false);
    }
  };

  const submitAnalyze = async () => {
    if (!analyzeUrl.trim()) return;
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/captures/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: analyzeUrl.trim(), source: 'Command Bar' }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        scores?: { eaFitScore: number; opportunityScore: number };
      };
      if (!res.ok || !data.ok) {
        setMessage(data.error ?? 'Analysis failed.');
        return;
      }
      setMessage(
        `Analyzed - EA Fit ${data.scores?.eaFitScore}/100 - Opportunity ${data.scores?.opportunityScore}/100`,
      );
      setAnalyzeUrl('');
      setTimeout(() => {
        setAnalyzeOpen(false);
        setMessage('');
        router.push('/admin/resource-radar');
      }, 1200);
    } catch {
      setMessage('Analysis failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        id="ea-command-bar"
        onClick={handleButtonClick}
        className="text-xs font-semibold px-3 py-1.5 rounded border border-blue-300/40 text-blue-100 hover:bg-white/10 transition"
        title="Executive Command Bar (Ctrl+K)"
      >
        ⌘K Command
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center px-3 pt-[8vh] sm:px-4"
          style={{ backgroundColor: 'rgba(15,31,61,0.62)' }}
          onClick={closeCommandBar}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-neutral-200 px-4 py-3 sm:px-5">
              <p className="text-[11px] font-black uppercase tracking-[0.24em]" style={{ color: GOLD }}>
                Executive Command Bar
              </p>
              <input
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    routeNaturalIntent(query);
                  }
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex((value) => Math.min(value + 1, Math.max(results.length - 1, 0)));
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex((value) => Math.max(value - 1, 0));
                  }
                }}
                placeholder="Find or run anything... organization, capability, decision, Atlas object, blueprint"
                className="mt-2 w-full border-0 px-0 py-2 text-lg font-bold outline-none placeholder:text-neutral-300"
                style={{ color: NAVY }}
              />
              <div className="flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                <span>Open</span>
                <span>Create</span>
                <span>Review</span>
                <span>Navigate</span>
                <span>{index ? `${index.results.length} sourced results` : 'Loading sourced results'}</span>
              </div>
            </div>

            <div className="max-h-[58vh] overflow-y-auto py-2">
              {loadingIndex && (
                <p className="px-5 py-3 text-sm text-neutral-500">Loading authoritative command sources...</p>
              )}
              {indexError && (
                <p className="mx-4 mb-2 border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  {indexError}
                </p>
              )}
              {results.map((cmd, idx) => {
                const active = idx === Math.min(selectedIndex, Math.max(results.length - 1, 0));
                return (
                  <button
                    key={cmd.id}
                    type="button"
                    disabled={cmd.action === 'disabled'}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => runCommand(cmd)}
                    className="grid w-full gap-2 px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-70 sm:grid-cols-[1fr_auto]"
                    style={{ backgroundColor: active ? '#f7f4ea' : 'transparent' }}
                  >
                    <span>
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black" style={{ color: NAVY }}>
                          {cmd.name}
                        </span>
                        <span className="border border-neutral-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                          {cmd.type}
                        </span>
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-neutral-600">{cmd.summary}</span>
                      <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-neutral-500">
                        <span>Owner: {cmd.owner}</span>
                        <span>Status: {cmd.status}</span>
                        <span>Source: {cmd.source}</span>
                      </span>
                    </span>
                    <span className="flex items-start justify-between gap-3 sm:block sm:text-right">
                      <span
                        className="block text-[10px] font-black uppercase tracking-widest"
                        style={{ color: confidenceColor(cmd.confidence) }}
                      >
                        {cmd.confidence}
                      </span>
                      <span className="mt-1 block text-[10px] font-black uppercase tracking-widest text-neutral-400">
                        {cmd.action}
                      </span>
                    </span>
                  </button>
                );
              })}
              {results.length === 0 && (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm font-bold" style={{ color: NAVY }}>
                    No command matches that search.
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Try an organization, capability, operation, decision, product, Atlas object, or knowledge asset.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-neutral-200 px-4 py-3 text-[11px] leading-5 text-neutral-500 sm:px-5">
              {index?.recentContext.available
                ? 'Recent context is available.'
                : 'Recent history not currently tracked.'}
              {' '}Use arrow keys to move, Enter to open, Escape to close.
            </div>
          </div>
        </div>
      )}

      {captureOpen && (
        <div
          className="fixed inset-0 z-[101] flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(15,31,61,0.55)' }}
          onClick={() => setCaptureOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-1 text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
              Mission Control
            </p>
            <h3 className="mb-4 text-lg font-bold" style={{ color: NAVY }}>
              Quick Capture
            </h3>
            <label className="mb-1 block text-xs font-semibold text-neutral-500">Title</label>
            <input
              value={captureTitle}
              onChange={(e) => setCaptureTitle(e.target.value)}
              className="mb-3 w-full rounded border border-neutral-200 px-3 py-2 text-sm"
              placeholder="Organization, resource, or opportunity"
            />
            <label className="mb-1 block text-xs font-semibold text-neutral-500">URL (optional)</label>
            <input
              value={captureUrl}
              onChange={(e) => setCaptureUrl(e.target.value)}
              className="mb-3 w-full rounded border border-neutral-200 px-3 py-2 text-sm"
              placeholder="https://"
            />
            <label className="mb-1 block text-xs font-semibold text-neutral-500">Notes (optional)</label>
            <textarea
              value={captureDesc}
              onChange={(e) => setCaptureDesc(e.target.value)}
              rows={3}
              className="mb-4 w-full rounded border border-neutral-200 px-3 py-2 text-sm"
            />
            {message && <p className="mb-3 text-xs text-neutral-600">{message}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCaptureOpen(false)}
                className="px-4 py-2 text-sm text-neutral-600"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving || !captureTitle.trim()}
                onClick={submitCapture}
                className="rounded px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                style={{ backgroundColor: NAVY }}
              >
                {saving ? 'Saving...' : 'Save Capture'}
              </button>
            </div>
          </div>
        </div>
      )}

      {analyzeOpen && (
        <div
          className="fixed inset-0 z-[101] flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(15,31,61,0.55)' }}
          onClick={() => setAnalyzeOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-1 text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
              Resource Radar
            </p>
            <h3 className="mb-4 text-lg font-bold" style={{ color: NAVY }}>
              Analyze URL
            </h3>
            <input
              value={analyzeUrl}
              onChange={(e) => setAnalyzeUrl(e.target.value)}
              className="mb-4 w-full rounded border border-neutral-200 px-3 py-2 text-sm"
              placeholder="https://"
            />
            {message && <p className="mb-3 text-xs text-neutral-600">{message}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAnalyzeOpen(false)} className="px-4 py-2 text-sm text-neutral-600">
                Cancel
              </button>
              <button
                type="button"
                disabled={saving || !analyzeUrl.trim()}
                onClick={submitAnalyze}
                className="rounded px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                style={{ backgroundColor: NAVY }}
              >
                {saving ? 'Analyzing...' : 'Capture & Analyze'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

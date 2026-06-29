'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ADMIN_COMMANDS, type CommandItem } from '@/lib/admin-command-registry';
import { startGuidedTour } from './GuidedTour';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';

type Props = {
  onOpenNavigator: () => void;
};

export default function UniversalCommandBar({ onOpenNavigator }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [captureOpen, setCaptureOpen] = useState(false);
  const [analyzeOpen, setAnalyzeOpen] = useState(false);
  const [analyzeUrl, setAnalyzeUrl] = useState('');
  const [captureTitle, setCaptureTitle] = useState('');
  const [captureDesc, setCaptureDesc] = useState('');
  const [captureUrl, setCaptureUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const filtered = ADMIN_COMMANDS.filter((cmd) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      cmd.label.toLowerCase().includes(q) ||
      cmd.group.toLowerCase().includes(q) ||
      cmd.keywords?.some((k) => k.includes(q))
    );
  });

  const runCommand = useCallback(
    (cmd: CommandItem) => {
      setOpen(false);
      setQuery('');
      if (cmd.action === 'navigator:open') {
        onOpenNavigator();
        return;
      }
      if (cmd.action === 'capture:quick') {
        setCaptureOpen(true);
        return;
      }
      if (cmd.action === 'capture:analyze') {
        setAnalyzeOpen(true);
        return;
      }
      if (cmd.action === 'tour:start') {
        startGuidedTour();
        return;
      }
      if (cmd.action === 'voice:open') {
        window.dispatchEvent(new CustomEvent('ea:open-voice'));
        return;
      }
      if (cmd.href) {
        router.push(cmd.href);
      }
    },
    [onOpenNavigator, router]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        setCaptureOpen(false);
        setAnalyzeOpen(false);
      }
    };
    const onCapture = () => {
      setCaptureOpen(true);
      setOpen(false);
    };
    const onAnalyze = () => {
      setAnalyzeOpen(true);
      setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('ea:open-capture', onCapture);
    window.addEventListener('ea:open-analyze', onAnalyze);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('ea:open-capture', onCapture);
      window.removeEventListener('ea:open-analyze', onAnalyze);
    };
  }, []);

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
        `Analyzed · EA Fit ${data.scores?.eaFitScore}/100 · Opportunity ${data.scores?.opportunityScore}/100`
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
        onClick={() => setOpen(true)}
        className="text-xs font-semibold px-3 py-1.5 rounded border border-blue-300/40 text-blue-100 hover:bg-white/10 transition"
        title="Command bar (Ctrl+K)"
      >
        ⌘K Command
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
          style={{ backgroundColor: 'rgba(15,31,61,0.55)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-lg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search commands… (Master Control, captures, navigate)"
              className="w-full px-4 py-3 text-sm border-b border-neutral-200 outline-none"
            />
            <ul className="max-h-72 overflow-y-auto py-2">
              {filtered.map((cmd) => (
                <li key={cmd.id}>
                  <button
                    type="button"
                    onClick={() => runCommand(cmd)}
                    className="w-full text-left px-4 py-2.5 hover:bg-neutral-50 flex justify-between items-center"
                  >
                    <span className="text-sm font-medium text-neutral-800">{cmd.label}</span>
                    <span className="text-[10px] uppercase tracking-wider text-neutral-400">{cmd.group}</span>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-4 py-6 text-sm text-neutral-400 text-center">No commands match.</li>
              )}
            </ul>
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
            className="w-full max-w-md bg-white rounded-lg shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: GOLD }}>
              EA Capture Engine
            </p>
            <h3 className="text-lg font-bold mb-4" style={{ color: NAVY }}>
              Quick Capture
            </h3>
            <label className="block text-xs font-semibold text-neutral-500 mb-1">Title</label>
            <input
              value={captureTitle}
              onChange={(e) => setCaptureTitle(e.target.value)}
              className="w-full border border-neutral-200 rounded px-3 py-2 text-sm mb-3"
              placeholder="Organization, resource, or opportunity"
            />
            <label className="block text-xs font-semibold text-neutral-500 mb-1">URL (optional)</label>
            <input
              value={captureUrl}
              onChange={(e) => setCaptureUrl(e.target.value)}
              className="w-full border border-neutral-200 rounded px-3 py-2 text-sm mb-3"
              placeholder="https://"
            />
            <label className="block text-xs font-semibold text-neutral-500 mb-1">Notes (optional)</label>
            <textarea
              value={captureDesc}
              onChange={(e) => setCaptureDesc(e.target.value)}
              rows={3}
              className="w-full border border-neutral-200 rounded px-3 py-2 text-sm mb-4"
            />
            {message && <p className="text-xs mb-3 text-neutral-600">{message}</p>}
            <div className="flex gap-2 justify-end">
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
                className="px-4 py-2 text-sm font-bold text-white rounded disabled:opacity-50"
                style={{ backgroundColor: NAVY }}
              >
                {saving ? 'Saving…' : 'Save Capture'}
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
            className="w-full max-w-md bg-white rounded-lg shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: GOLD }}>
              Resource Radar + Firecrawl
            </p>
            <h3 className="text-lg font-bold mb-4" style={{ color: NAVY }}>
              Analyze URL
            </h3>
            <input
              value={analyzeUrl}
              onChange={(e) => setAnalyzeUrl(e.target.value)}
              className="w-full border border-neutral-200 rounded px-3 py-2 text-sm mb-4"
              placeholder="https://"
            />
            {message && <p className="text-xs mb-3 text-neutral-600">{message}</p>}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setAnalyzeOpen(false)} className="px-4 py-2 text-sm text-neutral-600">
                Cancel
              </button>
              <button
                type="button"
                disabled={saving || !analyzeUrl.trim()}
                onClick={submitAnalyze}
                className="px-4 py-2 text-sm font-bold text-white rounded disabled:opacity-50"
                style={{ backgroundColor: NAVY }}
              >
                {saving ? 'Analyzing…' : 'Capture & Analyze'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

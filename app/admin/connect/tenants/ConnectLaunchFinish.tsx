'use client';

import { NAVY, GOLD } from '@/lib/design-system';
import { useState } from 'react';

type ChecklistItem = {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
  action?: string;
  priority: 'critical' | 'high' | 'medium';
};

export default function ConnectLaunchFinish() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [ready, setReady] = useState<boolean | null>(null);

  async function loadChecklist() {
    setBusy(true);
    setResult('');
    try {
      const response = await fetch('/api/admin/connect/launch?org=demo-client');
      const data = (await response.json()) as {
        summary?: string;
        launchScore?: number;
        ready?: boolean;
        checklist?: ChecklistItem[];
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? 'Could not load launch checklist.');
      setScore(data.launchScore ?? null);
      setReady(Boolean(data.ready));
      setResult(
        JSON.stringify(
          {
            summary: data.summary,
            launchScore: data.launchScore,
            ready: data.ready,
            checklist: data.checklist,
            actions: (data as { actions?: string[] }).actions,
          },
          null,
          2,
        ),
      );
    } catch (error) {
      setResult(error instanceof Error ? error.message : 'Could not load launch checklist.');
    } finally {
      setBusy(false);
    }
  }

  async function runFinishLine() {
    setBusy(true);
    setResult('');
    try {
      const response = await fetch('/api/admin/connect/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgSlug: 'demo-client', count: 20 }),
      });
      const data = (await response.json()) as {
        summary?: string;
        launchScore?: number;
        ready?: boolean;
        checklist?: ChecklistItem[];
        matrixRun?: { report?: { failures?: unknown[] } };
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? 'Finish line run failed.');
      setScore(data.launchScore ?? null);
      setReady(Boolean(data.ready));
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(error instanceof Error ? error.message : 'Finish line run failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-2 bg-white p-5" style={{ borderColor: GOLD }}>
      <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: GOLD }}>Finish line</p>
      <h2 className="mt-2 text-2xl font-black">Connect launch readiness</h2>
      <p className="mt-2 text-sm text-neutral-600">
        Phases 1–12 are shipped. This runs nurture + full matrix + returns what is still blocking launch.
      </p>

      {score !== null ? (
        <p className="mt-3 text-sm font-bold" style={{ color: ready ? '#15803d' : '#b45309' }}>
          Launch score {score}/100 {ready ? '— ready' : '— not ready yet'}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void runFinishLine()}
          className="min-h-11 bg-neutral-950 px-5 text-xs font-black uppercase tracking-[0.14em] text-white disabled:opacity-60"
        >
          {busy ? 'Running finish line…' : 'Run finish line'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void loadChecklist()}
          className="min-h-11 border border-neutral-300 px-5 text-xs font-black uppercase tracking-[0.14em] disabled:opacity-60"
        >
          Checklist only
        </button>
      </div>

      {result ? (
        <pre className="mt-4 max-h-80 overflow-auto rounded border border-neutral-200 bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-800">
          {result}
        </pre>
      ) : null}
    </div>
  );
}

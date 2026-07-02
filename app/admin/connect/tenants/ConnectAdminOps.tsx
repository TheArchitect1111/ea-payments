'use client';

import { useState } from 'react';

const GOLD = '#c9a844';

export default function ConnectAdminOps() {
  const [busy, setBusy] = useState('');
  const [result, setResult] = useState('');

  async function run(path: string, method: 'GET' | 'POST' = 'POST', body?: unknown) {
    setBusy(path);
    setResult('');
    try {
      const response = await fetch(path, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(error instanceof Error ? error.message : 'Request failed.');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="border border-neutral-200 bg-white p-5">
      <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: GOLD }}>Ops</p>
      <h2 className="mt-2 text-2xl font-black">Production actions</h2>
      <p className="mt-2 text-sm text-neutral-500">Run nurture, seed matrix data, verify deliveries, and inspect health without leaving admin.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void run('/api/admin/connect/run-nurture')}
          className="min-h-10 border border-neutral-300 px-4 text-xs font-black uppercase tracking-[0.12em] disabled:opacity-60"
        >
          {busy === '/api/admin/connect/run-nurture' ? 'Running…' : 'Run due nurture'}
        </button>
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void run('/api/admin/connect/nurture-verify', 'POST', { orgSlug: 'demo-client' })}
          className="min-h-10 border border-neutral-300 px-4 text-xs font-black uppercase tracking-[0.12em] disabled:opacity-60"
        >
          Verify nurture (demo)
        </button>
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void run('/api/admin/connect/refresh-memory', 'POST', { orgSlug: 'demo-client', limit: 20 })}
          className="min-h-10 border border-neutral-300 px-4 text-xs font-black uppercase tracking-[0.12em] disabled:opacity-60"
        >
          {busy === '/api/admin/connect/refresh-memory' ? 'Refreshing…' : 'Refresh AI memory'}
        </button>
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void run('/api/admin/connect/test-matrix', 'POST', { orgSlug: 'demo-client', count: 20 })}
          className="min-h-10 border border-neutral-300 px-4 text-xs font-black uppercase tracking-[0.12em] disabled:opacity-60"
        >
          {busy === '/api/admin/connect/test-matrix' ? 'Seeding…' : 'Seed test matrix'}
        </button>
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void run('/api/admin/connect/delivery-log?org=demo-client', 'GET')}
          className="min-h-10 border border-neutral-300 px-4 text-xs font-black uppercase tracking-[0.12em] disabled:opacity-60"
        >
          {busy === '/api/admin/connect/delivery-log?org=demo-client' ? 'Loading…' : 'Delivery log'}
        </button>
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void run('/api/health/connect-nurture', 'GET')}
          className="min-h-10 border border-neutral-300 px-4 text-xs font-black uppercase tracking-[0.12em] disabled:opacity-60"
        >
          Check health
        </button>
      </div>

      {result ? (
        <pre className="mt-4 max-h-64 overflow-auto rounded border border-neutral-200 bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-800">
          {result}
        </pre>
      ) : null}
    </div>
  );
}

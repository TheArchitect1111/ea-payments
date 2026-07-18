'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { NAVY, GOLD } from '@/lib/design-system';

type LaunchResult = {
  projectId: string;
  status: string;
  client?: string;
};

const MAX_BYTES = 2 * 1024 * 1024;

export default function LaunchClient() {
  const [command, setCommand] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LaunchResult | null>(null);

  function onFileChange(next: File | null) {
    setError(null);
    setResult(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (!next) {
      setFile(null);
      return;
    }
    if (next.size > MAX_BYTES) {
      setFile(null);
      setError('Photo is too large. Keep it under 2MB.');
      return;
    }
    setFile(next);
    if (next.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(next));
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const trimmed = command.trim();
      let res: Response;

      if (file) {
        const form = new FormData();
        if (trimmed) form.set('command', trimmed);
        form.set('image', file);
        res = await fetch('/api/launch', {
          method: 'POST',
          credentials: 'include',
          body: form,
        });
      } else {
        res = await fetch('/api/launch', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: trimmed }),
        });
      }

      const raw = await res.text();
      let data: {
        ok?: boolean;
        error?: string;
        correction?: string;
        projectId?: string;
        status?: string;
        client?: string;
      } = {};
      try {
        data = raw ? (JSON.parse(raw) as typeof data) : {};
      } catch {
        if (res.status === 401 || /login/i.test(raw)) {
          setError('Please log in again, then try Launch.');
          return;
        }
        setError('Launch did not complete. Please try again.');
        return;
      }

      if (!res.ok || !data.ok || !data.projectId) {
        setError(data.correction || data.error || 'Launch failed. Try again.');
        return;
      }

      setResult({
        projectId: data.projectId,
        status: data.status || 'QUEUED',
        client: data.client,
      });
      setCommand('');
      onFileChange(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Launch failed. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-16 pt-6">
      <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: GOLD }}>
        EA Factory
      </p>
      <h1 className="mt-2 text-3xl font-black tracking-tight" style={{ color: NAVY }}>
        Launch
      </h1>
      <p className="mt-2 text-sm leading-6 text-neutral-600">
        Type a website or company name. Optional: add a photo. Tap Launch.
      </p>

      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-5">
        <label className="block">
          <span className="text-sm font-semibold text-neutral-800">What are we launching?</span>
          <textarea
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            rows={4}
            placeholder="Example: Launch https://www.bgca.org&#10;or: Launch Bob Rumball Centre"
            className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-base text-neutral-900 outline-none ring-[#C9A844] focus:ring-2"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-neutral-800">Photo (optional)</span>
          <input
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            className="mt-2 block w-full text-sm text-neutral-600 file:mr-3 file:rounded-full file:border-0 file:bg-[#1B2B4D] file:px-4 file:py-2 file:text-xs file:font-bold file:text-white"
          />
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Selected launch photo"
              className="mt-3 max-h-56 w-full rounded-xl object-cover"
            />
          ) : null}
          {file && !previewUrl ? (
            <p className="mt-2 text-xs text-neutral-500">Attached: {file.name}</p>
          ) : null}
        </label>

        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        {result ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
            <p className="font-bold">Launch started</p>
            {result.client ? <p className="mt-1">Client: {result.client}</p> : null}
            <p className="mt-1 font-mono text-xs">{result.projectId}</p>
            <p className="mt-1">Status: {result.status}</p>
            <Link
              href={`/admin/ea-factory/projects?focus=${encodeURIComponent(result.projectId)}`}
              className="mt-3 inline-block font-bold underline"
              style={{ color: NAVY }}
            >
              Open project
            </Link>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={busy || (!command.trim() && !file)}
          className="w-full rounded-full px-6 py-4 text-base font-black text-white disabled:opacity-50"
          style={{ backgroundColor: NAVY }}
        >
          {busy ? 'Launching…' : 'Launch'}
        </button>
      </form>

      <p className="mt-8 text-center text-xs text-neutral-500">
        <Link href="/admin/ea-factory/projects" className="font-semibold underline">
          See all projects
        </Link>
      </p>
    </div>
  );
}

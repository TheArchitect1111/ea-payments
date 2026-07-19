'use client';

import { useState } from 'react';
import type { AdminShowProvisionResult } from '@/lib/admin-show-provision';

type Result = {
  ok: true;
  portalSlug: string;
  siteUrl: string;
  portalUrl: string;
  enterUrl: string;
  email?: string;
  tempPassword?: string;
};

export default function ShowClient() {
  const [businessName, setBusinessName] = useState('');
  const [tagline, setTagline] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function onProvision(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const res = await fetch('/api/admin/show/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName.trim(),
          tagline: tagline.trim() || undefined,
        }),
      });
      const data = (await res.json()) as AdminShowProvisionResult;
      if (!res.ok || !data.ok) {
        setError(data.error || 'Provision failed.');
        return;
      }
      if (!data.enterUrl || !data.siteUrl || !data.portalUrl || !data.portalSlug) {
        setError('Provision succeeded but links are missing.');
        return;
      }
      setResult(data as Result);
    } catch {
      setError('Network error — try again.');
    } finally {
      setBusy(false);
    }
  }

  async function shareOrCopy(label: string, url: string) {
    try {
      if (navigator.share) {
        await navigator.share({ title: businessName || 'Client site', url });
        setCopied(label);
        return;
      }
    } catch {
      // fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(label);
    } catch {
      setError('Could not copy link.');
    }
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col gap-6 px-4 py-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a7350]">
          Live show
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-[#1a2332]">
          Phone demo
        </h1>
        <p className="text-sm leading-relaxed text-[#4a5568]">
          Open the shared demo, or type a business name to spin up a fresh site + portal.
        </p>
      </header>

      <a
        href="/api/auth/demo-enter"
        className="flex min-h-14 items-center justify-center rounded-xl bg-[#1a2332] px-4 text-center text-base font-semibold text-white active:opacity-90"
      >
        Open demo portal
      </a>

      <form onSubmit={onProvision} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[#1a2332]">Business name</span>
          <input
            type="text"
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Riverside Dental"
            className="min-h-14 rounded-xl border border-[#d8d0c4] bg-white px-4 text-base text-[#1a2332] outline-none focus:border-[#8a7350]"
            autoComplete="organization"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[#1a2332]">Tagline (optional)</span>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Short line for the site"
            className="min-h-14 rounded-xl border border-[#d8d0c4] bg-white px-4 text-base text-[#1a2332] outline-none focus:border-[#8a7350]"
          />
        </label>
        <button
          type="submit"
          disabled={busy || !businessName.trim()}
          className="flex min-h-14 items-center justify-center rounded-xl bg-[#c4a35a] px-4 text-base font-semibold text-[#1a2332] disabled:opacity-50 active:opacity-90"
        >
          {busy ? 'Creating…' : 'Create site + portal'}
        </button>
      </form>

      {error ? (
        <p className="rounded-xl bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <section className="flex flex-col gap-3 rounded-xl border border-[#d8d0c4] bg-white/80 p-4">
          <p className="text-sm font-medium text-[#1a2332]">
            Ready — {businessName.trim() || result.portalSlug}
          </p>

          <a
            href={result.enterUrl}
            className="flex min-h-14 items-center justify-center rounded-xl bg-[#1a2332] px-4 text-center text-base font-semibold text-white active:opacity-90"
          >
            Open portal
          </a>

          <a
            href={result.siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-14 items-center justify-center rounded-xl border border-[#1a2332] px-4 text-center text-base font-semibold text-[#1a2332] active:opacity-90"
          >
            Open public site
          </a>

          <button
            type="button"
            onClick={() => shareOrCopy('portal', result.portalUrl)}
            className="flex min-h-14 items-center justify-center rounded-xl border border-[#d8d0c4] px-4 text-base font-medium text-[#1a2332] active:bg-[#f5f0e8]"
          >
            {copied === 'portal' ? 'Portal link copied' : 'Share portal link'}
          </button>

          <button
            type="button"
            onClick={() => shareOrCopy('site', result.siteUrl)}
            className="flex min-h-14 items-center justify-center rounded-xl border border-[#d8d0c4] px-4 text-base font-medium text-[#1a2332] active:bg-[#f5f0e8]"
          >
            {copied === 'site' ? 'Site link copied' : 'Share site link'}
          </button>

          {result.tempPassword ? (
            <div className="rounded-lg bg-[#f5f0e8] px-3 py-3 text-sm text-[#1a2332]">
              <p className="font-medium">Temp password backup</p>
              <p className="mt-1 break-all font-mono text-xs">{result.email}</p>
              <p className="mt-1 break-all font-mono text-xs">{result.tempPassword}</p>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

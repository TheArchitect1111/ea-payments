'use client';

import { NAVY, GOLD } from '@/lib/design-system';
import Link from 'next/link';
import { useMemo, useState, type FormEvent } from 'react';

type Preset = {
  id: string;
  name: string;
  workspaceName: string;
  personalityId: string;
  themeId: string;
  enabledModuleKeys: string[];
  mappedModuleIds: string[];
  skippedEnableKeys: string[];
};

type CreateResult = {
  ok: true;
  organization: {
    id: string;
    name: string;
    portalSlug: string | null;
    platformClientId: string | null;
    themeId: string | null;
    personalityId: string | null;
    workspaceName: string | null;
  };
  portalUrl: string;
  workspacePreviewUrl: string;
  reproducePreviewUrl: string;
  landingPreviewUrl: string;
  publicSiteUrl: string;
  entitlements: {
    mappedModuleIds: string[];
    skippedEnableKeys: string[];
    enabled: string[];
    failed: string[];
  };
};

function slugify(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export default function ClientFactoryClient({
  storeConfigured,
  presets,
}: {
  storeConfigured: boolean;
  presets: Preset[];
}) {
  const [platformClientId, setPlatformClientId] = useState(presets[0]?.id ?? 'ea');
  const [name, setName] = useState('');
  const [portalSlug, setPortalSlug] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [industry, setIndustry] = useState('');
  const [mission, setMission] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateResult | null>(null);

  const preset = useMemo(
    () => presets.find((p) => p.id === platformClientId) ?? presets[0],
    [presets, platformClientId],
  );

  function onNameChange(value: string) {
    setName(value);
    if (!portalSlug || portalSlug === slugify(name)) {
      setPortalSlug(slugify(value));
    }
  }

  function onPresetChange(id: string) {
    setPlatformClientId(id);
    const next = presets.find((p) => p.id === id);
    if (next && !workspaceName) {
      setWorkspaceName(next.workspaceName);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/admin/client-factory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          portalSlug: portalSlug || slugify(name),
          platformClientId,
          workspaceName: workspaceName || undefined,
          industry: industry || undefined,
          mission: mission || undefined,
        }),
      });
      const data = (await res.json()) as CreateResult & { error?: string };
      if (!res.ok) {
        setError(data.error || 'Create failed.');
        return;
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF8F3] text-neutral-900">
      <section className="border-b border-neutral-200 bg-white px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: GOLD }}>
            Reproduction Engine
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight" style={{ color: NAVY }}>
            New Client Factory
          </h1>
          <p className="mt-2 text-sm leading-6 text-neutral-500">
            Reproduce a portal from a platform client preset — organization, workspace chrome,
            and hub entitlements in one pass.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold">
            <Link href="/admin/ea-factory" className="underline" style={{ color: NAVY }}>
              ← EA Factory
            </Link>
            <Link href="/admin/capability-marketplace?tab=clients" className="underline" style={{ color: NAVY }}>
              Client presets
            </Link>
            <Link href="/admin/workspace-preview" className="underline" style={{ color: NAVY }}>
              Workspace preview
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        {!storeConfigured && (
          <div className="border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Platform store is not configured. Set Airtable credentials before creating clients.
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5 border border-neutral-200 bg-white p-6">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Platform preset
            </label>
            <select
              value={platformClientId}
              onChange={(e) => onPresetChange(e.target.value)}
              className="mt-1 w-full border border-neutral-200 px-3 py-2 text-sm"
            >
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id})
                </option>
              ))}
            </select>
            {preset && (
              <div className="mt-3 grid gap-2 text-xs text-neutral-600 md:grid-cols-2">
                <p>
                  Theme: <strong>{preset.themeId}</strong>
                </p>
                <p>
                  Personality: <strong>{preset.personalityId}</strong>
                </p>
                <p>
                  Hub modules: <strong>{preset.mappedModuleIds.join(', ') || '—'}</strong>
                </p>
                <p>
                  Skipped keys:{' '}
                  <strong>{preset.skippedEnableKeys.join(', ') || 'none'}</strong>
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Organization name
            </label>
            <input
              required
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Acme Coaching"
              className="mt-1 w-full border border-neutral-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Portal slug
            </label>
            <input
              required
              value={portalSlug}
              onChange={(e) => setPortalSlug(slugify(e.target.value))}
              placeholder="acme"
              className="mt-1 w-full border border-neutral-200 px-3 py-2 text-sm font-mono"
            />
            <p className="mt-1 text-xs text-neutral-400">
              Live URL: /portal/{portalSlug || '…'}
            </p>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Workspace name (optional)
            </label>
            <input
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder={preset?.workspaceName}
              className="mt-1 w-full border border-neutral-200 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Industry (optional)
              </label>
              <input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="mt-1 w-full border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Mission (optional)
              </label>
              <input
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                className="mt-1 w-full border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {error && (
            <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy || !storeConfigured}
            className="rounded-full px-6 py-3 text-xs font-black uppercase tracking-wider text-white disabled:opacity-50"
            style={{ backgroundColor: NAVY }}
          >
            {busy ? 'Creating…' : 'Reproduce client'}
          </button>
        </form>

        {result && (
          <div className="border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-950">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Created
            </p>
            <h2 className="mt-1 text-xl font-black" style={{ color: NAVY }}>
              {result.organization.name}
            </h2>
            <p className="mt-2">
              Org id: <code>{result.organization.id}</code>
            </p>
            <p>
              Portal: <Link href={result.portalUrl} className="underline font-semibold">{result.portalUrl}</Link>
            </p>
            <p>
              Public site:{' '}
              <Link href={result.publicSiteUrl} className="underline font-semibold">
                {result.publicSiteUrl}
              </Link>
            </p>
            <p>
              Reproduce:{' '}
              <Link href={result.reproducePreviewUrl} className="underline font-semibold">
                Portal + landing preview
              </Link>
            </p>
            <p>
              Workspace:{' '}
              <Link href={result.workspacePreviewUrl} className="underline font-semibold">
                Shell only
              </Link>
            </p>
            <p className="mt-3">
              Enabled modules: {result.entitlements.enabled.join(', ') || 'none'}
            </p>
            {result.entitlements.failed.length > 0 && (
              <p className="text-amber-800">
                Failed entitlements: {result.entitlements.failed.join(', ')}
              </p>
            )}
            {result.entitlements.skippedEnableKeys.length > 0 && (
              <p className="mt-1 text-neutral-600">
                Preset keys without hub modules (tracked as capabilities only):{' '}
                {result.entitlements.skippedEnableKeys.join(', ')}
              </p>
            )}
            <p className="mt-4">
              <Link
                href={`/admin/capability-marketplace?tab=entitlements`}
                className="underline font-semibold"
              >
                Adjust entitlements →
              </Link>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type PreviewRow = {
  conceptId: string;
  name: string;
  lens: string;
  recommended: boolean;
  websitePreviewPath: string;
  portalPreviewPath: string;
  compositionSignature?: string;
  themeId?: string;
  primaryColor?: string;
  accentColor?: string;
};

type Bundle = {
  generatedAt?: string;
  portalSlug?: string;
  selectionStatus?: string;
  recommendedConceptId?: string | null;
  selectedConceptId?: string | null;
  previews: PreviewRow[];
};

async function readJson(res: Response): Promise<Record<string, unknown>> {
  const raw = await res.text();
  try {
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    return { error: 'Request failed. Please try again.' };
  }
}

export default function ConceptSelectionPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId: rawId } = use(params);
  const projectId = decodeURIComponent(rawId);

  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [wireSurfaces, setWireSurfaces] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch(
      `/api/admin/factory/concept-previews?projectId=${encodeURIComponent(projectId)}`,
      { credentials: 'include' },
    );
    const data = await readJson(res);
    if (!res.ok) {
      setError(String(data.error || 'Could not load concept previews.'));
      return;
    }
    if (data.previews && typeof data.previews === 'object') {
      setBundle(data.previews as Bundle);
    } else {
      setBundle(null);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function generate() {
    setBusy('generate');
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/factory/concept-previews', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const data = await readJson(res);
      if (!res.ok) {
        setError(String(data.error || 'Generate failed.'));
        return;
      }
      setMessage(
        `Composed ${Array.isArray(data.previews) ? data.previews.length : 0} real previews.`,
      );
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function selectConcept(conceptId: string) {
    setBusy(conceptId);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/factory/select-concept', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          selectedConceptId: conceptId,
          selectionStatus: 'awaiting_certify',
        }),
      });
      const data = await readJson(res);
      if (!res.ok) {
        setError(String(data.error || 'Select failed.'));
        return;
      }
      setMessage(
        `Selected ${conceptId}. Still no auto-publish — run Experience Director, then publish selected.`,
      );
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function publishSelected() {
    setBusy('publish');
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/factory/publish-selected-concept', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const data = await readJson(res);
      if (!res.ok) {
        setError(String(data.error || 'Wire failed.'));
        return;
      }
      const surfaces =
        data.surfaces && typeof data.surfaces === 'object'
          ? (data.surfaces as Record<string, unknown>)
          : null;
      setWireSurfaces(surfaces);
      const login = surfaces?.portalLoginUrl ? String(surfaces.portalLoginUrl) : '';
      const draft = surfaces?.draftPreviewPath ? String(surfaces.draftPreviewPath) : '';
      setMessage(
        `Wired. Status: ${String(data.websiteStatus || 'unknown')}` +
          (login ? ` · login ${login}` : '') +
          (draft ? ` · draft ${draft}` : ''),
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
          Name-to-Experience · Session 3 wire
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">
          Experience concepts
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
          Three directed website + portal drafts from Factory concepts. Select one for certify —
          never auto-publishes.
        </p>
        <p className="mt-1 font-mono text-xs text-neutral-400">{projectId}</p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void generate()}
          className="rounded-full bg-[#1B2B4D] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {busy === 'generate' ? 'Composing…' : 'Generate real previews'}
        </button>
        <button
          type="button"
          disabled={busy !== null || !bundle?.selectedConceptId}
          onClick={() => void publishSelected()}
          className="rounded-full border border-[#1B2B4D] px-4 py-2 text-sm font-bold text-[#1B2B4D] disabled:opacity-50"
          title="Requires concept selection + Experience Director Approved for public site"
        >
          {busy === 'publish' ? 'Wiring…' : 'Wire selected experience'}
        </button>
        <Link
          href={`/admin/ea-factory/experience-director?projectId=${encodeURIComponent(projectId)}`}
          className="text-sm font-semibold text-[#1B2B4D] underline"
        >
          Experience Director
        </Link>
        <Link
          href="/admin/ea-factory/projects"
          className="text-sm font-semibold text-neutral-600 underline"
        >
          Back to projects
        </Link>
      </div>

      {message ? <p className="mb-4 text-sm text-emerald-800">{message}</p> : null}
      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}

      {wireSurfaces ? (
        <div className="mb-6 border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
          <p className="font-semibold text-neutral-900">Session 3 — wired surfaces</p>
          <ul className="mt-2 space-y-1 font-mono text-xs">
            {wireSurfaces.portalLoginUrl ? (
              <li>
                Portal login:{' '}
                <a className="underline" href={String(wireSurfaces.portalLoginUrl)} target="_blank">
                  {String(wireSurfaces.portalLoginUrl)}
                </a>
              </li>
            ) : null}
            {wireSurfaces.portalCtpUrl ? (
              <li>
                Portal CTP:{' '}
                <a className="underline" href={String(wireSurfaces.portalCtpUrl)} target="_blank">
                  {String(wireSurfaces.portalCtpUrl)}
                </a>
              </li>
            ) : null}
            {wireSurfaces.draftPreviewPath ? (
              <li>
                Draft site:{' '}
                <a className="underline" href={String(wireSurfaces.draftPreviewPath)} target="_blank">
                  {String(wireSurfaces.draftPreviewPath)}
                </a>
              </li>
            ) : null}
            <li>
              Chassis modules: {Array.isArray(wireSurfaces.chassisModules)
                ? (wireSurfaces.chassisModules as string[]).join(', ')
                : '—'}
            </li>
            <li>Member home saved: {String(wireSurfaces.memberHomeSaved)}</li>
            <li>Login CTA in puck: {String(wireSurfaces.loginCtaPresent)}</li>
            <li>Public site quarantined: {String(wireSurfaces.publicSiteQuarantined)}</li>
          </ul>
        </div>
      ) : null}

      {bundle ? (
        <p className="mb-4 text-xs text-neutral-500">
          Portal slug <span className="font-mono">{bundle.portalSlug}</span> · status{' '}
          <span className="font-mono">{bundle.selectionStatus}</span>
          {bundle.selectedConceptId ? (
            <>
              {' '}
              · selected <span className="font-mono">{bundle.selectedConceptId}</span>
            </>
          ) : null}
        </p>
      ) : (
        <p className="mb-6 text-sm text-neutral-500">
          No composed previews yet. Generate after Factory emits experience_concepts.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {(bundle?.previews || []).map((preview) => {
          const selected = bundle?.selectedConceptId === preview.conceptId;
          return (
            <article
              key={preview.conceptId}
              className={`border p-4 ${
                selected ? 'border-[#1B2B4D] bg-[#F7F5F0]' : 'border-neutral-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold text-neutral-900">{preview.name}</h2>
                {preview.recommended ? (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                    Recommended
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs uppercase tracking-wide text-neutral-500">{preview.lens}</p>
              <p className="mt-2 font-mono text-[10px] text-neutral-400">{preview.conceptId}</p>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href={preview.websitePreviewPath}
                  target="_blank"
                  className="text-sm font-semibold text-[#1B2B4D] underline"
                >
                  Website preview
                </Link>
                <Link
                  href={preview.portalPreviewPath}
                  target="_blank"
                  className="text-sm font-semibold text-[#1B2B4D] underline"
                >
                  Portal preview
                </Link>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void selectConcept(preview.conceptId)}
                  className="mt-2 rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  {busy === preview.conceptId
                    ? 'Selecting…'
                    : selected
                      ? 'Selected'
                      : 'Select concept'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

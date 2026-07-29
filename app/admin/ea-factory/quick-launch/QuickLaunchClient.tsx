'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';

type DesiredOutput = 'landing-page' | 'website' | 'portal' | 'website-and-portal';

type PackageSection = {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
  sourceUrl?: string;
};

type ConceptCard = {
  conceptId: string;
  name: string;
  premise: string;
  description: string;
  recommended: boolean;
  selected: boolean;
  lens: string;
  compositionSignature: string;
  primaryColor: string;
  accentColor: string;
  websitePreviewPath: string;
  portalPreviewPath: string;
  websiteVerified: boolean;
  portalVerified: boolean;
};

type ReviewPayload = {
  packageReady?: boolean;
  conceptsReady?: boolean;
  selectedConceptId?: string | null;
  recommendedConceptId?: string | null;
  selectionStatus?: string | null;
  packageSections?: PackageSection[];
  concepts?: ConceptCard[];
};

type LaunchState = {
  identityBlocked?: boolean;
  identity?: {
    reason?: string;
    resumeHint?: string;
    candidates?: string[];
  } | null;
  conceptPackReady?: boolean;
  conceptPackFailed?: boolean;
  conceptPackError?: string | null;
  needsAutomaticNudge?: boolean;
};

type WiredSurfaces = {
  portalLoginUrl?: string;
  portalHomeUrl?: string;
  siteUrl?: string;
  draftPreviewPath?: string;
  websitePreviewPath?: string;
  portalPreviewPath?: string;
};

const DRAFT_KEY = 'ea-universal-quick-launch-draft-v2';
const SCROLL_KEY = 'ea-uxg-scroll';
const MAX_BYTES = 8 * 1024 * 1024;

const OUTPUT_OPTIONS: { value: DesiredOutput; label: string; deliverable: string; goal: string }[] = [
  {
    value: 'landing-page',
    label: 'Landing page',
    deliverable: 'Landing Page',
    goal: 'Research the subject and produce a story-driven landing page draft',
  },
  {
    value: 'website',
    label: 'Website',
    deliverable: 'Website',
    goal: 'Research the subject and produce a custom multi-section website draft',
  },
  {
    value: 'portal',
    label: 'Portal',
    deliverable: 'Portal',
    goal: 'Research the subject and provision a portal experience on the EA chassis',
  },
  {
    value: 'website-and-portal',
    label: 'Website + portal',
    deliverable: 'Website + Portal',
    goal: 'Research the subject and produce a matched website and portal experience',
  },
];

function loadDraft() {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(window.localStorage.getItem(DRAFT_KEY) || 'null') as {
      name?: string;
      distinguishingDetail?: string;
      knownUrl?: string;
      desiredOutput?: DesiredOutput;
      referenceUrl?: string;
    } | null;
  } catch {
    return null;
  }
}

export default function QuickLaunchClient() {
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get('projectId')?.trim() || '';

  const [name, setName] = useState('');
  const [distinguishingDetail, setDistinguishingDetail] = useState('');
  const [knownUrl, setKnownUrl] = useState('');
  const [desiredOutput, setDesiredOutput] = useState<DesiredOutput>('website-and-portal');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [forceNew, setForceNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [projectId, setProjectId] = useState(initialProjectId);
  const [clientName, setClientName] = useState('');
  const [stage, setStage] = useState('Finding the right person or organization');
  const [progressHint, setProgressHint] = useState('');
  const [inProgress, setInProgress] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [launch, setLaunch] = useState<LaunchState | null>(null);
  const [review, setReview] = useState<ReviewPayload | null>(null);
  const [clarify, setClarify] = useState('');
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [wired, setWired] = useState<WiredSurfaces | null>(null);
  const [wireMessage, setWireMessage] = useState<string | null>(null);
  const reviewAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const draft = loadDraft();
    if (!draft) return;
    setName(draft.name || '');
    setDistinguishingDetail(draft.distinguishingDetail || '');
    setKnownUrl(draft.knownUrl || '');
    setDesiredOutput(draft.desiredOutput || 'website-and-portal');
    setReferenceUrl(draft.referenceUrl || '');
  }, []);

  useEffect(() => {
    if (!name.trim()) return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          name: name.trim(),
          distinguishingDetail: distinguishingDetail.trim(),
          knownUrl: knownUrl.trim(),
          desiredOutput,
          referenceUrl: referenceUrl.trim(),
          savedAt: new Date().toISOString(),
        }),
      );
    }, 400);
    return () => window.clearTimeout(timer);
  }, [name, distinguishingDetail, knownUrl, desiredOutput, referenceUrl]);

  const syncProjectUrl = useCallback((id: string) => {
    if (typeof window === 'undefined' || !id) return;
    const url = new URL(window.location.href);
    url.searchParams.set('projectId', id);
    window.history.replaceState({}, '', url.toString());
  }, []);

  const applyStatus = useCallback((data: {
    project?: { client?: string; error?: string };
    plainLanguageStage?: string;
    progressHint?: string;
    statusLabel?: string;
    inProgress?: boolean;
    ready?: boolean;
    failed?: boolean;
    launch?: LaunchState;
    review?: ReviewPayload;
  }) => {
    setClientName(data.project?.client || '');
    setStage(
      data.plainLanguageStage ||
        data.statusLabel ||
        'Finding the right person or organization',
    );
    setProgressHint(data.progressHint || '');
    setInProgress(Boolean(data.inProgress));
    setReady(Boolean(data.ready));
    setFailed(Boolean(data.failed));
    setLaunch(data.launch || null);
    if (data.review) setReview(data.review);
  }, []);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    let timer: number | undefined;

    async function tick() {
      try {
        const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
          credentials: 'include',
        });
        const data = (await res.json()) as {
          ok?: boolean;
          project?: { client?: string; error?: string };
          plainLanguageStage?: string;
          progressHint?: string;
          statusLabel?: string;
          inProgress?: boolean;
          ready?: boolean;
          failed?: boolean;
          launch?: LaunchState;
          review?: ReviewPayload;
        };
        if (cancelled || !data.ok) return;
        applyStatus(data);

        const blocked = Boolean(data.launch?.identityBlocked);
        if (data.inProgress || (!data.ready && !data.failed && !blocked)) {
          timer = window.setTimeout(() => void tick(), 3500);
        }
      } catch {
        if (!cancelled) timer = window.setTimeout(() => void tick(), 6000);
      }
    }

    void tick();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [projectId, applyStatus]);

  useEffect(() => {
    if (!projectId || !ready) return;
    const raw = sessionStorage.getItem(SCROLL_KEY);
    if (!raw) return;
    sessionStorage.removeItem(SCROLL_KEY);
    const y = Number(raw);
    if (Number.isFinite(y)) {
      window.setTimeout(() => window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior }), 50);
    }
  }, [projectId, ready, review?.conceptsReady]);

  function openPreview(path: string) {
    sessionStorage.setItem(SCROLL_KEY, String(window.scrollY || 0));
    window.open(path, '_blank', 'noopener,noreferrer');
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    setWired(null);
    setWireMessage(null);

    const client = name.trim();
    if (!client) {
      setError('Enter a person or organization name.');
      setBusy(false);
      return;
    }

    const outputMeta =
      OUTPUT_OPTIONS.find((o) => o.value === desiredOutput) || OUTPUT_OPTIONS[3]!;
    const detail = distinguishingDetail.trim();
    const notes = [
      detail ? `Distinguishing detail: ${detail}` : null,
      knownUrl.trim() ? `Known website/social: ${knownUrl.trim()}` : null,
      referenceUrl.trim() ? `Reference URL: ${referenceUrl.trim()}` : null,
      `Desired output: ${outputMeta.label}`,
      files.length ? `Attached files: ${files.map((f) => f.name).join(', ')}` : null,
      'Source: Universal Quick Launch',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const form = new FormData();
      form.set('command', `Launch ${client}`);
      form.set('client', client);
      form.set('companyName', client);
      form.set('goal', outputMeta.goal);
      form.set('deliverable', outputMeta.deliverable);
      form.set('notes', notes);
      if (knownUrl.trim()) form.set('url', knownUrl.trim());
      if (forceNew) form.set('forceNew', '1');
      files.forEach((file, index) => {
        form.append(index === 0 ? 'image' : `file${index}`, file);
      });

      const res = await fetch('/api/launch', {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        correction?: string;
        projectId?: string;
        client?: string;
        reused?: boolean;
      };
      if (!res.ok || !data.ok || !data.projectId) {
        setError(data.correction || data.error || 'Launch failed. Try again.');
        return;
      }

      window.localStorage.removeItem(DRAFT_KEY);
      setProjectId(data.projectId);
      syncProjectUrl(data.projectId);
      setClientName(data.client || client);
      setInProgress(true);
      setReady(false);
      setStage('Finding the right person or organization');
      setMessage(
        data.reused
          ? 'Reopening your recent project for this name.'
          : 'Research & create started. Stay on this screen.',
      );
      setFiles([]);
      reviewAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Launch failed. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function resumeWithDetail(detailText: string, candidate?: string) {
    if (!projectId) return;
    setActionBusy('resume');
    setError(null);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/concept-previews`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distinguishingDetail: detailText || candidate,
          force: true,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || 'Could not continue yet. Trying automatic recovery…');
      } else {
        setClarify('');
        setMessage('Continuing automatically on this page.');
        setInProgress(true);
      }
    } catch {
      setError('Network error while continuing.');
    } finally {
      setActionBusy(null);
    }
  }

  async function selectConcept(conceptId: string) {
    if (!projectId) return;
    setActionBusy(conceptId);
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
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || 'Could not select concept.');
        return;
      }
      setReview((prev) =>
        prev
          ? {
              ...prev,
              selectedConceptId: conceptId,
              selectionStatus: 'awaiting_certify',
              concepts: (prev.concepts || []).map((c) => ({
                ...c,
                selected: c.conceptId === conceptId,
              })),
            }
          : prev,
      );
      setWireMessage('Concept selected. Approve to wire website and portal.');
    } catch {
      setError('Network error while selecting concept.');
    } finally {
      setActionBusy(null);
    }
  }

  async function approveAndWire() {
    if (!projectId || !review?.selectedConceptId) return;
    setActionBusy('wire');
    setError(null);
    setWireMessage(null);
    try {
      const res = await fetch('/api/admin/factory/publish-selected-concept', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        websiteStatus?: string;
        surfaces?: WiredSurfaces;
      };
      if (!res.ok || !data.ok) {
        setError(data.error || 'Wiring failed. Nothing was published automatically.');
        if (data.surfaces) setWired(data.surfaces);
        return;
      }
      setWired(data.surfaces || null);
      setWireMessage(
        `Wired (${data.websiteStatus || 'ready'}). Review the links below — public publish still follows Experience Director rules.`,
      );
    } catch {
      setError('Network error while wiring experience.');
    } finally {
      setActionBusy(null);
    }
  }

  const blocked = Boolean(launch?.identityBlocked);
  const concepts = (review?.concepts || []).filter(
    (c) => c.websiteVerified && c.portalVerified,
  );
  const sections = review?.packageSections || [];
  const selectedId = review?.selectedConceptId || null;

  return (
    <main className="min-h-screen bg-[#F7F3EC] px-4 py-8 text-[#17130F] sm:px-6 sm:py-12">
      <section className="mx-auto w-full max-w-3xl border border-[#D9CFC1] bg-white p-5 shadow-sm sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#B9894D]">
          Universal Experience Generator
        </p>
        <h1 className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl">
          Drop in a name. We research and build.
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#665F57]">
          Enter who to build for. Watch progress, review the research package, and choose one of
          three custom website and portal samples — all on this page.
        </p>

        {!projectId ? (
          <form className="mt-6 space-y-5" onSubmit={onSubmit}>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#665F57]">
                Who should we build for?
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="organization"
                enterKeyHint="go"
                required
                className="mt-2 w-full rounded-xl border border-[#D9CFC1] bg-white px-4 py-3.5 text-base outline-none focus:border-[#B9894D]"
                placeholder="Person or organization name"
              />
            </label>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-[#17130F] px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white disabled:opacity-50"
            >
              {busy ? 'Starting…' : 'Research & Create'}
            </button>

            <details className="rounded-xl border border-[#E6DCCE] bg-[#FBF8F3] px-4 py-3">
              <summary className="cursor-pointer text-sm font-bold">Add details only if you want to</summary>
              <div className="mt-4 space-y-4">
                <label className="block text-sm">
                  Distinguishing detail
                  <input
                    value={distinguishingDetail}
                    onChange={(e) => setDistinguishingDetail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#D9CFC1] px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  Known website
                  <input
                    value={knownUrl}
                    onChange={(e) => setKnownUrl(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#D9CFC1] px-3 py-2"
                    placeholder="example.com"
                  />
                </label>
                <fieldset>
                  <legend className="text-sm font-semibold">Desired output</legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {OUTPUT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setDesiredOutput(option.value)}
                        className={`rounded-xl border px-3 py-2 text-left text-sm font-bold ${
                          desiredOutput === option.value
                            ? 'border-[#17130F] bg-[#17130F] text-white'
                            : 'border-[#D9CFC1] bg-white'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <label className="block text-sm">
                  Reference URL
                  <input
                    value={referenceUrl}
                    onChange={(e) => setReferenceUrl(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#D9CFC1] px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  Photos, logo, or docs
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf,.doc,.docx"
                    onChange={(e) => {
                      const list = e.target.files;
                      if (!list?.length) {
                        setFiles([]);
                        return;
                      }
                      const next = Array.from(list);
                      if (next.some((f) => f.size > MAX_BYTES)) {
                        setError('Keep each file under 8MB.');
                        return;
                      }
                      setFiles(next.slice(0, 6));
                    }}
                    className="mt-1 block w-full text-sm"
                  />
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={forceNew}
                    onChange={(e) => setForceNew(e.target.checked)}
                    className="mt-1"
                  />
                  Force a new project even if a recent launch exists
                </label>
              </div>
            </details>
          </form>
        ) : null}

        {error ? (
          <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">
            {error}
          </p>
        ) : null}
        {message ? (
          <p role="status" className="mt-5 text-sm font-semibold text-[#665F57]">
            {message}
          </p>
        ) : null}

        {projectId ? (
          <div ref={reviewAnchorRef} className="mt-8 space-y-6">
            <div
              className={`rounded-xl border px-4 py-4 ${
                failed
                  ? 'border-red-200 bg-red-50'
                  : blocked
                    ? 'border-amber-200 bg-amber-50'
                    : ready
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-sky-200 bg-sky-50'
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">Live progress</p>
              <p className="mt-2 text-xl font-black">{stage}</p>
              {clientName ? <p className="mt-1 font-semibold">{clientName}</p> : null}
              {progressHint ? <p className="mt-2 text-sm opacity-80">{progressHint}</p> : null}
              {inProgress ? (
                <p className="mt-2 text-xs opacity-70">Updating automatically. Stay on this page.</p>
              ) : null}
            </div>

            {blocked ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 space-y-3">
                <p className="font-semibold">
                  {launch?.identity?.reason || 'We found more than one possible match.'}
                </p>
                {Array.isArray(launch?.identity?.candidates) &&
                (launch?.identity?.candidates?.length || 0) > 1 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-[0.14em]">Which one did you mean?</p>
                    {launch!.identity!.candidates!.slice(0, 3).map((candidate) => (
                      <button
                        key={candidate}
                        type="button"
                        disabled={actionBusy !== null}
                        onClick={() => void resumeWithDetail(candidate, candidate)}
                        className="w-full rounded-lg border border-amber-300 bg-white px-3 py-3 text-left text-sm font-semibold"
                      >
                        {candidate}
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <p className="text-sm">
                      {launch?.identity?.resumeHint ||
                        'What city, profession, team, company, or organization is this connected to?'}
                    </p>
                    <input
                      value={clarify}
                      onChange={(e) => setClarify(e.target.value)}
                      className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm"
                      placeholder="City, role, company, or organization"
                    />
                    <button
                      type="button"
                      disabled={actionBusy !== null || !clarify.trim()}
                      onClick={() => void resumeWithDetail(clarify.trim())}
                      className="w-full rounded-lg bg-[#17130F] px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white disabled:opacity-50"
                    >
                      {actionBusy === 'resume' ? 'Continuing…' : 'Continue'}
                    </button>
                  </>
                )}
              </div>
            ) : null}

            {sections.length > 0 ? (
              <div className="space-y-3">
                <h2 className="font-serif text-2xl">Research and creative package</h2>
                {sections.map((section) => (
                  <details
                    key={section.id}
                    className="rounded-xl border border-[#E6DCCE] bg-[#FBF8F3] px-4 py-3"
                  >
                    <summary className="cursor-pointer font-bold">{section.title}</summary>
                    <p className="mt-2 text-sm leading-6 text-[#665F57]">{section.summary}</p>
                    {section.bullets.length ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#665F57]">
                        {section.bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    ) : null}
                    {section.sourceUrl ? (
                      <a
                        href={section.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-sm font-bold underline"
                      >
                        Open source
                      </a>
                    ) : null}
                  </details>
                ))}
              </div>
            ) : null}

            {concepts.length > 0 ? (
              <div className="space-y-4">
                <h2 className="font-serif text-2xl">Three custom concepts</h2>
                <p className="text-sm text-[#665F57]">
                  Open the website and portal samples, then select one direction. Nothing publishes
                  until you approve.
                </p>
                <div className="grid gap-4">
                  {concepts.map((concept) => (
                    <article
                      key={concept.conceptId}
                      className="rounded-xl border border-[#D9CFC1] bg-white p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-black">{concept.name}</h3>
                          <p className="mt-1 text-sm font-semibold text-[#665F57]">{concept.premise}</p>
                        </div>
                        {concept.recommended ? (
                          <span className="rounded-full bg-[#17130F] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                            Recommended
                          </span>
                        ) : null}
                        {concept.selected ? (
                          <span className="rounded-full bg-emerald-700 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                            Selected
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#665F57]">{concept.description}</p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div
                          className="min-h-[96px] rounded-lg border border-[#E6DCCE] p-3"
                          style={{
                            background: `linear-gradient(135deg, ${concept.primaryColor} 0%, ${concept.accentColor} 100%)`,
                          }}
                        >
                          <p className="text-[11px] font-bold uppercase tracking-wide text-white/90">
                            Website
                          </p>
                          <p className="mt-2 text-sm font-semibold text-white">
                            {concept.compositionSignature || concept.lens}
                          </p>
                        </div>
                        <div
                          className="min-h-[96px] rounded-lg border border-[#E6DCCE] p-3"
                          style={{
                            background: `linear-gradient(160deg, ${concept.accentColor} 0%, ${concept.primaryColor} 100%)`,
                          }}
                        >
                          <p className="text-[11px] font-bold uppercase tracking-wide text-white/90">
                            Portal
                          </p>
                          <p className="mt-2 text-sm font-semibold text-white">Matching workspace</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <button
                          type="button"
                          onClick={() => openPreview(concept.websitePreviewPath)}
                          className="rounded-xl border border-[#17130F] px-4 py-3 text-sm font-bold"
                        >
                          Open website preview
                        </button>
                        <button
                          type="button"
                          onClick={() => openPreview(concept.portalPreviewPath)}
                          className="rounded-xl border border-[#17130F] px-4 py-3 text-sm font-bold"
                        >
                          Open portal preview
                        </button>
                        <button
                          type="button"
                          disabled={actionBusy !== null}
                          onClick={() => void selectConcept(concept.conceptId)}
                          className="rounded-xl bg-[#17130F] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                        >
                          {actionBusy === concept.conceptId
                            ? 'Selecting…'
                            : concept.selected
                              ? 'Selected'
                              : 'Select this concept'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={!selectedId || actionBusy !== null}
                  onClick={() => void approveAndWire()}
                  className="w-full rounded-xl bg-[#17130F] px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white disabled:opacity-40"
                >
                  {actionBusy === 'wire' ? 'Wiring…' : 'Approve and wire experience'}
                </button>
                {wireMessage ? (
                  <p className="text-sm font-semibold text-emerald-800">{wireMessage}</p>
                ) : null}
                {wired ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm space-y-1">
                    {wired.siteUrl ? (
                      <p>
                        Website:{' '}
                        <a className="font-bold underline" href={wired.siteUrl} target="_blank" rel="noreferrer">
                          {wired.siteUrl}
                        </a>
                      </p>
                    ) : null}
                    {wired.portalHomeUrl ? (
                      <p>
                        Portal:{' '}
                        <a className="font-bold underline" href={wired.portalHomeUrl} target="_blank" rel="noreferrer">
                          {wired.portalHomeUrl}
                        </a>
                      </p>
                    ) : null}
                    {wired.portalLoginUrl ? (
                      <p>
                        Portal login:{' '}
                        <a className="font-bold underline" href={wired.portalLoginUrl} target="_blank" rel="noreferrer">
                          {wired.portalLoginUrl}
                        </a>
                      </p>
                    ) : null}
                    {wired.draftPreviewPath ? (
                      <p>
                        Draft preview:{' '}
                        <a className="font-bold underline" href={wired.draftPreviewPath} target="_blank" rel="noreferrer">
                          {wired.draftPreviewPath}
                        </a>
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            <details className="rounded-xl border border-[#E6DCCE] px-4 py-3 text-sm text-[#665F57]">
              <summary className="cursor-pointer font-bold text-[#17130F]">
                Administrator diagnostics
              </summary>
              <p className="mt-2 font-mono text-[11px] break-all">{projectId}</p>
              {launch?.conceptPackError ? <p className="mt-2">{launch.conceptPackError}</p> : null}
              <p className="mt-2 text-xs">
                Recovery tools stay here. The normal journey never needs them.
              </p>
            </details>
          </div>
        ) : null}
      </section>
    </main>
  );
}

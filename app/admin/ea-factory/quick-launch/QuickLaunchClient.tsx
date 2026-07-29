'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import FactoryLiveStatus from '../launch/FactoryLiveStatus';

type DesiredOutput = 'landing-page' | 'website' | 'portal' | 'website-and-portal';

type Draft = {
  name: string;
  distinguishingDetail: string;
  knownUrl: string;
  desiredOutput: DesiredOutput;
  referenceUrl: string;
  savedAt: string;
};

type LaunchResult = {
  projectId: string;
  status: string;
  client?: string;
  reused?: boolean;
};

const DRAFT_KEY = 'ea-universal-quick-launch-draft-v1';
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

function loadDraft(): Draft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Draft;
  } catch {
    return null;
  }
}

function saveDraft(draft: Omit<Draft, 'savedAt'>) {
  if (typeof window === 'undefined') return;
  const payload: Draft = { ...draft, savedAt: new Date().toISOString() };
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
}

function clearDraft() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(DRAFT_KEY);
}

export default function QuickLaunchClient() {
  const [name, setName] = useState('');
  const [distinguishingDetail, setDistinguishingDetail] = useState('');
  const [knownUrl, setKnownUrl] = useState('');
  const [desiredOutput, setDesiredOutput] = useState<DesiredOutput>('website-and-portal');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<LaunchResult | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [forceNew, setForceNew] = useState(false);

  useEffect(() => {
    const draft = loadDraft();
    if (!draft) return;
    setName(draft.name || '');
    setDistinguishingDetail(draft.distinguishingDetail || '');
    setKnownUrl(draft.knownUrl || '');
    setDesiredOutput(draft.desiredOutput || 'website-and-portal');
    setReferenceUrl(draft.referenceUrl || '');
    setDraftRestored(true);
  }, []);

  const persistDraft = useCallback(() => {
    if (!name.trim() && !distinguishingDetail.trim() && !knownUrl.trim()) return;
    saveDraft({
      name: name.trim(),
      distinguishingDetail: distinguishingDetail.trim(),
      knownUrl: knownUrl.trim(),
      desiredOutput,
      referenceUrl: referenceUrl.trim(),
    });
  }, [name, distinguishingDetail, knownUrl, desiredOutput, referenceUrl]);

  useEffect(() => {
    const timer = window.setTimeout(() => persistDraft(), 400);
    return () => window.clearTimeout(timer);
  }, [persistDraft]);

  const outputMeta = useMemo(
    () => OUTPUT_OPTIONS.find((o) => o.value === desiredOutput) || OUTPUT_OPTIONS[3],
    [desiredOutput],
  );

  function onFilesSelected(list: FileList | null) {
    setError(null);
    if (!list?.length) {
      setFiles([]);
      return;
    }
    const next = Array.from(list);
    const tooBig = next.find((f) => f.size > MAX_BYTES);
    if (tooBig) {
      setError(`“${tooBig.name}” is too large. Keep each file under 8MB.`);
      return;
    }
    setFiles(next.slice(0, 6));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    setResult(null);

    const client = name.trim();
    const detail = distinguishingDetail.trim();
    if (!client) {
      setError('Enter a person or organization name.');
      setBusy(false);
      return;
    }
    if (!detail) {
      setError('Add one distinguishing detail so we can identify the right person or organization.');
      setBusy(false);
      return;
    }

    const notes = [
      `Distinguishing detail: ${detail}`,
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
      const raw = await res.text();
      let data: {
        ok?: boolean;
        error?: string;
        correction?: string;
        projectId?: string;
        status?: string;
        client?: string;
        reused?: boolean;
      } = {};
      try {
        data = raw ? (JSON.parse(raw) as typeof data) : {};
      } catch {
        setError(
          res.status === 401 || /login/i.test(raw)
            ? 'Please log in again, then try Quick Launch.'
            : 'Launch did not complete. Please try again.',
        );
        return;
      }

      if (!res.ok || !data.ok || !data.projectId) {
        setError(data.correction || data.error || 'Launch failed. Try again.');
        return;
      }

      clearDraft();
      setDraftRestored(false);
      setResult({
        projectId: data.projectId,
        status: data.status || 'QUEUED',
        client: data.client || client,
        reused: Boolean(data.reused),
      });
      setMessage(
        data.reused
          ? 'A recent project for this name already exists — reopening it instead of creating a duplicate.'
          : 'Factory project created. Research and production are running.',
      );
      setFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Launch failed. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F3EC] px-4 py-8 text-[#17130F] sm:px-6 sm:py-12">
      <section className="mx-auto w-full max-w-xl border border-[#D9CFC1] bg-white p-5 shadow-sm sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#B9894D]">
          EA Factory · Universal Quick Launch
        </p>
        <h1 className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl">
          One name in → researched experience
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#665F57]">
          Enter a person or organization. Factory researches identity, builds ProjectContext, and
          starts the existing pipeline. Review concepts and wire website + portal from the project
          screen — no Amanda-only hard-coding.
        </p>

        {draftRestored ? (
          <p className="mt-4 rounded-lg border border-[#E6DCCE] bg-[#FBF8F3] px-3 py-2 text-xs font-semibold text-[#665F57]">
            Draft restored on this device. You can leave and return without losing your inputs.
          </p>
        ) : null}

        <form className="mt-6 space-y-5" onSubmit={onSubmit}>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#665F57]">
              Person or organization name *
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="organization"
              enterKeyHint="next"
              required
              className="mt-2 w-full rounded-xl border border-[#D9CFC1] bg-white px-4 py-3.5 text-base outline-none focus:border-[#B9894D]"
              placeholder="e.g. Riverside Community Arts"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#665F57]">
              One distinguishing detail *
            </span>
            <input
              value={distinguishingDetail}
              onChange={(e) => setDistinguishingDetail(e.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-[#D9CFC1] bg-white px-4 py-3.5 text-base outline-none focus:border-[#B9894D]"
              placeholder="City, role, team, or unique phrase"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#665F57]">
              Known website or social (optional)
            </span>
            <input
              value={knownUrl}
              onChange={(e) => setKnownUrl(e.target.value)}
              inputMode="url"
              autoCapitalize="off"
              className="mt-2 w-full rounded-xl border border-[#D9CFC1] bg-white px-4 py-3.5 text-base outline-none focus:border-[#B9894D]"
              placeholder="https://"
            />
          </label>

          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-[0.16em] text-[#665F57]">
              Desired output *
            </legend>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {OUTPUT_OPTIONS.map((option) => {
                const selected = desiredOutput === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDesiredOutput(option.value)}
                    className={`rounded-xl border px-4 py-3 text-left text-sm font-bold ${
                      selected
                        ? 'border-[#17130F] bg-[#17130F] text-white'
                        : 'border-[#D9CFC1] bg-[#FBF8F3] text-[#17130F]'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#665F57]">
              Reference URL (optional)
            </span>
            <input
              value={referenceUrl}
              onChange={(e) => setReferenceUrl(e.target.value)}
              inputMode="url"
              className="mt-2 w-full rounded-xl border border-[#D9CFC1] bg-white px-4 py-3.5 text-base outline-none focus:border-[#B9894D]"
              placeholder="Design or content reference"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#665F57]">
              Photos, logo, PDF, or docs (optional)
            </span>
            <input
              type="file"
              accept="image/*,application/pdf,.doc,.docx,.ppt,.pptx"
              multiple
              capture="environment"
              onChange={(e) => onFilesSelected(e.target.files)}
              className="mt-2 block w-full text-sm text-[#665F57] file:mr-3 file:rounded-lg file:border-0 file:bg-[#17130F] file:px-4 file:py-2.5 file:text-xs file:font-bold file:uppercase file:tracking-wide file:text-white"
            />
            {files.length ? (
              <p className="mt-2 text-xs text-[#665F57]">
                {files.length} file{files.length === 1 ? '' : 's'} ready:{' '}
                {files.map((f) => f.name).join(', ')}
              </p>
            ) : (
              <p className="mt-2 text-xs text-[#8A8278]">
                On a phone, use camera or photo library. Up to 6 files, 8MB each.
              </p>
            )}
          </label>

          <label className="flex items-start gap-3 text-sm text-[#665F57]">
            <input
              type="checkbox"
              checked={forceNew}
              onChange={(e) => setForceNew(e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span>Force a new project even if a recent launch for this name exists</span>
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-[#17130F] px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white disabled:cursor-wait disabled:opacity-50"
          >
            {busy ? 'Starting…' : 'Start research & build'}
          </button>
        </form>

        {error ? (
          <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">
            {error}
          </p>
        ) : null}
        {message ? (
          <p role="status" aria-live="polite" className="mt-5 text-sm font-semibold text-[#665F57]">
            {message}
          </p>
        ) : null}

        {result ? (
          <div className="mt-6 space-y-4">
            <FactoryLiveStatus projectId={result.projectId} />
            <div className="grid gap-2 sm:grid-cols-2">
              <Link
                href={`/admin/ea-factory/projects?focus=${encodeURIComponent(result.projectId)}`}
                className="rounded-xl border border-[#D9CFC1] bg-[#FBF8F3] px-4 py-3 text-center text-sm font-bold"
              >
                Open project
              </Link>
              <Link
                href={`/admin/ea-factory/concepts/${encodeURIComponent(result.projectId)}`}
                className="rounded-xl border border-[#D9CFC1] bg-[#FBF8F3] px-4 py-3 text-center text-sm font-bold"
              >
                Concepts
              </Link>
            </div>
          </div>
        ) : null}

        <details className="mt-8 border-t border-[#E6DCCE] pt-5 text-sm text-[#665F57]">
          <summary className="cursor-pointer font-bold text-[#17130F]">
            Legacy Amanda golden-path activate
          </summary>
          <p className="mt-2 leading-6">
            The former one-click Amanda preset still exists for regression. Prefer Universal Quick
            Launch for all new clients.
          </p>
          <Link
            href="/admin/ea-factory/launch"
            className="mt-3 inline-block font-bold underline decoration-[#B9894D] underline-offset-4"
          >
            Open classic Factory Launch
          </Link>
          {' · '}
          <a
            href="#amanda-activate"
            className="font-bold underline decoration-[#B9894D] underline-offset-4"
            onClick={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError(null);
              try {
                const response = await fetch('/api/admin/factory/activate-experience', {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ presetId: 'amanda-catherine-editorial' }),
                });
                const payload = (await response.json().catch(() => ({}))) as {
                  ok?: boolean;
                  error?: string;
                };
                if (!response.ok || !payload.ok) {
                  setError(payload.error || 'Amanda activate failed.');
                  return;
                }
                setMessage('Amanda golden-path activate completed. Check returned portal/site links in server logs / response UI.');
              } catch {
                setError('Amanda activate request failed.');
              } finally {
                setBusy(false);
              }
            }}
          >
            Activate Amanda preset
          </a>
        </details>
      </section>
    </main>
  );
}

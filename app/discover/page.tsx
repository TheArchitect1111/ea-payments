'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  DISCOVERY_SCHEMA,
  answerLabel,
  buildDiscoveryRecommendations,
  buildSubmissionPayload,
  chunkQuestions,
  validateQuestions,
  visibleSections,
  type DiscoveryAnswerValue,
  type DiscoveryAnswers,
  type DiscoveryAssetUploadValue,
  type DiscoveryMultiTextValue,
  type DiscoveryQuestion,
  type DiscoverySection,
} from '@/lib/discovery-engine';

const BLACK = '#030303';
const CHARCOAL = '#111111';
const PANEL = '#171717';
const GOLD = '#D8AD3D';
const GOLD_BRIGHT = '#F6D66B';
const INK = '#FFFFFF';
const MUTED = '#B8B8B8';
const STORAGE_KEY = 'ea-discovery-engine-v2';
const DRAFT_TOKEN_KEY = 'ea-discovery-draft-token';

type SavedState = {
  answers: DiscoveryAnswers;
  sectionIndex: number;
  pageIndex: number;
  reviewMode: boolean;
};

type DiscoverGuideSignal = {
  id: string;
  question: string;
  helper: string;
  sectionTitle: string;
  sectionIntent: string;
  organizationType: string;
  required: boolean;
  type: string;
  answer: string;
  selectedLabels: string[];
  answeredQuestionIds: string[];
  pageLabel: string;
  progressMessage: string;
  reviewMode: boolean;
  reviewSummary?: string[];
};

export default function DiscoverPage() {
  return (
    <Suspense fallback={null}>
      <DiscoverPageInner />
    </Suspense>
  );
}

function DiscoverPageInner() {
  const searchParams = useSearchParams();
  const considerSlug = searchParams.get('consider')?.trim() || undefined;
  const partnerSlug = searchParams.get('partner')?.trim() || undefined;

  const [answers, setAnswers] = useState<DiscoveryAnswers>({});
  const [sectionIndex, setSectionIndex] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [reviewMode, setReviewMode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [draftToken, setDraftToken] = useState('');
  const [uploadingAsset, setUploadingAsset] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');

  const sections = useMemo(() => visibleSections(DISCOVERY_SCHEMA, answers), [answers]);
  const effectiveSectionIndex = Math.min(sectionIndex, Math.max(0, sections.length - 1));
  const section = sections[effectiveSectionIndex];
  const pages = useMemo(() => chunkQuestions(section?.questions ?? [], 3), [section]);
  const effectivePageIndex = Math.min(pageIndex, Math.max(0, pages.length - 1));
  const questions = useMemo(() => pages[effectivePageIndex] ?? [], [effectivePageIndex, pages]);
  const totalQuestionPages = sections.reduce((sum, item) => sum + chunkQuestions(item.questions, 3).length, 0);
  const currentQuestionPage = sections.slice(0, effectiveSectionIndex).reduce((sum, item) => sum + chunkQuestions(item.questions, 3).length, 0) + effectivePageIndex + 1;
  const progress = reviewMode
    ? 100
    : Math.min(96, Math.max(5, Math.round((currentQuestionPage / Math.max(totalQuestionPages, 1)) * 94)));
  const recommendations = useMemo(() => buildDiscoveryRecommendations(answers), [answers]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = readSavedState();
      setAnswers(saved.answers);
      setSectionIndex(saved.sectionIndex);
      setPageIndex(saved.pageIndex);
      setReviewMode(saved.reviewMode);
      setDraftToken(readDraftToken());
      setDraftReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    const state: SavedState = { answers, sectionIndex, pageIndex, reviewMode };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [answers, draftReady, pageIndex, reviewMode, sectionIndex]);

  useEffect(() => {
    if (!considerSlug) return;
    fetch(`/api/consider/${considerSlug}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'assessment_started' }),
    }).catch(() => {});
  }, [considerSlug]);

  const openGuideForQuestion = useCallback((question: DiscoveryQuestion) => {
    window.dispatchEvent(new CustomEvent('ea-guide:discover-focus-question', {
      detail: buildDiscoverGuideSignal(question, answers, section, currentQuestionPage, totalQuestionPages, reviewMode),
    }));
  }, [answers, currentQuestionPage, reviewMode, section, totalQuestionPages]);

  useEffect(() => {
    function findQuestion(questionId: string) {
      return DISCOVERY_SCHEMA.sections.flatMap((item) => item.questions).find((item) => item.id === questionId) ?? null;
    }

    function handleTrainingGuide() {
      const question = findQuestion('training_needs');
      if (question) openGuideForQuestion(question);
    }

    function handleWalkthrough() {
      setReviewMode(false);
      setSectionIndex(0);
      setPageIndex(0);
      const question = findQuestion('organization_name');
      if (question) openGuideForQuestion(question);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    window.addEventListener('ea-guide:discover-training', handleTrainingGuide);
    window.addEventListener('ea-guide:discover-walkthrough', handleWalkthrough);
    return () => {
      window.removeEventListener('ea-guide:discover-training', handleTrainingGuide);
      window.removeEventListener('ea-guide:discover-walkthrough', handleWalkthrough);
    };
  }, [openGuideForQuestion]);

  useEffect(() => {
    if (!draftReady) return;
    const activeQuestion = reviewMode ? undefined : questions.find((question) => !hasAnswer(answers[question.id])) ?? questions[0];
    const signal = activeQuestion
      ? buildDiscoverGuideSignal(activeQuestion, answers, section, currentQuestionPage, totalQuestionPages, reviewMode)
      : buildReviewGuideSignal(sections, answers);
    window.dispatchEvent(new CustomEvent('ea-guide:discover-context', { detail: signal }));
  }, [answers, currentQuestionPage, draftReady, questions, reviewMode, section, sections, totalQuestionPages]);

  function updateAnswer(id: string, value: DiscoveryAnswerValue) {
    setAnswers((current) => {
      const next = { ...current, [id]: value };
      const question = DISCOVERY_SCHEMA.sections.flatMap((item) => item.questions).find((item) => item.id === id);
      if (question) {
        window.dispatchEvent(new CustomEvent('ea-guide:discover-choice', {
          detail: buildDiscoverGuideSignal(question, next, section, currentQuestionPage, totalQuestionPages, reviewMode),
        }));
      }
      return next;
    });
    setError('');
  }

  const assetUploads = useMemo(() => readAssetUploads(answers.asset_uploads), [answers.asset_uploads]);

  async function uploadAsset(assetType: string, file: File) {
    if (!draftToken) {
      setUploadError('Draft session is not ready yet. Please try again.');
      return;
    }
    setUploadError('');
    setUploadingAsset(assetType);
    try {
      const form = new FormData();
      form.set('draftToken', draftToken);
      form.set('assetType', assetType);
      form.set('file', file);
      const res = await fetch('/api/ctp/assets', { method: 'POST', body: form });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        asset?: DiscoveryAssetUploadValue[string];
      };
      if (!res.ok || !data.ok || !data.asset) {
        setUploadError(data.error ?? 'Upload failed. Please try another file.');
        return;
      }
      updateAnswer('asset_uploads', { ...assetUploads, [assetType]: data.asset });
    } catch {
      setUploadError('Network error during upload. Please try again.');
    } finally {
      setUploadingAsset(null);
    }
  }

  function next() {
    setError('');
    const validation = validateQuestions(questions, answers);
    if (validation) {
      setError('Before we shape the next possibility, please answer: ' + validation);
      return;
    }
    if (effectivePageIndex < pages.length - 1) {
      setPageIndex((current) => current + 1);
      return;
    }
    if (effectiveSectionIndex < sections.length - 1) {
      setSectionIndex((current) => current + 1);
      setPageIndex(0);
      return;
    }
    setReviewMode(true);
  }

  function back() {
    setError('');
    if (reviewMode) {
      setReviewMode(false);
      setSectionIndex(Math.max(0, sections.length - 1));
      setPageIndex(Math.max(0, chunkQuestions(sections[Math.max(0, sections.length - 1)]?.questions ?? [], 3).length - 1));
      return;
    }
    if (effectivePageIndex > 0) {
      setPageIndex((current) => current - 1);
      return;
    }
    if (effectiveSectionIndex > 0) {
      const previousSection = sections[effectiveSectionIndex - 1];
      setSectionIndex((current) => current - 1);
      setPageIndex(Math.max(0, chunkQuestions(previousSection.questions, 3).length - 1));
    }
  }

  async function submitDiscovery() {
    setError('');
    const required = sections.flatMap((item) => item.questions).filter((question) => question.required);
    const validation = validateQuestions(required, answers);
    if (validation) {
      setReviewMode(false);
      setError('A required answer is missing: ' + validation);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildSubmissionPayload(answers, considerSlug, partnerSlug)),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; proposalId?: string; ok?: boolean; saved?: boolean };
      if (!res.ok || data.error) {
        setError(data.error ?? 'We could not create the blueprint yet. Please try again.');
        setLoading(false);
        return;
      }
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(DRAFT_TOKEN_KEY);
      const suffix = data.proposalId ? `?proposal=${encodeURIComponent(data.proposalId)}` : data.saved === false ? '?received=1' : '';
      window.location.href = `/discover/thank-you${suffix}`;
    } catch {
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  }

  function resetDraft() {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(DRAFT_TOKEN_KEY);
    setAnswers({});
    setSectionIndex(0);
    setPageIndex(0);
    setReviewMode(false);
    setError('');
    setUploadError('');
    setDraftToken(createDraftToken());
  }

  return (
    <main
      className="min-h-screen overflow-hidden text-white"
      style={{
        background:
          'radial-gradient(circle at 16% 8%, rgba(216,173,61,0.18), transparent 28%), radial-gradient(circle at 90% 18%, rgba(246,214,107,0.1), transparent 24%), #030303',
        color: INK,
      }}
    >
      <header className="border-b border-[#D8AD3D]/20 text-white backdrop-blur" style={{ backgroundColor: 'rgba(3,3,3,0.88)' }}>
        <div className="mx-auto max-w-6xl px-5 py-5 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <Link href="/" aria-label="Efficiency Architects home" className="shrink-0">
              <img src="/images/ea-logo-premium.png" alt="Efficiency Architects" className="h-20 w-auto rounded-md object-contain" />
            </Link>
            <div className="w-full max-w-xl">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-[0.18em] text-white/80">
                <span>{DISCOVERY_SCHEMA.title}</span>
                <span>{reviewMode ? 'Review' : `${DISCOVERY_SCHEMA.estimatedMinutes} min`}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_BRIGHT})` }} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="relative border-b border-[#D8AD3D]/15">
        <div className="pointer-events-none absolute right-10 top-10 h-32 w-32 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(216,173,61,0.22)' }} />
        <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-14 pt-10 text-white sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.32em]" style={{ color: GOLD }}>
              Reclaim Time. Reduce Costs. Maximize Output. Fuel Growth.
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.02] sm:text-6xl">
              Let&apos;s discover the possibilities!
            </h1>
          </div>
          <div className="grid content-end gap-4 text-sm leading-7 text-white/78">
            <p>
              A few thoughtful answers help us recommend the page, profile, portal, automation, or experience that best fits your goals.
            </p>
            <div className="rounded-2xl border border-[#D8AD3D]/25 bg-white/[0.06] p-5 shadow-[0_0_40px_rgba(216,173,61,0.08)]">
              <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: GOLD }}>
                EA Guide is available
              </p>
              <p className="mt-2">
                The glowing orb can help explain any question. Use it when a choice feels close, unfamiliar, or worth thinking through.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <nav className="hidden lg:block">
            <div className="sticky top-6 rounded-2xl border border-[#D8AD3D]/20 p-5 shadow-2xl" style={{ backgroundColor: CHARCOAL }}>
              <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: GOLD }}>
                Journey
              </p>
              <div className="mt-5 space-y-2">
                {sections.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setReviewMode(false);
                      setSectionIndex(index);
                      setPageIndex(0);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-bold"
                    style={{
                      backgroundColor: !reviewMode && index === effectiveSectionIndex ? 'rgba(216,173,61,0.12)' : 'transparent',
                      color: !reviewMode && index === effectiveSectionIndex ? GOLD_BRIGHT : MUTED,
                    }}
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: index <= effectiveSectionIndex || reviewMode ? GOLD : '#555' }} />
                    {item.title}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setReviewMode(true)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-bold"
                  style={{ backgroundColor: reviewMode ? 'rgba(216,173,61,0.12)' : 'transparent', color: reviewMode ? GOLD_BRIGHT : MUTED }}
                >
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: reviewMode ? GOLD_BRIGHT : '#555' }} />
                  Review selections
                </button>
              </div>
            </div>
          </nav>

          <div>
            {reviewMode ? (
              <ReviewComposite
                sections={sections}
                answers={answers}
                recommendations={recommendations}
                onEdit={(sectionId) => {
                  const nextIndex = sections.findIndex((item) => item.id === sectionId);
                  setSectionIndex(Math.max(0, nextIndex));
                  setPageIndex(0);
                  setReviewMode(false);
                }}
              />
            ) : (
              <>
                <div className="mb-5">
                  <p className="text-xs font-black uppercase tracking-[0.26em]" style={{ color: GOLD }}>
                    {section?.title}
                  </p>
                  <h2 className="mt-2 text-3xl font-black leading-tight text-white">
                    {section?.intent}
                  </h2>
                </div>
                <div className="space-y-5">
                  {questions.map((question) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      value={answers[question.id]}
                      onChange={(value) => updateAnswer(question.id, value)}
                      onHelp={() => openGuideForQuestion(question)}
                      assetUploads={assetUploads}
                      uploadingAsset={uploadingAsset}
                      uploadError={uploadError}
                      onAssetUpload={(assetType, file) => void uploadAsset(assetType, file)}
                    />
                  ))}
                </div>
              </>
            )}

            {error ? (
              <div className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={back}
                disabled={effectiveSectionIndex === 0 && effectivePageIndex === 0 && !reviewMode}
                className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white disabled:opacity-40"
              >
                Back
              </button>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={resetDraft}
                  className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white/75"
                >
                  Start Fresh
                </button>
                {reviewMode ? (
                  <button
                    type="button"
                    onClick={() => void submitDiscovery()}
                    disabled={loading}
                    className="rounded-full px-6 py-3 text-xs font-black uppercase tracking-[0.16em] text-black disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})` }}
                  >
                    {loading ? 'Creating...' : "Discover What's Possible"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={next}
                    className="rounded-full px-6 py-3 text-xs font-black uppercase tracking-[0.16em] shadow-[0_0_28px_rgba(216,173,61,0.22)]"
                    style={{ backgroundColor: GOLD, color: BLACK }}
                  >
                    Discover What&apos;s Possible
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}

function QuestionCard({
  question,
  value,
  onChange,
  onHelp,
  assetUploads,
  uploadingAsset,
  uploadError,
  onAssetUpload,
}: {
  question: DiscoveryQuestion;
  value: DiscoveryAnswerValue;
  onChange: (value: DiscoveryAnswerValue) => void;
  onHelp: () => void;
  assetUploads: DiscoveryAssetUploadValue;
  uploadingAsset: string | null;
  uploadError: string;
  onAssetUpload: (assetType: string, file: File) => void;
}) {
  const isMulti = question.type === 'multi' || question.type === 'asset-select' || question.type === 'multi-text';
  return (
    <article className="rounded-3xl border border-[#D8AD3D]/20 p-6 shadow-2xl" style={{ backgroundColor: PANEL }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: isMulti ? GOLD_BRIGHT : GOLD }}>
            {isMulti ? 'Choose all that apply' : question.required ? 'Required' : 'Optional'}
          </p>
          <h3 className="mt-2 text-2xl font-black leading-tight text-white">
            {question.question}
          </h3>
        </div>
        <button
          type="button"
          onClick={onHelp}
          className="rounded-full border border-[#D8AD3D]/30 bg-white/5 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-white/80"
        >
          Guide Me
        </button>
      </div>
      <p className="mt-3 max-w-3xl text-sm leading-7" style={{ color: MUTED }}>{question.helper}</p>
      {!question.required ? (
        <p className="mt-2 text-xs font-semibold leading-5 text-white/45">
          Optional. The prompts are there to spark ideas; use only what helps.
        </p>
      ) : null}
      <div className="mt-5">
        <QuestionInput
          question={question}
          value={value}
          onChange={onChange}
          assetUploads={assetUploads}
          uploadingAsset={uploadingAsset}
          uploadError={uploadError}
          onAssetUpload={onAssetUpload}
        />
      </div>
    </article>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
  assetUploads,
  uploadingAsset,
  uploadError,
  onAssetUpload,
}: {
  question: DiscoveryQuestion;
  value: DiscoveryAnswerValue;
  onChange: (value: DiscoveryAnswerValue) => void;
  assetUploads: DiscoveryAssetUploadValue;
  uploadingAsset: string | null;
  uploadError: string;
  onAssetUpload: (assetType: string, file: File) => void;
}) {
  if (question.type === 'text' || question.type === 'email') {
    return (
      <input
        type={question.type}
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => onChange(event.target.value)}
        onInput={(event) => onChange(event.currentTarget.value)}
        placeholder={question.placeholder}
        className="w-full rounded-2xl border border-white/15 bg-black/35 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#D8AD3D]"
      />
    );
  }

  if (question.type === 'textarea') {
    return (
      <textarea
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => onChange(event.target.value)}
        onInput={(event) => onChange(event.currentTarget.value)}
        placeholder={question.placeholder}
        className="min-h-28 w-full rounded-2xl border border-white/15 bg-black/35 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/35 focus:border-[#D8AD3D]"
      />
    );
  }

  if (question.type === 'multi-text') {
    const current = isMultiTextValue(value) ? value : { selected: [], note: typeof value === 'string' ? value : '' };
    const selected = current.selected ?? [];

    function toggleIdea(choiceId: string) {
      const has = selected.includes(choiceId);
      const nextSelected = has ? selected.filter((item) => item !== choiceId) : [...selected, choiceId];
      onChange({ ...current, selected: nextSelected });
    }

    return (
      <div>
        <p className="mb-3 text-xs font-black uppercase tracking-[0.14em]" style={{ color: GOLD_BRIGHT }}>
          Choose any ideas that fit
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {(question.choices ?? []).map((choice) => {
            const active = selected.includes(choice.id);
            return (
              <button
                key={choice.id}
                type="button"
                data-choice-id={choice.id}
                aria-pressed={active}
                onClick={() => toggleIdea(choice.id)}
                className="min-h-16 rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5"
                style={{
                  borderColor: active ? GOLD_BRIGHT : 'rgba(255,255,255,0.14)',
                  backgroundColor: active ? 'rgba(216,173,61,0.14)' : 'rgba(255,255,255,0.04)',
                  boxShadow: active ? '0 0 28px rgba(216,173,61,0.16)' : undefined,
                }}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="block text-sm font-black text-white">{choice.label}</span>
                  <span
                    className="grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] font-black"
                    style={{ borderColor: active ? GOLD_BRIGHT : 'rgba(255,255,255,0.22)', color: active ? GOLD_BRIGHT : 'transparent' }}
                  >
                    &#10003;
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <textarea
          value={current.note ?? ''}
          onChange={(event) => onChange({ ...current, note: event.target.value })}
          onInput={(event) => onChange({ ...current, note: event.currentTarget.value })}
          placeholder={question.placeholder}
          className="mt-4 min-h-32 w-full rounded-2xl border border-[#D8AD3D]/25 bg-black/35 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/35 focus:border-[#F6D66B]"
        />
      </div>
    );
  }

  if (question.type === 'scale') {
    return (
      <input
        type="range"
        min={1}
        max={10}
        value={typeof value === 'number' ? value : 5}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full"
      />
    );
  }

  const selected = Array.isArray(value) ? value : [];
  const singleValue = typeof value === 'string' ? value : '';
  const isMulti = question.type === 'multi' || question.type === 'asset-select';

  function toggle(choiceId: string) {
    if (!isMulti) {
      onChange(choiceId);
      return;
    }
    const has = selected.includes(choiceId);
    const next = has ? selected.filter((item) => item !== choiceId) : [...selected, choiceId];
    if (!has && question.maxSelections && next.length > question.maxSelections) return;
    onChange(next);
  }

  return (
    <div>
      {isMulti ? (
        <p className="mb-3 text-xs font-black uppercase tracking-[0.14em]" style={{ color: GOLD_BRIGHT }}>
          Select all that apply{question.maxSelections ? `, up to ${question.maxSelections}` : ''}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {(question.choices ?? []).map((choice) => {
          const active = isMulti ? selected.includes(choice.id) : singleValue === choice.id;
          return (
            <button
              key={choice.id}
              type="button"
              data-choice-id={choice.id}
              aria-pressed={active}
              onClick={() => toggle(choice.id)}
              className="min-h-24 rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5"
              style={{
                borderColor: active ? GOLD_BRIGHT : '#E5E7EB',
                backgroundColor: active ? 'rgba(216,173,61,0.14)' : 'rgba(255,255,255,0.04)',
                boxShadow: active ? '0 0 28px rgba(216,173,61,0.16)' : undefined,
              }}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="block text-sm font-black text-white">
                  {choice.label}
                </span>
                <span
                  className="grid h-5 w-5 shrink-0 place-items-center border text-[10px] font-black"
                  style={{ borderColor: active ? GOLD_BRIGHT : '#D0D5DD', color: active ? GOLD_BRIGHT : 'transparent' }}
                >
                  &#10003;
                </span>
              </span>
              {choice.description ? <span className="mt-2 block text-xs leading-5 text-white/50">{choice.description}</span> : null}
            </button>
          );
        })}
      </div>
      {question.type === 'asset-select' && selected.length ? (
        <div className="mt-4 space-y-3 rounded-2xl border border-dashed border-[#D8AD3D]/25 bg-black/30 p-4">
          {selected.map((asset) => {
            const uploaded = assetUploads[asset];
            const busy = uploadingAsset === asset;
            return (
              <label key={asset} className="block text-sm font-semibold text-white/75">
                {assetLabel(question, asset)}
                <input
                  type="file"
                  accept={assetAcceptHint(asset)}
                  className="mt-2 block w-full rounded-xl border border-white/10 bg-black/30 p-2 text-xs text-white/50"
                  disabled={busy}
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    event.currentTarget.value = '';
                    if (file) onAssetUpload(asset, file);
                  }}
                />
                {busy ? (
                  <span className="mt-2 block text-xs font-semibold text-[#F6D66B]">Uploading…</span>
                ) : uploaded ? (
                  <span className="mt-2 block text-xs font-semibold text-emerald-300">
                    Uploaded: {uploaded.fileName} ({formatFileSize(uploaded.size)})
                  </span>
                ) : (
                  <span className="mt-2 block text-xs text-white/40">Optional — up to 2MB</span>
                )}
              </label>
            );
          })}
          {uploadError ? (
            <p className="text-xs font-semibold text-red-300">{uploadError}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ReviewComposite({
  sections,
  answers,
  recommendations,
  onEdit,
}: {
  sections: DiscoverySection[];
  answers: DiscoveryAnswers;
  recommendations: string[];
  onEdit: (sectionId: string) => void;
}) {
  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-[#D8AD3D]/20 p-6 shadow-2xl" style={{ backgroundColor: PANEL }}>
        <p className="text-xs font-black uppercase tracking-[0.24em]" style={{ color: GOLD }}>
          Review Before We Build
        </p>
        <h2 className="mt-3 text-4xl font-black leading-tight text-white">
          Your possibility profile
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/65">
          Thank you for sharing this. Review your selections before we build the blueprint so the next step feels clear, useful, and true to your goals.
        </p>
      </div>

      <div className="grid gap-4">
        {sections.map((section) => {
          const answered = section.questions
            .map((question) => ({ question, value: answerLabel(question, answers[question.id]) }))
            .filter((item) => item.value);
          if (!answered.length) return null;
          return (
            <article key={section.id} className="rounded-3xl border border-[#D8AD3D]/15 p-5 shadow-2xl" style={{ backgroundColor: CHARCOAL }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-black text-white">
                  {section.title}
                </h3>
                <button
                  type="button"
                  onClick={() => onEdit(section.id)}
                  className="rounded-full border border-[#D8AD3D]/25 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white/75"
                >
                  Edit
                </button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {answered.map((item) => (
                  <div key={item.question.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">
                      {item.question.question}
                    </p>
                    <p className="mt-2 text-sm font-bold leading-6 text-white/82">{item.value}</p>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <article className="rounded-3xl border border-[#D8AD3D]/25 p-6 text-white shadow-2xl" style={{ backgroundColor: CHARCOAL }}>
        <p className="text-xs font-black uppercase tracking-[0.24em]" style={{ color: GOLD }}>
          Consider the Possibilities!
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {recommendations.map((item) => (
            <p key={item} className="border border-white/12 bg-white/[0.06] p-4 text-sm font-semibold leading-6 text-white/86">
              {item}
            </p>
          ))}
        </div>
      </article>
      <div className="rounded-3xl border border-[#D8AD3D]/25 p-8 text-center shadow-[0_0_45px_rgba(216,173,61,0.12)]" style={{ backgroundColor: PANEL }}>
        <p className="text-sm font-bold leading-7 text-white/65">
          You have already taken the most important step: naming where you want to go.
        </p>
        <h3 className="mt-3 text-4xl font-black uppercase tracking-[0.08em] sm:text-5xl" style={{ color: GOLD }}>
          Consider the Possibilities!
        </h3>
      </div>
    </section>
  );
}

function assetLabel(question: DiscoveryQuestion, asset: string) {
  return question.choices?.find((choice) => choice.id === asset)?.label ?? asset;
}

function assetAcceptHint(assetType: string) {
  if (assetType === 'logo' || assetType === 'photos') return 'image/*';
  if (assetType === 'videos') return 'video/mp4,video/quicktime,image/*';
  if (assetType === 'presentations') {
    return '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation';
  }
  return 'image/*,application/pdf,.doc,.docx,.txt,video/mp4';
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function readAssetUploads(value: DiscoveryAnswerValue): DiscoveryAssetUploadValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  if ('selected' in value || 'note' in value) return {};
  return value as DiscoveryAssetUploadValue;
}

function createDraftToken() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readDraftToken() {
  if (typeof window === 'undefined') return createDraftToken();
  const existing = window.localStorage.getItem(DRAFT_TOKEN_KEY)?.trim();
  if (existing && existing.length >= 8) return existing;
  const next = createDraftToken();
  window.localStorage.setItem(DRAFT_TOKEN_KEY, next);
  return next;
}

function isMultiTextValue(value: DiscoveryAnswerValue): value is DiscoveryMultiTextValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && ('selected' in value || 'note' in value);
}

function hasAnswer(value: DiscoveryAnswerValue) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return true;
  if (typeof value === 'string') return value.trim().length > 0;
  if (isMultiTextValue(value)) return Boolean(value.note?.trim() || value.selected?.length);
  if (value && typeof value === 'object') return Object.keys(value).length > 0;
  return false;
}

function selectedLabels(question: DiscoveryQuestion, value: DiscoveryAnswerValue) {
  const ids = Array.isArray(value)
    ? value
    : isMultiTextValue(value)
      ? value.selected ?? []
      : typeof value === 'string'
        ? [value]
        : [];
  return ids
    .map((id) => question.choices?.find((choice) => choice.id === id)?.label ?? id)
    .filter(Boolean);
}

function buildDiscoverGuideSignal(
  question: DiscoveryQuestion,
  answers: DiscoveryAnswers,
  section: DiscoverySection | undefined,
  currentQuestionPage: number,
  totalQuestionPages: number,
  reviewMode: boolean,
): DiscoverGuideSignal {
  const value = answers[question.id];
  const answer = answerLabel(question, value);
  return {
    id: question.id,
    question: question.question,
    helper: question.helper,
    sectionTitle: section?.title ?? 'Discover',
    sectionIntent: section?.intent ?? 'Discover what is possible.',
    organizationType: typeof answers.organization_type === 'string' ? answers.organization_type : '',
    required: Boolean(question.required),
    type: question.type,
    answer,
    selectedLabels: selectedLabels(question, value),
    answeredQuestionIds: answeredQuestionIds(answers),
    pageLabel: `Step ${Math.min(currentQuestionPage, totalQuestionPages)} of ${Math.max(totalQuestionPages, 1)}`,
    progressMessage: progressMessage(currentQuestionPage, totalQuestionPages, answer),
    reviewMode,
  };
}

function buildReviewGuideSignal(sections: DiscoverySection[], answers: DiscoveryAnswers): DiscoverGuideSignal {
  const reviewSummary = sections
    .map((section) => {
      const count = section.questions.filter((question) => hasAnswer(answers[question.id])).length;
      return count ? `${section.title}: ${count} selection${count === 1 ? '' : 's'}` : '';
    })
    .filter(Boolean);
  return {
    id: 'review',
    question: 'Review your selections before we build the blueprint.',
    helper: 'This is the last check before the Discovery path becomes a clear Blueprint direction.',
    sectionTitle: 'Review selections',
    sectionIntent: 'Confirm the direction feels right.',
    organizationType: typeof answers.organization_type === 'string' ? answers.organization_type : '',
    required: false,
    type: 'review',
    answer: '',
    selectedLabels: [],
    answeredQuestionIds: answeredQuestionIds(answers),
    pageLabel: 'Review',
    progressMessage: 'Excellent. We now have enough information to shape recommendations.',
    reviewMode: true,
    reviewSummary,
  };
}

function answeredQuestionIds(answers: DiscoveryAnswers) {
  return DISCOVERY_SCHEMA.sections
    .flatMap((section) => section.questions)
    .filter((question) => hasAnswer(answers[question.id]))
    .map((question) => question.id);
}

function progressMessage(currentQuestionPage: number, totalQuestionPages: number, answer: string) {
  if (answer) return 'Interesting. I am connecting this to your Blueprint as we go.';
  if (currentQuestionPage <= 2) return 'I am beginning to understand your organization.';
  if (currentQuestionPage >= totalQuestionPages - 1) return 'Your Blueprint is starting to take shape.';
  return 'I am starting to see the opportunities that fit your goals.';
}

function readSavedState(): SavedState {
  const fallback: SavedState = { answers: {}, sectionIndex: 0, pageIndex: 0, reviewMode: false };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const saved = JSON.parse(raw) as Partial<SavedState>;
    return {
      answers: saved.answers ?? {},
      sectionIndex: saved.sectionIndex ?? 0,
      pageIndex: saved.pageIndex ?? 0,
      reviewMode: saved.reviewMode ?? false,
    };
  } catch {
    return fallback;
  }
}

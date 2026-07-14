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
import {
  buildCtpExecutiveScore,
  type CtpAreaScore,
  type CtpExecutiveScore,
} from '@/lib/ctp-executive-scoring';
import { normalizeFactoryOpportunity } from '@/lib/factory-opportunities';

const BLACK = '#030303';
const CREAM = '#F5F1E8';
const PAPER = '#FFFBF2';
const CHARCOAL = '#111111';
const PANEL = '#171717';
const GOLD = '#D8AD3D';
const GOLD_BRIGHT = '#F6D66B';
const INK = '#FFFFFF';
const MUTED = '#B8B8B8';
const EARTH = '#5E5141';
const STORAGE_KEY = 'ea-discovery-engine-v2';
const DRAFT_TOKEN_KEY = 'ea-discovery-draft-token';
const QUESTION_PAGE_SIZE = 1;

type StoryFrame = {
  theme: string;
  feeling: string;
  thought: string;
  image: string;
  alt: string;
  objectPosition: string;
};

const STORY_FRAMES: StoryFrame[] = [
  {
    theme: 'Possibility',
    feeling: 'Hope',
    thought: 'Maybe the organization really can support the life I am building.',
    image: '/images/ctp-editorial/01-possibility-beach-family.png',
    alt: 'A multigenerational family walking together on a beach at sunset.',
    objectPosition: '38% 50%',
  },
  {
    theme: 'Purpose',
    feeling: 'Meaning',
    thought: 'This is why the work matters.',
    image: '/images/ctp-editorial/02-purpose-service-leader.png',
    alt: 'A mission-driven leader serving children and families in a warm community room.',
    objectPosition: '50% 48%',
  },
  {
    theme: 'Presence',
    feeling: 'Presence',
    thought: 'Success should not cost the moments that matter.',
    image: '/images/ctp-editorial/03-presence-parent-child.png',
    alt: 'A parent fully engaged with a child on a neighborhood basketball court.',
    objectPosition: '45% 50%',
  },
  {
    theme: 'Freedom',
    feeling: 'Trust',
    thought: 'The organization can keep moving without my hand in every detail.',
    image: '/images/ctp-editorial/04-freedom-travel-couple.png',
    alt: 'A diverse couple beginning a trip with calm confidence.',
    objectPosition: '50% 48%',
  },
  {
    theme: 'Calm',
    feeling: 'Confidence',
    thought: 'Leadership can begin with clarity instead of chaos.',
    image: '/images/ctp-editorial/05-calm-morning-owner.png',
    alt: 'A business owner enjoying a quiet morning with coffee and a notebook.',
    objectPosition: '45% 48%',
  },
  {
    theme: 'Capacity',
    feeling: 'Empowerment',
    thought: 'The team can carry more when the path is clear.',
    image: '/images/ctp-editorial/06-capacity-team-collaboration.png',
    alt: 'A diverse team collaborating naturally in warm morning light.',
    objectPosition: '50% 50%',
  },
  {
    theme: 'Stewardship',
    feeling: 'Service',
    thought: 'The people we serve should feel the difference.',
    image: '/images/ctp-editorial/07-stewardship-community-service.png',
    alt: 'Community volunteers serving families with dignity and care.',
    objectPosition: '48% 50%',
  },
  {
    theme: 'Growth',
    feeling: 'Momentum',
    thought: 'Growth can feel lighter when the organization is designed well.',
    image: '/images/ctp-editorial/08-growth-relaxed-service-team.png',
    alt: 'A relaxed and confident team serving customers smoothly.',
    objectPosition: '50% 50%',
  },
  {
    theme: 'Legacy',
    feeling: 'Legacy',
    thought: 'I am building something that can last beyond me.',
    image: '/images/ctp-editorial/09-legacy-founder-mentoring.png',
    alt: 'A founder mentoring future leaders in a warm courtyard.',
    objectPosition: '50% 50%',
  },
  {
    theme: 'Clarity',
    feeling: 'Understanding',
    thought: 'Now we can see where we are and where we can go.',
    image: '/images/ctp-editorial/10-clarity-blueprint-planning.png',
    alt: 'Blueprints, notebook, coffee, and architectural sketches in natural light.',
    objectPosition: '48% 52%',
  },
  {
    theme: 'Momentum',
    feeling: 'Momentum',
    thought: 'The next step is moving toward a future designed on purpose.',
    image: '/images/ctp-editorial/11-momentum-designed-future.png',
    alt: 'A diverse group of leaders walking confidently toward golden light.',
    objectPosition: '50% 50%',
  },
];

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

type ResultsState = {
  score: CtpExecutiveScore;
  proposalId?: string;
  saved?: boolean;
  status: 'creating' | 'ready' | 'received' | 'error';
  message?: string;
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
  const factoryOpportunity = normalizeFactoryOpportunity(searchParams.get('opportunity'));

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
  const [resultsState, setResultsState] = useState<ResultsState | null>(null);
  const [started, setStarted] = useState(false);

  const sections = useMemo(() => visibleSections(DISCOVERY_SCHEMA, answers), [answers]);
  const effectiveSectionIndex = Math.min(sectionIndex, Math.max(0, sections.length - 1));
  const section = sections[effectiveSectionIndex];
  const pages = useMemo(() => chunkQuestions(section?.questions ?? [], QUESTION_PAGE_SIZE), [section]);
  const effectivePageIndex = Math.min(pageIndex, Math.max(0, pages.length - 1));
  const questions = useMemo(() => pages[effectivePageIndex] ?? [], [effectivePageIndex, pages]);
  const totalQuestionPages = sections.reduce((sum, item) => sum + chunkQuestions(item.questions, QUESTION_PAGE_SIZE).length, 0);
  const currentQuestionPage = sections.slice(0, effectiveSectionIndex).reduce((sum, item) => sum + chunkQuestions(item.questions, QUESTION_PAGE_SIZE).length, 0) + effectivePageIndex + 1;
  const progress = reviewMode
    ? 100
    : Math.min(96, Math.max(5, Math.round((currentQuestionPage / Math.max(totalQuestionPages, 1)) * 94)));
  const recommendations = useMemo(() => buildDiscoveryRecommendations(answers), [answers]);
  const storyFrame = currentStoryFrame(currentQuestionPage, totalQuestionPages, reviewMode);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = readSavedState();
      setAnswers(saved.answers);
      setSectionIndex(saved.sectionIndex);
      setPageIndex(saved.pageIndex);
      setReviewMode(saved.reviewMode);
      setDraftToken(readDraftToken());
      setStarted(Boolean(Object.keys(saved.answers).length || saved.reviewMode));
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

  useEffect(() => {
    if (!factoryOpportunity) return;
    window.sessionStorage.setItem('ea:factory:opportunity', factoryOpportunity);
  }, [factoryOpportunity]);

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
      setPageIndex(Math.max(0, chunkQuestions(sections[Math.max(0, sections.length - 1)]?.questions ?? [], QUESTION_PAGE_SIZE).length - 1));
      return;
    }
    if (effectivePageIndex > 0) {
      setPageIndex((current) => current - 1);
      return;
    }
    if (effectiveSectionIndex > 0) {
      const previousSection = sections[effectiveSectionIndex - 1];
      setSectionIndex((current) => current - 1);
      setPageIndex(Math.max(0, chunkQuestions(previousSection.questions, QUESTION_PAGE_SIZE).length - 1));
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

    const executiveScore = buildCtpExecutiveScore(answers);
    setResultsState({ score: executiveScore, status: 'creating' });
    setLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const res = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...buildSubmissionPayload(answers, considerSlug, partnerSlug, factoryOpportunity),
          executiveScoring: executiveScore,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; proposalId?: string; ok?: boolean; saved?: boolean };
      if (!res.ok || data.error) {
        setResultsState({
          score: executiveScore,
          status: 'error',
          message: data.error ?? 'We could not create the blueprint yet. Your results are still available below.',
        });
        setLoading(false);
        return;
      }
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(DRAFT_TOKEN_KEY);
      setLoading(false);
      setResultsState({
        score: executiveScore,
        proposalId: data.proposalId,
        saved: data.saved,
        status: data.proposalId ? 'ready' : 'received',
        message: data.saved === false
          ? 'Your results are ready. The blueprint record needs manual follow-up, but the discovery was received.'
          : undefined,
      });
    } catch {
      setResultsState({
        score: executiveScore,
        status: 'error',
        message: 'Network error while preparing the blueprint. Your results are still available below.',
      });
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
    setResultsState(null);
    setStarted(false);
    setDraftToken(createDraftToken());
  }

  if (resultsState) {
    return (
      <CtpResultsPage
        state={resultsState}
        loading={loading}
        onBack={() => setResultsState(null)}
      />
    );
  }

  if (!started) {
    return (
      <main className="min-h-screen" style={{ backgroundColor: CREAM, color: BLACK }}>
        <EditorialHeader progress={0} label="Possibility" />
        <section className="mx-auto grid min-h-[calc(100vh-96px)] max-w-7xl items-center gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[1.03fr_0.97fr]">
          <EditorialImage frame={STORY_FRAMES[0]} priority />
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.34em]" style={{ color: GOLD }}>
              Consider The Possibilities™
            </p>
            <h1 className="mt-6 text-5xl font-black leading-[0.98] tracking-[-0.01em] sm:text-7xl">
              What if your organization gave you more life, not less?
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8" style={{ color: EARTH }}>
              A guided conversation about what your organization could become when it no longer depends on you for everything.
            </p>
            <button
              type="button"
              onClick={() => setStarted(true)}
              className="mt-8 rounded-full px-7 py-4 text-xs font-black uppercase tracking-[0.18em] text-black"
              style={{ background: `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})` }}
            >
              Begin The Conversation
            </button>
            <p className="mt-5 text-sm font-semibold" style={{ color: EARTH }}>
              No pressure. No guessing. Just clarity.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: CREAM, color: BLACK }}>
      <EditorialHeader progress={progress} label={reviewMode ? 'Clarity' : storyFrame.theme} />

      <section className="mx-auto grid min-h-[calc(100vh-96px)] max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[0.96fr_1.04fr]">
        <EditorialImage frame={storyFrame} />

        <div className="flex min-h-[560px] flex-col justify-center">
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
            <div>
              <div className="mb-8">
                <p className="text-xs font-black uppercase tracking-[0.26em]" style={{ color: GOLD }}>
                  {storyFrame.theme}
                </p>
                <p className="mt-3 max-w-xl text-sm font-semibold leading-7" style={{ color: EARTH }}>
                  {transitionLine(storyFrame.theme)}
                </p>
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
            </div>
          )}

          {error ? (
            <div className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={back}
              disabled={effectiveSectionIndex === 0 && effectivePageIndex === 0 && !reviewMode}
              className="rounded-full border px-5 py-3 text-xs font-black uppercase tracking-[0.16em] disabled:opacity-35"
              style={{ borderColor: 'rgba(10,10,10,0.15)', color: BLACK }}
            >
              Back
            </button>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={resetDraft}
                className="rounded-full border px-5 py-3 text-xs font-black uppercase tracking-[0.16em]"
                style={{ borderColor: 'rgba(10,10,10,0.15)', color: EARTH }}
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
                  {loading ? 'Preparing...' : "Show Me What's Possible"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={next}
                  className="rounded-full px-6 py-3 text-xs font-black uppercase tracking-[0.16em]"
                  style={{ backgroundColor: BLACK, color: CREAM }}
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function currentStoryFrame(currentQuestionPage: number, totalQuestionPages: number, reviewMode: boolean): StoryFrame {
  if (reviewMode) return STORY_FRAMES[9];
  const questionFrameCount = 9;
  const frameIndex = totalQuestionPages <= 1
    ? 0
    : Math.round(((currentQuestionPage - 1) / (totalQuestionPages - 1)) * (questionFrameCount - 1));
  return STORY_FRAMES[Math.min(questionFrameCount - 1, Math.max(0, frameIndex))] ?? STORY_FRAMES[0];
}

function transitionLine(theme: string) {
  const lines: Record<string, string> = {
    Possibility: 'Let us begin with the life and mission this organization is meant to support.',
    Purpose: 'Before we talk about tools, let us honor the work and the people you serve.',
    Presence: 'Now we will name where the work is asking too much of you.',
    Freedom: 'Imagine what could keep moving without your constant attention.',
    Calm: 'Freedom also shows up in quieter mornings and clearer decisions.',
    Capacity: 'A clearer organization helps the people around you carry more with confidence.',
    Stewardship: 'When the work is clearer, the people you serve feel it.',
    Growth: 'Now let us imagine growth without added strain.',
    Legacy: 'The deeper question is what this can become beyond today.',
    Clarity: 'Here is where reflection becomes a practical next step.',
  };
  return lines[theme] ?? 'Let us keep shaping what becomes possible.';
}

function EditorialHeader({ progress, label }: { progress: number; label: string }) {
  return (
    <header className="border-b" style={{ borderColor: 'rgba(10,10,10,0.08)', backgroundColor: 'rgba(245,241,232,0.88)' }}>
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" aria-label="Efficiency Architects home" className="shrink-0">
          <img src="/images/ea-logo-premium.png" alt="Efficiency Architects" className="h-16 w-auto rounded-sm object-contain" />
        </Link>
        <div className="min-w-0 flex-1 text-right">
          <p className="text-xs font-black uppercase tracking-[0.28em]" style={{ color: GOLD }}>
            {label}
          </p>
          <div className="ml-auto mt-3 h-[3px] max-w-sm overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(10,10,10,0.12)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: BLACK }} />
          </div>
        </div>
      </div>
    </header>
  );
}

function EditorialImage({ frame, priority = false }: { frame: StoryFrame; priority?: boolean }) {
  return (
    <figure className="relative min-h-[320px] overflow-hidden rounded-[2rem] border shadow-[0_22px_70px_rgba(49,39,25,0.18)] lg:min-h-[620px]" style={{ borderColor: 'rgba(10,10,10,0.08)', backgroundColor: PAPER }}>
      <img
        src={frame.image}
        alt={frame.alt}
        loading={priority ? 'eager' : 'lazy'}
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
        style={{ objectPosition: frame.objectPosition }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/12 to-transparent" />
      <figcaption className="absolute bottom-0 left-0 right-0 p-6 text-white sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.28em]" style={{ color: GOLD_BRIGHT }}>
          {frame.feeling}
        </p>
        <p className="mt-3 max-w-md text-2xl font-black leading-tight">
          {frame.thought}
        </p>
      </figcaption>
    </figure>
  );
}

function consultingQuestion(question: DiscoveryQuestion) {
  const copy: Record<string, { question: string; helper: string }> = {
    organization_name: {
      question: 'What organization are we imagining a better future for today?',
      helper: 'Start with the name of the business, ministry, school, nonprofit, team, or community you are building.',
    },
    contact_name: {
      question: 'Who do I have the honor of walking through this with?',
      helper: 'This helps us make the blueprint feel personal, not generic.',
    },
    contact_email: {
      question: 'Where should we send the blueprint when it is ready?',
      helper: 'Your answers and recommendations stay connected to this email.',
    },
    organization_type: {
      question: 'What kind of mission does your organization carry?',
      helper: 'Every organization serves people differently. This helps the conversation fit your world.',
    },
    team_size: {
      question: 'How many people are carrying the work with you?',
      helper: 'This helps us understand the capacity around the mission today.',
    },
    mission: {
      question: 'What should never get lost as this organization grows?',
      helper: 'Choose anything that feels true, then add your own words if something matters more.',
    },
    business_path: {
      question: 'What would give the business more room to breathe?',
      helper: 'Choose the changes that would create the most relief or momentum right now.',
    },
    nonprofit_path: {
      question: 'What would help your nonprofit serve with more reach and less strain?',
      helper: 'Choose the changes that would strengthen trust, service, and follow-through.',
    },
    church_path: {
      question: 'What would help your ministry care for people with more clarity?',
      helper: 'Choose the areas where members, visitors, volunteers, or leaders need a clearer path.',
    },
    school_path: {
      question: 'What would help your education community feel more supported?',
      helper: 'Choose the areas that would make learning, communication, or enrollment feel smoother.',
    },
    sports_path: {
      question: 'What would help your athletes, families, or coaches move with more confidence?',
      helper: 'Choose the areas where visibility, communication, or support would matter most.',
    },
    creator_path: {
      question: 'What would help your audience experience your work more clearly?',
      helper: 'Choose the areas that would make your offer, content, or community easier to trust and act on.',
    },
    public_sector_path: {
      question: 'What would help people access your services with more confidence?',
      helper: 'Choose the areas where clarity, requests, resources, or reporting would better serve the public.',
    },
    desired_experiences: {
      question: 'What would you love your organization to make easier?',
      helper: 'Choose the experiences that would create more time, trust, service, or momentum.',
    },
    goal_notes: {
      question: 'What future are you quietly hoping this makes possible?',
      helper: 'Use the prompts or your own words. This is where the practical work connects to the deeper goal.',
    },
    training_needs: {
      question: 'Where would better guidance help people feel more confident?',
      helper: 'Think about your team, clients, members, volunteers, students, or audience.',
    },
    top_priorities: {
      question: 'What would feel most valuable to improve first?',
      helper: 'A strong first step should create relief quickly and build confidence for what comes next.',
    },
    success_definition: {
      question: 'What would make this feel like a meaningful win?',
      helper: 'Choose the outcome that would make the biggest difference in daily life or service.',
    },
    revenue_range: {
      question: 'What size is the organization right now?',
      helper: 'This helps us recommend a first step that fits the season you are actually in.',
    },
    current_systems: {
      question: 'Where does your team spend energy that could be better spent serving your mission?',
      helper: 'Choose anything that currently holds important work, information, communication, or follow-up.',
    },
    current_experience_state: {
      question: 'What should feel easier for the people you serve?',
      helper: 'Think about the client, member, student, family, visitor, athlete, donor, or customer experience.',
    },
    current_url: {
      question: 'Is there a current page or place we should understand before we build forward?',
      helper: 'A link can help us preserve what already works.',
    },
    operational_challenges: {
      question: 'Where does the work feel heavier than it should?',
      helper: 'Choose the places where a better-designed organization would create relief.',
    },
    repeated_work: {
      question: 'What keeps pulling attention away from higher-value work?',
      helper: 'Choose the repeated moments that could become easier, calmer, or more automatic.',
    },
    mistake_points: {
      question: 'Where would people benefit from clearer support?',
      helper: 'Choose the moments where reminders, instructions, or visibility would help people move well.',
    },
    connect_goal: {
      question: 'What should people feel invited to do when they discover you?',
      helper: 'A strong public profile helps people trust the next step.',
    },
    connect_audience: {
      question: 'Who should feel seen when they encounter your profile?',
      helper: 'This shapes language, proof, and calls to action around real people.',
    },
    connect_content: {
      question: 'What would help people trust the next step?',
      helper: 'Choose the pieces that make the experience feel credible and useful.',
    },
    landing_goal: {
      question: 'What should the page help people confidently do?',
      helper: 'The clearest pages make one important action feel natural.',
    },
    landing_audience: {
      question: 'Who needs to feel understood before they act?',
      helper: 'Knowing the audience shapes the message, proof, and invitation.',
    },
    trust_builders: {
      question: 'What proof would help people feel safe saying yes?',
      helper: 'Choose what can make the story specific, credible, and human.',
    },
    portal_users: {
      question: 'Who deserves a clearer private experience?',
      helper: 'This helps us understand who needs access, resources, updates, and next steps.',
    },
    portal_modules: {
      question: 'What should become easier inside that private experience?',
      helper: 'Choose what would reduce confusion and help people move with confidence.',
    },
    permission_complexity: {
      question: 'How personal should the experience feel?',
      helper: 'This helps us keep the first version useful without overbuilding.',
    },
    asset_types: {
      question: 'What do you already have that helps tell the story well?',
      helper: 'Choose what exists. Uploads appear only for what you select.',
    },
    brand_feel: {
      question: 'How should people feel as they move through this experience?',
      helper: 'This guides the emotional tone without needing design jargon.',
    },
    future_limitless: {
      question: 'If the organization operated with more freedom, what would you want it to become?',
      helper: 'Think beyond the first build. This is about the future the system should support.',
    },
    ai_247: {
      question: 'If support were always available, what would you want it to help with?',
      helper: 'This reveals future guidance, service, training, and intelligence opportunities.',
    },
    anything_else: {
      question: 'What else should we understand before we shape the blueprint?',
      helper: 'Add anything about timing, hopes, constraints, people, or the future you want to protect.',
    },
  };
  return copy[question.id] ?? { question: question.question, helper: question.helper };
}

function displayChoiceLabel(choice: { id: string; label: string }) {
  const labels: Record<string, string> = {
    'manual_data_entry': 'Information gets entered more than once',
    'disconnected_systems': 'Important work lives in too many places',
    'no_centralized_reporting': 'It is hard to see what is happening',
    'manual_scheduling': 'Scheduling takes more attention than it should',
    'inconsistent_follow_up': 'Follow-up depends too much on memory',
    'no_sops': 'People need clearer guidance to repeat good work',
    'copying-data': 'Information has to be moved by hand',
    'sending-reminders': 'Reminders take too much mental space',
    'creating-reports': 'Updates take too long to prepare',
    'track-progress': 'People need to see progress more clearly',
    'receive-updates': 'People need clearer updates',
    'find-next-step': 'People need to know the next step',
    'less-admin': 'Less daily admin weight',
    'client-portal': 'A calmer client experience',
    'reduce-admin': 'Less administrative drag',
    'increase-visibility': 'Clearer leadership visibility',
    'less-manual-work': 'Less manual work for our team',
    'portal': 'A private place people can trust',
    'automation': 'Less repeated work',
    'landing-page': 'A clearer path for people to say yes',
  };
  return labels[choice.id] ?? choice.label;
}

function scoreTone(score: number) {
  if (score >= 80) return '#86EFAC';
  if (score >= 60) return GOLD_BRIGHT;
  if (score >= 40) return '#FDBA74';
  return '#FCA5A5';
}

function confidenceTone(confidence: CtpAreaScore['confidence']) {
  if (confidence === 'High') return '#86EFAC';
  if (confidence === 'Medium') return GOLD_BRIGHT;
  return '#FCA5A5';
}

function ConfidenceBadge({ confidence }: { confidence: CtpAreaScore['confidence'] }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em]"
      style={{
        borderColor: `${confidenceTone(confidence)}66`,
        color: confidenceTone(confidence),
        backgroundColor: `${confidenceTone(confidence)}14`,
      }}
    >
      {confidence} Confidence
    </span>
  );
}

function CtpResultsPage({
  state,
  loading,
  onBack,
}: {
  state: ResultsState;
  loading: boolean;
  onBack: () => void;
}) {
  const score = state.score;
  const areaScores = [
    score.areaScores.capacity,
    score.areaScores.visibility,
    score.areaScores.timeLeakage,
    score.areaScores.growthReadiness,
  ];
  const blueprintHref = state.proposalId
    ? `/proposal/${encodeURIComponent(state.proposalId)}`
    : state.status === 'received'
      ? '/discover/thank-you?received=1'
      : undefined;
  const clarityFrame = STORY_FRAMES[9];
  const momentumFrame = STORY_FRAMES[10];
  const primaryImprovements = score.prioritizedNextSteps.slice(0, 3);

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: CREAM, color: BLACK }}
    >
      <header className="border-b" style={{ borderColor: 'rgba(10,10,10,0.08)', backgroundColor: 'rgba(245,241,232,0.9)' }}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-5 py-5 sm:px-8">
          <Link href="/" aria-label="Efficiency Architects home" className="shrink-0">
            <img src="/images/ea-logo-premium.png" alt="Efficiency Architects" className="h-16 w-auto rounded-sm object-contain" />
          </Link>
          <div className="text-right">
            <p className="text-xs font-black uppercase tracking-[0.24em]" style={{ color: GOLD }}>
              Clarity
            </p>
            <p className="mt-1 text-sm font-semibold" style={{ color: EARTH }}>
              Your blueprint is {state.status === 'creating' ? 'being prepared' : state.proposalId ? 'ready' : 'queued'}.
            </p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <figure className="overflow-hidden border bg-white shadow-[0_28px_80px_rgba(10,10,10,0.1)]" style={{ borderColor: 'rgba(10,10,10,0.1)' }}>
            <img
              src={clarityFrame.image}
              alt={clarityFrame.alt}
              className="h-[420px] w-full object-cover sm:h-[520px]"
              style={{ objectPosition: clarityFrame.objectPosition }}
            />
            <figcaption className="border-t px-6 py-5" style={{ borderColor: 'rgba(10,10,10,0.08)', backgroundColor: PAPER }}>
              <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: GOLD }}>
                {clarityFrame.theme}
              </p>
              <p className="mt-2 text-sm font-semibold leading-6" style={{ color: EARTH }}>
                {clarityFrame.thought}
              </p>
            </figcaption>
          </figure>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em]" style={{ color: GOLD }}>
              Consider The Possibilities™
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[0.95] sm:text-6xl lg:text-7xl" style={{ color: BLACK }}>
              Here&apos;s what we discovered together.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-semibold leading-9" style={{ color: EARTH }}>
              You named the future you want, the friction that is getting in the way, and the kind of operating rhythm that would give the mission more room to breathe.
            </p>

            <article className="mt-10 border-t pt-8" style={{ borderColor: 'rgba(10,10,10,0.12)' }}>
              <p className="text-xs font-black uppercase tracking-[0.24em]" style={{ color: GOLD }}>
                Biggest Opportunity
              </p>
              <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl" style={{ color: BLACK }}>
                {score.biggestOpportunity}
              </h2>
              <p className="mt-5 max-w-2xl text-base font-semibold leading-8" style={{ color: EARTH }}>
                The next move should create immediate clarity and reduce the weight that showed up most strongly in your answers.
              </p>
            </article>
          </div>
        </div>

        {state.message ? (
          <div className="mt-6 border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-900">
            {state.message}
          </div>
        ) : null}

        <div className="mt-10 grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
          <article className="border p-7 shadow-[0_22px_70px_rgba(10,10,10,0.08)]" style={{ backgroundColor: PAPER, borderColor: 'rgba(216,173,61,0.26)' }}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em]" style={{ color: GOLD }}>
                  Operational Health Score™
                </p>
                <p className="mt-4 text-7xl font-black leading-none" style={{ color: scoreTone(score.operationalHealthScore) }}>
                  {score.operationalHealthScore}
                </p>
                <p className="mt-2 text-xs font-black uppercase tracking-[0.18em]" style={{ color: EARTH }}>
                  out of 100
                </p>
              </div>
              <ConfidenceBadge confidence={score.confidence} />
            </div>
            <h2 className="mt-7 text-3xl font-black leading-tight" style={{ color: BLACK }}>
              {score.verdict}
            </h2>
            <p className="mt-4 text-sm font-semibold leading-7" style={{ color: EARTH }}>
              {score.why}
            </p>
            <div className="mt-6 grid gap-4 border-t pt-5 sm:grid-cols-2" style={{ borderColor: 'rgba(10,10,10,0.1)' }}>
              <ScoreExplanationBlock
                title="Why This Score"
                items={[
                  `Capacity: ${score.areaScores.capacity.score}`,
                  `Visibility: ${score.areaScores.visibility.score}`,
                  `Time Leakage: ${score.areaScores.timeLeakage.score}`,
                  `Growth Readiness: ${score.areaScores.growthReadiness.score}`,
                ]}
              />
              <ScoreExplanationBlock
                title="What Would Improve It"
                items={primaryImprovements.length ? primaryImprovements : ['Collect more operating evidence so the next recommendation can become sharper.']}
              />
            </div>
          </article>

          <div className="grid gap-5 md:grid-cols-2">
            <NarrativeListCard title="What's Working" items={score.whatsWorking} accent={GOLD} />
            <NarrativeListCard title="What's Holding You Back" items={score.whatsHoldingYouBack} accent="#9A3412" />
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="border p-7 text-black shadow-[0_22px_70px_rgba(10,10,10,0.08)]" style={{ background: `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})`, borderColor: 'rgba(10,10,10,0.08)' }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-black/60">
                Opportunity Estimate
              </p>
              <ConfidenceBadge confidence={score.opportunityEstimate.confidence} />
            </div>
            <h2 className="mt-5 text-3xl font-black leading-tight">
              {score.opportunityEstimate.label}
            </h2>
            <p className="mt-4 text-sm font-bold leading-7 text-black/68">
              {score.opportunityEstimate.detail}
            </p>
            <div className="mt-6 grid gap-4 border-t border-black/15 pt-5 sm:grid-cols-2">
              <ScoreExplanationBlock
                title="Why This Estimate"
                items={[
                  score.opportunityEstimate.detail,
                  `${score.biggestOpportunity}`,
                ]}
                darkText
              />
              <ScoreExplanationBlock
                title="What Would Improve It"
                items={primaryImprovements.length ? primaryImprovements : ['Clarify the highest-friction workflow and the people affected by it.']}
                darkText
              />
            </div>
          </article>

          <article className="overflow-hidden border shadow-[0_22px_70px_rgba(10,10,10,0.08)]" style={{ backgroundColor: BLACK, borderColor: 'rgba(216,173,61,0.28)' }}>
            <div className="grid min-h-full md:grid-cols-[0.94fr_1.06fr]">
              <figure className="relative min-h-[240px]">
                <img
                  src={momentumFrame.image}
                  alt={momentumFrame.alt}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: momentumFrame.objectPosition }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/58 via-black/8 to-transparent md:bg-gradient-to-r" />
                <figcaption className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.24em]" style={{ color: GOLD_BRIGHT }}>
                    {momentumFrame.theme}
                  </p>
                </figcaption>
              </figure>
              <div className="p-7">
                <p className="text-xs font-black uppercase tracking-[0.24em]" style={{ color: GOLD_BRIGHT }}>
                  Recommended Starting Point
                </p>
                <h2 className="mt-4 text-4xl font-black leading-tight text-white">
                  {score.recommendedStartingPoint}
                </h2>
                <p className="mt-4 text-sm font-semibold leading-7 text-white/62">
                  {momentumFrame.thought}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
              {blueprintHref ? (
                <Link
                  href={blueprintHref}
                  className="inline-flex items-center justify-center rounded-full px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-black"
                  style={{ background: `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})` }}
                >
                  See My Strategic Blueprint
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center rounded-full px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-black opacity-70"
                  style={{ background: `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})` }}
                >
                  {loading || state.status === 'creating' ? 'Preparing Your Blueprint...' : 'Blueprint Being Prepared'}
                </button>
              )}
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-white/75"
              >
                Review Answers
              </button>
                </div>
              </div>
            </div>
          </article>
        </div>

        <article className="mt-6 border p-7 shadow-[0_22px_70px_rgba(10,10,10,0.08)]" style={{ backgroundColor: PAPER, borderColor: 'rgba(10,10,10,0.1)' }}>
          <p className="text-xs font-black uppercase tracking-[0.24em]" style={{ color: GOLD }}>
            Top 5 Prioritized Next Steps
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {score.prioritizedNextSteps.map((step, index) => (
              <div key={step} className="border bg-white/60 p-5" style={{ borderColor: 'rgba(10,10,10,0.08)' }}>
                <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: GOLD_BRIGHT }}>
                  0{index + 1}
                </p>
                <p className="mt-3 text-sm font-semibold leading-7" style={{ color: EARTH }}>
                  {step}
                </p>
              </div>
            ))}
          </div>
        </article>

        <section className="mt-6">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.24em]" style={{ color: GOLD }}>
            Detailed Area Scores
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {areaScores.map((area) => (
              <AreaScoreCard key={area.label} area={area} />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function ScoreExplanationBlock({ title, items, darkText = false }: { title: string; items: string[]; darkText?: boolean }) {
  return (
    <div>
      <p
        className="text-[11px] font-black uppercase tracking-[0.18em]"
        style={{ color: darkText ? 'rgba(0,0,0,0.58)' : 'rgba(94,81,65,0.7)' }}
      >
        {title}
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="text-xs font-semibold leading-5"
            style={{ color: darkText ? 'rgba(0,0,0,0.68)' : EARTH }}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function NarrativeListCard({ title, items, accent }: { title: string; items: string[]; accent: string }) {
  return (
    <article className="border p-6 shadow-[0_18px_60px_rgba(10,10,10,0.06)]" style={{ backgroundColor: PAPER, borderColor: 'rgba(10,10,10,0.1)' }}>
      <p className="text-xs font-black uppercase tracking-[0.24em]" style={{ color: GOLD }}>
        {title}
      </p>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item} className="border-l-4 pl-4 text-sm font-semibold leading-7" style={{ borderColor: accent, color: EARTH }}>
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}

function AreaScoreCard({ area }: { area: CtpAreaScore }) {
  return (
    <article className="border p-6 shadow-[0_18px_60px_rgba(10,10,10,0.06)]" style={{ backgroundColor: PAPER, borderColor: 'rgba(10,10,10,0.1)' }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em]" style={{ color: GOLD }}>
            {area.label}
          </p>
          <p className="mt-3 text-4xl font-black" style={{ color: scoreTone(area.score) }}>
            {area.score}
          </p>
        </div>
        <ConfidenceBadge confidence={area.confidence} />
      </div>
      <p className="mt-4 text-sm font-semibold leading-7" style={{ color: EARTH }}>
        {area.why}
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: 'rgba(94,81,65,0.7)' }}>
            Why This Score
          </p>
          <ul className="mt-3 space-y-2">
            {area.evidence.map((item) => (
              <li key={item} className="text-xs font-semibold leading-5" style={{ color: EARTH }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: 'rgba(94,81,65,0.7)' }}>
            What Would Improve It
          </p>
          <ul className="mt-3 space-y-2">
            {area.improve.length ? area.improve.map((item) => (
              <li key={item} className="text-xs font-semibold leading-5" style={{ color: EARTH }}>
                {item}
              </li>
            )) : (
              <li className="text-xs font-semibold leading-5" style={{ color: EARTH }}>
                Keep strengthening the operating rhythm that is already working.
              </li>
            )}
          </ul>
        </div>
      </div>
    </article>
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
  const copy = consultingQuestion(question);
  return (
    <article className="border-y py-8 sm:py-10" style={{ borderColor: 'rgba(10,10,10,0.12)' }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.24em]" style={{ color: GOLD }}>
            {isMulti ? 'Choose what feels true' : question.required ? 'A thoughtful step' : 'Optional reflection'}
          </p>
          <h3 className="mt-4 text-4xl font-black leading-[1.05] tracking-[-0.01em] sm:text-5xl" style={{ color: BLACK }}>
            {copy.question}
          </h3>
        </div>
        <button
          type="button"
          onClick={onHelp}
          className="rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.14em]"
          style={{ borderColor: 'rgba(10,10,10,0.14)', color: EARTH }}
        >
          Guide Me
        </button>
      </div>
      <p className="mt-5 max-w-2xl text-base font-semibold leading-8" style={{ color: EARTH }}>{copy.helper}</p>
      {!question.required ? (
        <p className="mt-2 text-xs font-semibold leading-5" style={{ color: 'rgba(94,81,65,0.72)' }}>
          Use only what helps the conversation.
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
        className="w-full border-0 border-b bg-transparent px-0 py-4 text-xl font-semibold outline-none placeholder:text-black/30"
        style={{ borderBottom: '1px solid rgba(10,10,10,0.22)', color: BLACK }}
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
        className="min-h-32 w-full rounded-3xl border bg-white/45 px-5 py-4 text-base font-semibold leading-7 outline-none placeholder:text-black/30"
        style={{ borderColor: 'rgba(10,10,10,0.14)', color: BLACK }}
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
        <p className="mb-3 text-xs font-black uppercase tracking-[0.14em]" style={{ color: GOLD }}>
          Choose anything that belongs in the conversation
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
                className="min-h-16 rounded-3xl border p-4 text-left transition-all hover:-translate-y-0.5"
                style={{
                  borderColor: active ? GOLD : 'rgba(10,10,10,0.12)',
                  backgroundColor: active ? 'rgba(216,173,61,0.18)' : 'rgba(255,255,255,0.45)',
                  boxShadow: active ? '0 0 28px rgba(216,173,61,0.16)' : undefined,
                }}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="block text-sm font-black" style={{ color: BLACK }}>{displayChoiceLabel(choice)}</span>
                  <span
                    className="grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] font-black"
                    style={{ borderColor: active ? GOLD : 'rgba(10,10,10,0.22)', color: active ? BLACK : 'transparent' }}
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
          className="mt-4 min-h-32 w-full rounded-3xl border bg-white/45 px-5 py-4 text-base font-semibold leading-7 outline-none placeholder:text-black/30"
          style={{ borderColor: 'rgba(216,173,61,0.35)', color: BLACK }}
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
          Choose what feels true{question.maxSelections ? `, up to ${question.maxSelections}` : ''}
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
              className="min-h-24 rounded-3xl border p-5 text-left transition-all hover:-translate-y-0.5"
              style={{
                borderColor: active ? GOLD : 'rgba(10,10,10,0.12)',
                backgroundColor: active ? 'rgba(216,173,61,0.18)' : 'rgba(255,255,255,0.45)',
                boxShadow: active ? '0 0 28px rgba(216,173,61,0.16)' : undefined,
              }}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="block text-sm font-black" style={{ color: BLACK }}>
                  {displayChoiceLabel(choice)}
                </span>
                <span
                  className="grid h-5 w-5 shrink-0 place-items-center border text-[10px] font-black"
                  style={{ borderColor: active ? GOLD : 'rgba(10,10,10,0.24)', color: active ? BLACK : 'transparent' }}
                >
                  &#10003;
                </span>
              </span>
              {choice.description ? <span className="mt-2 block text-xs font-semibold leading-5" style={{ color: 'rgba(94,81,65,0.72)' }}>{choice.description}</span> : null}
            </button>
          );
        })}
      </div>
      {question.type === 'asset-select' && selected.length ? (
        <div className="mt-4 space-y-3 rounded-3xl border border-dashed p-4" style={{ borderColor: 'rgba(216,173,61,0.35)', backgroundColor: 'rgba(255,255,255,0.4)' }}>
          {selected.map((asset) => {
            const uploaded = assetUploads[asset];
            const busy = uploadingAsset === asset;
            return (
              <label key={asset} className="block text-sm font-semibold" style={{ color: EARTH }}>
                {assetLabel(question, asset)}
                <input
                  type="file"
                  accept={assetAcceptHint(asset)}
                  className="mt-2 block w-full rounded-xl border bg-white/70 p-2 text-xs"
                  style={{ borderColor: 'rgba(10,10,10,0.12)', color: EARTH }}
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
                  <span className="mt-2 block text-xs" style={{ color: 'rgba(94,81,65,0.68)' }}>Optional, up to 2MB</span>
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
      <div className="border-b pb-6" style={{ borderColor: 'rgba(10,10,10,0.12)' }}>
        <p className="text-xs font-black uppercase tracking-[0.24em]" style={{ color: GOLD }}>
          Reflect On What We&apos;ve Discovered
        </p>
        <h2 className="mt-3 text-5xl font-black leading-tight" style={{ color: BLACK }}>
          Here is the shape of the conversation.
        </h2>
        <p className="mt-4 max-w-2xl text-base font-semibold leading-8" style={{ color: EARTH }}>
          Take a breath and make sure this reflects the organization you are trying to build. Then we will turn it into clarity.
        </p>
      </div>

      <div className="grid gap-4">
        {sections.map((section) => {
          const answered = section.questions
            .map((question) => ({ question, value: answerLabel(question, answers[question.id]) }))
            .filter((item) => item.value);
          if (!answered.length) return null;
          return (
            <article key={section.id} className="rounded-3xl border p-5" style={{ backgroundColor: 'rgba(255,255,255,0.48)', borderColor: 'rgba(10,10,10,0.1)' }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-black" style={{ color: BLACK }}>
                  {section.title}
                </h3>
                <button
                  type="button"
                  onClick={() => onEdit(section.id)}
                  className="rounded-full border px-3 py-2 text-xs font-black uppercase tracking-[0.14em]"
                  style={{ borderColor: 'rgba(10,10,10,0.14)', color: EARTH }}
                >
                  Edit
                </button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {answered.map((item) => (
                  <div key={item.question.id} className="rounded-2xl border bg-white/60 p-4" style={{ borderColor: 'rgba(10,10,10,0.08)' }}>
                    <p className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: 'rgba(94,81,65,0.7)' }}>
                      {consultingQuestion(item.question).question}
                    </p>
                    <p className="mt-2 text-sm font-bold leading-6" style={{ color: BLACK }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <article className="rounded-3xl border p-6" style={{ backgroundColor: PAPER, borderColor: 'rgba(216,173,61,0.28)' }}>
        <p className="text-xs font-black uppercase tracking-[0.24em]" style={{ color: GOLD }}>
          What is starting to emerge
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {recommendations.map((item) => (
            <p key={item} className="border bg-white/60 p-4 text-sm font-semibold leading-6" style={{ borderColor: 'rgba(10,10,10,0.08)', color: EARTH }}>
              {item}
            </p>
          ))}
        </div>
      </article>
      <div className="rounded-3xl border p-8 text-center" style={{ backgroundColor: BLACK, borderColor: 'rgba(216,173,61,0.28)' }}>
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

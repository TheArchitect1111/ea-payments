'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  EA_GUIDE_DAILY_BRIEF_KEY,
  EA_GUIDE_FIRST_USE_KEY,
  EA_GUIDE_MEMORY_KEY,
  type EAGuideAction,
  type EAGuideMemoryItem,
  resolveGuideContext,
} from '@/lib/ea-guide';
import {
  getCaptureCount,
  shouldShowGuideRecommendations,
} from '@/lib/simplifi-onboarding';
import './ea-guide.css';

type LaunchSignal = {
  launchId: string;
  client: string;
  message: string;
  status: string;
  statusLabel: string;
  updatedAt: string;
  links: {
    reviewPackage: string;
    projectBrief: string;
    skinBrief: string;
    approval: string;
    codexBuilder: string;
    deployment: string;
  };
};

type PageContext = {
  lead: string;
  actions: string[];
};

type StorySectionSignal = {
  id: string;
  title: string;
  message: string;
  example: string;
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

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function inferFirstName() {
  if (typeof document === 'undefined') return 'there';
  const match = document.cookie.match(/(?:^|;\s*)ea_portal_first=([^;]+)/);
  if (match?.[1]) return decodeURIComponent(match[1]);
  return 'there';
}

function simplifiPageContext(): PageContext | null {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname;
  const path = window.location.pathname;
  if (host.includes('linkedin')) {
    return {
      lead: "Looks like you're reviewing a potential connection.",
      actions: ['Save Profile', 'Add To Watch List', 'Create Follow-Up', 'Generate Magnifi Report'],
    };
  }
  if (path.includes('cpr') || host.includes('cpr') || host.includes('recruit')) {
    return {
      lead: "Looks like you're viewing an athlete profile.",
      actions: ['Save Athlete', 'Track Recruiting Progress', 'Add To Watch List', 'Create Family Profile'],
    };
  }
  if (host.includes('zillow') || host.includes('realtor') || host.includes('redfin')) {
    return {
      lead: "Looks like you're reviewing a property.",
      actions: ['Save Property', 'Compare Properties', 'Set Reminder'],
    };
  }
  if (path.includes('event') || host.includes('eventbrite') || host.includes('conference')) {
    return {
      lead: "Looks like you're researching an event.",
      actions: ['Save Event', 'Track Registration', 'Create Follow-Up'],
    };
  }
  return null;
}

function discoverGuidePoints(signal: DiscoverGuideSignal | null) {
  if (!signal) {
    return [
      "Together we'll discover what is possible for your organization.",
      'I will explain why I am asking and what each answer unlocks.',
      'I am building your Blueprint while we talk.',
    ];
  }
  if (signal.reviewMode) {
    return [
      'Take a final look before anything is submitted.',
      'Edit any section that does not feel true to where you want to go.',
      'I now have enough information to begin shaping your Possibilities Blueprint.',
    ];
  }
  if (signal.id === 'organization_type') {
    return [
      'This choice helps me guide you through the right path.',
      'A business, nonprofit, church, school, sports organization, creator, or public team should not get the same journey.',
      'Choose the closest fit. I will refine the nuance as we go.',
    ];
  }
  if (signal.id === 'desired_experiences') {
    return [
      'Choose everything that could help you reach the goal.',
      'A landing page, Connect profile, portal, automation, and training can be combined.',
      'These choices tell me which possibilities are worth exploring first.',
    ];
  }
  if (signal.id === 'training_needs') {
    return [
      'Training can mean team onboarding, client education, lessons, process guides, resource libraries, or AI-guided help.',
      'Choose anything that would make knowledge easier to share or repeat.',
      'I will also look for existing materials we can turn into a better guided experience.',
    ];
  }
  if (signal.type === 'multi-text') {
    return [
      'The checkboxes are here to spark ideas.',
      'Use the text box only if your answer needs more nuance.',
      'Optional context helps the Blueprint feel more specific without turning this into paperwork.',
    ];
  }
  if (signal.type === 'multi' || signal.type === 'asset-select') {
    return [
      'Select every option that feels useful.',
      'There is no need to force a single answer if several possibilities fit.',
      'I will use the pattern of choices to recommend a practical first step.',
    ];
  }
  return [
    signal.required ? 'I need this so I can connect everything we build to your organization.' : 'This is optional, so use it only if it helps.',
    'Plain language is perfect here.',
    'The goal is clarity, not a perfect answer.',
  ];
}

function discoverWhyPoints(signal: DiscoverGuideSignal | null) {
  if (!signal) {
    return [
      'This discovery experience is meant to guide you toward useful possibilities.',
      'The prompts help us recommend the right first version.',
      'You stay in control of what feels relevant.',
    ];
  }
  if (signal.reviewMode) {
    return [
      'This final review prevents assumptions from becoming recommendations.',
      'Your selections become the starting point for the Possibilities Blueprint.',
      'Clear choices now create a clearer first conversation.',
    ];
  }
  if (signal.id.includes('landing')) {
    return [
      'Landing pages work best when one audience, one promise, and one action are clear.',
      'This helps us shape the message, proof, and call to action.',
      'The result should help people feel confident taking the next step.',
    ];
  }
  if (signal.id.includes('portal')) {
    return [
      'Portal choices shape permissions, resources, communication, and support.',
      'We are looking for the smallest useful portal, not the biggest possible one.',
      'The best version should make life easier for the people using it.',
    ];
  }
  if (signal.id.includes('training') || signal.selectedLabels.some((label) => label.toLowerCase().includes('training'))) {
    return [
      'Training solutions help people learn, adopt, and repeat the right process.',
      'This can support staff, clients, members, families, volunteers, or students.',
      'Good training reduces repeated explanation and protects consistency.',
    ];
  }
  if (signal.id.includes('connect')) {
    return [
      'Connect profiles create a focused place for trust, credibility, and next steps.',
      'This helps us decide what the profile should make easy.',
      'A clear profile can support outreach without needing a full portal.',
    ];
  }
  return [
    'This helps me understand where you want to go.',
    'Your answer shapes which possibilities are worth exploring first.',
    'The better the fit, the more useful the Blueprint becomes.',
  ];
}

function discoverQuestionLead(signal: DiscoverGuideSignal | null) {
  if (!signal) return "I'd love to learn about your organization.";
  if (signal.reviewMode) return "Let's review the direction before I build from it.";
  if (signal.id === 'organization_name') return "I'd love to learn about your organization.";
  if (signal.id === 'contact_name') return "I'd like to know who I have the honor of guiding.";
  if (signal.id === 'contact_email') return 'Where should I send the Blueprint when it is ready?';
  if (signal.id === 'organization_type') return 'What kind of organization are we guiding forward?';
  if (signal.id === 'desired_experiences') return 'Now we can explore what you want to make possible.';
  if (signal.id === 'training_needs') return 'Let me check whether training could create value here.';
  if (signal.id.includes('landing')) return 'Let us shape what the page should help people do.';
  if (signal.id.includes('portal')) return 'Let us shape who the portal should serve and what it should make easier.';
  if (signal.id.includes('connect')) return 'Let us shape the profile people can trust and act on.';
  return signal.question;
}

function organizationGuidance(signal: DiscoverGuideSignal | null) {
  switch (signal?.organizationType) {
    case 'business':
      return 'For a business, I am watching for capacity, client experience, revenue flow, and repetitive work.';
    case 'church':
      return 'For a church or ministry, I am watching for engagement, volunteers, giving, events, care, and communication.';
    case 'school':
      return 'For an education path, I am watching for families, learning resources, communication, and support.';
    case 'sports':
      return 'For a sports organization, I am watching for athletes, parents, recruiting, scheduling, and coaching resources.';
    case 'nonprofit':
      return 'For a nonprofit, I am watching for volunteers, donors, board communication, programs, and trust.';
    case 'creator':
      return 'For a creator or expert, I am watching for offers, audience growth, learning paths, and delivery.';
    case 'public-sector':
      return 'For public service, I am watching for access, clarity, staff workflow, updates, and resident experience.';
    default:
      return 'As I learn more, I will adjust the recommendations to fit your organization.';
  }
}

function discoverObservation(signal: DiscoverGuideSignal | null) {
  const labels = signal?.selectedLabels.join(' ').toLowerCase() ?? '';
  if (labels.includes('communication') || labels.includes('updates') || labels.includes('reminders')) {
    return 'I noticed communication may be an important part of the opportunity.';
  }
  if (labels.includes('volunteer')) return 'I noticed volunteers may be central to the experience.';
  if (labels.includes('families') || labels.includes('parents')) return 'I noticed family engagement may matter here.';
  if (labels.includes('admin') || labels.includes('manual') || labels.includes('automatic') || labels.includes('automation')) {
    return 'I noticed you may be trying to reclaim administrative time.';
  }
  if (labels.includes('training') || labels.includes('onboarding') || labels.includes('lessons')) {
    return 'I noticed training or onboarding may be a meaningful opportunity.';
  }
  if (signal?.answeredQuestionIds.length && signal.answeredQuestionIds.length >= 5) {
    return "I'm connecting the dots now. Your Blueprint is starting to come into view.";
  }
  return "I'm listening for the patterns that will make the first recommendation useful.";
}

function discoverRecommendation(signal: DiscoverGuideSignal | null) {
  const labels = signal?.selectedLabels.join(' ').toLowerCase() ?? '';
  if (signal?.reviewMode) return 'I have enough to begin turning this into clear possibilities.';
  if (labels.includes('portal')) return 'I will likely evaluate whether a focused portal could reduce confusion and improve follow-through.';
  if (labels.includes('landing') || labels.includes('page')) return 'I will likely evaluate whether a clearer landing experience should be the first step.';
  if (labels.includes('training') || labels.includes('onboarding')) return 'I will evaluate whether Training Transformation would create meaningful value.';
  if (labels.includes('automation') || labels.includes('automatic')) return 'I will look for opportunities to reduce repeated work without overbuilding.';
  if (labels.includes('connect')) return 'I will likely evaluate whether a Connect profile gives you the fastest path to clarity and trust.';
  return "After this we'll keep exploring your goals so I can build better recommendations.";
}

function discoverSelectionInsight(signal: DiscoverGuideSignal) {
  const selected = signal.selectedLabels.join(' ').toLowerCase();
  if (signal.id === 'desired_experiences' && selected.includes('training')) {
    return 'I will look for ways to turn knowledge, onboarding, and repeatable guidance into a training solution.';
  }
  if (selected.includes('portal')) {
    return 'I will watch for who needs access, what they need to see, and what support would make the portal useful.';
  }
  if (selected.includes('landing') || selected.includes('page')) {
    return 'I will focus the page around the clearest audience, promise, proof, and next action.';
  }
  if (selected.includes('automation') || selected.includes('automatic')) {
    return 'I will look for repeated work that could become easier, faster, or more consistent.';
  }
  if (selected.includes('connect')) {
    return 'I will look for a profile path that helps people understand, trust, and take action quickly.';
  }
  if (signal.answer) return 'I have added this to the direction I am building with you.';
  return '';
}

function understandingItems(signal: DiscoverGuideSignal | null) {
  const answered = new Set(signal?.answeredQuestionIds ?? []);
  return [
    { label: 'Organization', complete: answered.has('organization_name') || answered.has('organization_type') },
    { label: 'Mission', complete: answered.has('mission') },
    { label: 'Audience', complete: answered.has('landing_audience') || answered.has('connect_audience') || answered.has('portal_users') },
    { label: 'Goals', complete: answered.has('desired_experiences') || answered.has('goal_notes') },
    { label: 'Current Systems', complete: answered.has('current_systems') },
    { label: 'Opportunities', complete: answered.has('operational_challenges') || answered.has('repeated_work') },
  ];
}

export default function EAGuideOrb() {
  const pathname = usePathname() ?? '/';
  const context = useMemo(() => resolveGuideContext(pathname), [pathname]);
  const isSimplifi = context.id === 'simplifi';
  const isDiscover = context.id === 'discover';
  const scope = 'simplifi-user';
  const [open, setOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [memory, setMemory] = useState<EAGuideMemoryItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = window.localStorage.getItem(EA_GUIDE_MEMORY_KEY);
      return stored ? (JSON.parse(stored) as EAGuideMemoryItem[]) : [];
    } catch {
      return [];
    }
  });
  const [launchSignal, setLaunchSignal] = useState<LaunchSignal | null>(null);
  const [storySection, setStorySection] = useState<StorySectionSignal | null>(null);
  const [discoverSignal, setDiscoverSignal] = useState<DiscoverGuideSignal | null>(null);
  const [needsHelp, setNeedsHelp] = useState(false);
  const [selectionInsight, setSelectionInsight] = useState('');
  const [orbAnswer, setOrbAnswer] = useState('');
  const [orbLoading, setOrbLoading] = useState(false);
  const [firstName] = useState(() => inferFirstName());
  const [firstUseComplete, setFirstUseComplete] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(EA_GUIDE_FIRST_USE_KEY) === 'true';
  });
  const pageContext = useMemo(() => simplifiPageContext(), []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFirstUseComplete(window.localStorage.getItem(EA_GUIDE_FIRST_USE_KEY) === 'true');
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (firstUseComplete) return;
    const timer = window.setTimeout(() => setOpen(true), 700);
    return () => window.clearTimeout(timer);
  }, [firstUseComplete]);

  useEffect(() => {
    const key = `${EA_GUIDE_DAILY_BRIEF_KEY}-${context.id}`;
    if (window.localStorage.getItem(key) === todayKey()) return;
    window.localStorage.setItem(key, todayKey());
  }, [context.id]);

  useEffect(() => {
    async function loadLaunchSignal() {
      try {
        const response = await fetch('/api/ea-factory/launch-status', { cache: 'no-store' });
        const payload = await response.json();
        setLaunchSignal(payload.active ?? null);
      } catch {
        setLaunchSignal(null);
      }
    }

    loadLaunchSignal();
    window.addEventListener('storage', loadLaunchSignal);
    window.addEventListener('ea-guide:launch-ready', loadLaunchSignal);
    return () => {
      window.removeEventListener('storage', loadLaunchSignal);
      window.removeEventListener('ea-guide:launch-ready', loadLaunchSignal);
    };
  }, []);

  useEffect(() => {
    function updateStorySection(event: Event) {
      const signal = (event as CustomEvent<StorySectionSignal>).detail;
      if (signal?.id && signal.message) setStorySection(signal);
    }

    window.addEventListener('ea-guide:story-section', updateStorySection);
    return () => window.removeEventListener('ea-guide:story-section', updateStorySection);
  }, []);

  useEffect(() => {
    function updateDiscoverContext(event: Event) {
      const signal = (event as CustomEvent<DiscoverGuideSignal>).detail;
      if (!signal?.id) return;
      setDiscoverSignal(signal);
      setNeedsHelp(false);
      setSelectionInsight('');
    }

    function focusDiscoverQuestion(event: Event) {
      updateDiscoverContext(event);
      setOpen(true);
      setNeedsHelp(false);
    }

    function reactToDiscoverChoice(event: Event) {
      const signal = (event as CustomEvent<DiscoverGuideSignal>).detail;
      if (!signal?.id) return;
      setDiscoverSignal(signal);
      setNeedsHelp(false);
      setSelectionInsight(discoverSelectionInsight(signal));
    }

    window.addEventListener('ea-guide:discover-context', updateDiscoverContext);
    window.addEventListener('ea-guide:discover-focus-question', focusDiscoverQuestion);
    window.addEventListener('ea-guide:discover-choice', reactToDiscoverChoice);
    return () => {
      window.removeEventListener('ea-guide:discover-context', updateDiscoverContext);
      window.removeEventListener('ea-guide:discover-focus-question', focusDiscoverQuestion);
      window.removeEventListener('ea-guide:discover-choice', reactToDiscoverChoice);
    };
  }, []);

  useEffect(() => {
    if (!isDiscover || open || !firstUseComplete) return;
    const timer = window.setTimeout(() => setNeedsHelp(true), 45000);
    return () => window.clearTimeout(timer);
  }, [discoverSignal?.id, firstUseComplete, isDiscover, open]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  }

  function saveMemory(label: string, detail = context.recommendedAction) {
    const item: EAGuideMemoryItem = {
      id: `${context.id}-${memory.length}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      label,
      detail,
      createdAt: new Date().toISOString(),
      contextId: context.id,
    };
    const next = [item, ...memory].slice(0, 12);
    setMemory(next);
    window.localStorage.setItem(EA_GUIDE_MEMORY_KEY, JSON.stringify(next));
    showToast('Saved for later.');
  }

  function runEvent(eventName?: string) {
    if (!eventName) return;
    window.dispatchEvent(new CustomEvent(eventName, { detail: { source: 'ea-guide', context: context.id } }));
    showToast('Got it.');
  }

  function walkThroughCurrentExperience() {
    completeFirstUse();
    runEvent(isDiscover ? 'ea-guide:discover-walkthrough' : 'ea-guide:walkthrough');
  }

  function completeFirstUse(close = false) {
    setFirstUseComplete(true);
    window.localStorage.setItem(EA_GUIDE_FIRST_USE_KEY, 'true');
    if (close) setOpen(false);
  }

  async function askOrchestrator(message: string) {
    setOrbLoading(true);
    setOrbAnswer('');
    try {
      const response = await fetch('/api/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          intent: context.id,
          conversationId: `orb-${context.id}`,
          context: {
            path: pathname,
            product: context.product,
            recommendedAction,
            recommendationDetail,
            discoverQuestion: discoverSignal?.question,
            discoverSelection: discoverSignal?.answer,
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? 'The Orb could not complete that request.');
      setOrbAnswer(payload.response?.summary ?? 'I reviewed that and saved the context.');
    } catch (err) {
      setOrbAnswer(err instanceof Error ? err.message : 'The Orb could not complete that request.');
    } finally {
      setOrbLoading(false);
    }
  }

  const launchReady = Boolean(launchSignal && pathname.includes('/admin'));
  const isStoryHome = pathname === '/' && Boolean(storySection);
  const stacked = pathname.includes('/simplifi/capture') || pathname.includes('/amplifi/share');
  const state = voiceOpen ? 'listening' : open ? 'speaking' : needsHelp ? 'alert' : launchReady ? 'success' : isStoryHome ? 'watching' : context.state ?? 'idle';
  const captureCount = isSimplifi ? getCaptureCount(scope) : 0;
  const simplifiRecommendation = isSimplifi && shouldShowGuideRecommendations(scope) && captureCount >= 3
    ? {
        title: `You saved ${captureCount} opportunities.`,
        detail: '1 needs attention. Would you like to review it?',
        actions: [
          { id: 'review', label: 'Review', kind: 'href' as const, href: '/simplifi/workspace' },
          { id: 'later', label: 'Later', kind: 'memory' as const },
        ],
      }
    : null;

  const recommendedAction = isStoryHome && storySection
    ? storySection.title
    : launchReady && launchSignal ? launchSignal.message : simplifiRecommendation?.title ?? context.recommendedAction;
  const recommendationDetail = launchReady && launchSignal
    ? `${launchSignal.client} is ${launchSignal.statusLabel.toLowerCase()}.`
    : isStoryHome && storySection
      ? storySection.message
      : simplifiRecommendation?.detail ?? context.recommendationDetail;
  const recommendationWhy = launchReady
    ? ['Launch workflow completed.', 'Project and skin briefs were generated.', 'Approval is the next dependency.']
    : isStoryHome && storySection
      ? [storySection.example, 'The site is moving from current reality toward what becomes possible.', 'Use the final section to generate a future-state narrative.']
    : context.recommendationWhy ?? context.sinceLastVisit;
  const dailyBrief = isStoryHome && storySection
    ? ['I am following the active scene.', 'Click Continue the story to move through the experience.', 'Use Show me an example for a concrete version.']
    : context.dailyBrief?.length ? context.dailyBrief : context.sinceLastVisit;
  const opportunityHealth = context.opportunityHealth ?? ['Active: Current workspace', 'Watching: New signals', 'Follow-Up Needed: Open commitments'];
  const winWall = context.winWall ?? ['Progress is being tracked'];
  const guideActions: EAGuideAction[] = launchReady && launchSignal
    ? [
        { id: 'review-package', label: 'Review Package', kind: 'href', href: launchSignal.links.reviewPackage },
        { id: 'open-skin-brief', label: 'Open Skin Brief', kind: 'href', href: launchSignal.links.skinBrief },
        { id: 'open-project-brief', label: 'Open Project Brief', kind: 'href', href: launchSignal.links.projectBrief },
        { id: 'approval', label: 'Continue To Approval', kind: 'href', href: launchSignal.links.approval },
        { id: 'codex', label: 'Codex Handoff', kind: 'href', href: launchSignal.links.codexBuilder },
        { id: 'deployment', label: 'Deployment Package', kind: 'href', href: launchSignal.links.deployment },
      ]
    : isStoryHome
      ? [
          { id: 'story-example', label: 'Show me an example', kind: 'memory' },
          { id: 'continue-story', label: 'Continue the story', kind: 'href', href: '#possibilities' },
          { id: 'how-it-works', label: 'How does this work?', kind: 'href', href: '/assessment' },
        ]
    : simplifiRecommendation
      ? (simplifiRecommendation.actions as EAGuideAction[])
      : context.actions;

  if (isSimplifi) return null;

  return (
    <>
      <div className={`ea-guide-shell${stacked ? ' ea-guide-shell-stacked' : ''}`}>
        {toast ? <div className="ea-guide-toast">{toast}</div> : null}
        {open ? (
          <section className="ea-guide-card" aria-label="EA Guide">
            {!firstUseComplete ? (
              <>
                <div className="ea-guide-card-head">
                  <div>
                    <p className="ea-guide-eyebrow">EA Guide&trade;</p>
                    <h2>Welcome.</h2>
                    <p>I&apos;m your EA Guide. I&apos;ll stay with you throughout this journey. Together we&apos;ll discover what&apos;s possible, why it matters, and what the next right step could be.</p>
                  </div>
                  <button type="button" className="ea-guide-icon-btn" onClick={() => completeFirstUse(true)} aria-label="Close EA Guide">
                    x
                  </button>
                </div>
                <p className="ea-guide-first-use-copy">You can ask me anything or choose Walk Me Through It at any time.</p>
                <div className="ea-guide-actions">
                  <button type="button" className="ea-guide-action" onClick={walkThroughCurrentExperience}>
                    Walk Me Through It
                  </button>
                  <button type="button" className="ea-guide-action" onClick={() => completeFirstUse(true)}>
                    I&apos;ll Explore
                  </button>
                  <button type="button" className="ea-guide-action ea-guide-action-muted" onClick={() => { completeFirstUse(); setVoiceOpen(true); }}>
                    Ask Me Anything
                  </button>
                  <button type="button" className="ea-guide-action ea-guide-action-muted" onClick={() => completeFirstUse(true)}>
                    Not Right Now
                  </button>
                </div>
              </>
            ) : isDiscover ? (
              <>
                <div className="ea-guide-card-head">
                  <div>
                    <p className="ea-guide-eyebrow">EA Guide&trade;</p>
                    <h2>{needsHelp ? 'Need help deciding?' : discoverSignal?.sectionTitle ?? 'Discover the possibilities.'}</h2>
                    <p>{discoverSignal?.progressMessage ?? 'I can help you think through your goals, compare options, and decide what to share next.'}</p>
                  </div>
                  <button type="button" className="ea-guide-icon-btn" onClick={() => setOpen(false)} aria-label="Close EA Guide">
                    x
                  </button>
                </div>

                <div className="ea-guide-brief">
                  <p className="ea-guide-section-label">{discoverSignal?.pageLabel ?? 'Guide me'}</p>
                  <ul>
                    {discoverGuidePoints(discoverSignal).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="ea-guide-understanding">
                  <p className="ea-guide-section-label">Understanding your organization</p>
                  <div>
                    {understandingItems(discoverSignal).map((item) => (
                      <span key={item.label} className={item.complete ? 'ea-guide-understanding-complete' : ''}>
                        <b>{item.complete ? '✓' : '...'}</b>
                        {item.label}
                      </span>
                    ))}
                  </div>
                  <p>{organizationGuidance(discoverSignal)}</p>
                </div>

                <div className="ea-guide-recommendation">
                  <p className="ea-guide-section-label">{discoverSignal?.reviewMode ? 'Blueprint check' : 'What I am asking'}</p>
                  <strong>{discoverQuestionLead(discoverSignal)}</strong>
                  <span>{discoverSignal?.helper ?? 'Pages, Connect profiles, portals, automation, communication, and training can work together.'}</span>
                  {discoverSignal?.answer ? (
                    <div className="ea-guide-why">
                      <p>Current selection</p>
                      <ul>
                        <li>{discoverSignal.answer}</li>
                        {selectionInsight ? <li>{selectionInsight}</li> : null}
                      </ul>
                    </div>
                  ) : null}
                  <div className="ea-guide-why">
                    <p>What I am noticing</p>
                    <ul>
                      <li>{discoverObservation(discoverSignal)}</li>
                    </ul>
                  </div>
                  {discoverSignal?.reviewSummary?.length ? (
                    <div className="ea-guide-why">
                      <p>What is ready</p>
                      <ul>
                        {discoverSignal.reviewSummary.slice(0, 4).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <div className="ea-guide-why">
                    <p>Here&apos;s why I&apos;m asking</p>
                    <ul>
                      {discoverWhyPoints(discoverSignal).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="ea-guide-why">
                    <p>What may become possible</p>
                    <ul>
                      <li>{discoverRecommendation(discoverSignal)}</li>
                    </ul>
                  </div>
                </div>

                <div className="ea-guide-actions">
                  <button type="button" className="ea-guide-action" onClick={() => setOpen(false)}>
                    Continue Discovering
                  </button>
                  <button type="button" className="ea-guide-action ea-guide-action-muted" onClick={() => runEvent('ea-guide:discover-training')}>
                    Explain Training
                  </button>
                  <button type="button" className="ea-guide-action ea-guide-action-muted" onClick={() => runEvent('ea-guide:discover-walkthrough')}>
                    Walk Me Through It
                  </button>
                  <button type="button" className="ea-guide-action ea-guide-action-muted" onClick={() => setVoiceOpen(true)}>
                    Ask Me Anything
                  </button>
                  <button type="button" className="ea-guide-action ea-guide-action-muted" onClick={() => setOpen(false)}>
                    Not Right Now
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="ea-guide-card-head">
                  <div>
                    <p className="ea-guide-eyebrow">EA Guide&trade;</p>
                    <h2>{isSimplifi ? context.greeting : `Hi ${firstName}`}</h2>
                    <p>{context.role} for {context.product}</p>
                  </div>
                  <button type="button" className="ea-guide-icon-btn" onClick={() => setOpen(false)} aria-label="Close EA Guide">
                    x
                  </button>
                </div>

                <div className="ea-guide-brief">
                  <p className="ea-guide-section-label">Today</p>
                  <ul>
                    {dailyBrief.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                {isSimplifi && pageContext ? (
                  <div className="ea-guide-recommendation">
                    <p>{pageContext.lead}</p>
                    <p className="ea-guide-muted">Possible actions:</p>
                    <div className="ea-guide-actions">
                      {pageContext.actions.map((label) => (
                        <button key={label} type="button" className="ea-guide-action" onClick={() => saveMemory(label)}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="ea-guide-recommendation">
                  <p className="ea-guide-section-label">Recommended action</p>
                  <strong>{recommendedAction}</strong>
                  <span>{recommendationDetail}</span>
                  <div className="ea-guide-why">
                    <p>Why am I seeing this?</p>
                    <ul>
                      {recommendationWhy.slice(0, 4).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="ea-guide-actions">
                  {guideActions.map((action) => {
                    if (action.kind === 'href' && action.href) {
                      return (
                        <Link key={action.id} href={action.href} className="ea-guide-action" onClick={() => setOpen(false)}>
                          {action.label}
                        </Link>
                      );
                    }
                    return (
                      <button
                        key={action.id}
                        type="button"
                        className="ea-guide-action"
                        onClick={() => {
                          if (action.kind === 'event') runEvent(action.eventName);
                          if (action.kind === 'memory') {
                            saveMemory(action.label);
                            setOpen(false);
                          }
                        }}
                      >
                        {action.label}
                      </button>
                    );
                  })}
                  <button type="button" className="ea-guide-action ea-guide-action-muted" onClick={() => setVoiceOpen(true)}>
                    Voice Mode
                  </button>
                </div>

                <div className="ea-guide-grid">
                  <div>
                    <p className="ea-guide-section-label">Opportunity health</p>
                    {opportunityHealth.slice(0, 3).map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                  <div>
                    <p className="ea-guide-section-label">Win wall</p>
                    {winWall.slice(0, 2).map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                </div>

                {context.protocolAwareness.length > 0 ? (
                  <div className="ea-guide-protocols">
                    <p className="ea-guide-section-label">Protocol awareness</p>
                    <div>
                      {context.protocolAwareness.slice(0, 4).map((protocol) => (
                        <span key={protocol}>{protocol.replace(' Protocol', '')}</span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </section>
        ) : null}

        <button
          type="button"
          className={`ea-guide-orb ea-guide-orb-${state}`}
          aria-label="Open EA Guide"
          data-state={state}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="ea-guide-ring ea-guide-ring-gold" />
          <span className="ea-guide-ring ea-guide-ring-blue" />
          <span className="ea-guide-core" aria-hidden="true" />
        </button>
      </div>

      {voiceOpen ? (
        <div className="ea-guide-voice" role="dialog" aria-modal="true" aria-label="EA Guide voice mode">
          <div className="ea-guide-voice-orb">
            <span />
            <span />
            <span />
          </div>
          <p className="ea-guide-eyebrow">EA Guide Voice Mode</p>
          <h2>{orbLoading ? 'Thinking...' : 'Listening...'}</h2>
          <p>What would you like to do?</p>
          {orbAnswer ? <p className="ea-guide-muted">{orbAnswer}</p> : null}
          <div className="ea-guide-voice-actions">
            {(isDiscover
              ? ['Explain This Question', 'Show Me Possibilities', 'Walk Me Through It', 'Review My Direction', 'Talk About Training']
              : ['Save This', 'Add To Watch List', 'Create Reminder', 'Show Follow-Ups', 'Review Opportunities']
            ).map((label) => (
              <button key={label} type="button" onClick={() => askOrchestrator(label)}>
                {label}
              </button>
            ))}
            <button type="button" onClick={() => setVoiceOpen(false)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

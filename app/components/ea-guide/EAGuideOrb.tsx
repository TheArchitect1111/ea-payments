'use client';

import Image from 'next/image';
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

export default function EAGuideOrb() {
  const pathname = usePathname() ?? '/';
  const context = useMemo(() => resolveGuideContext(pathname), [pathname]);
  const isSimplifi = context.id === 'simplifi';
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
  const [firstName] = useState(() => inferFirstName());
  const [firstUseComplete, setFirstUseComplete] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(EA_GUIDE_FIRST_USE_KEY) === 'true';
  });
  const pageContext = useMemo(() => simplifiPageContext(), []);

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

  function completeFirstUse(close = false) {
    setFirstUseComplete(true);
    window.localStorage.setItem(EA_GUIDE_FIRST_USE_KEY, 'true');
    if (close) setOpen(false);
  }

  const launchReady = Boolean(launchSignal && pathname.includes('/admin'));
  const stacked = pathname.includes('/simplifi/capture') || pathname.includes('/amplifi/share');
  const state = voiceOpen ? 'listening' : open ? 'speaking' : launchReady ? 'success' : 'idle';
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

  const recommendedAction = launchReady && launchSignal ? launchSignal.message : simplifiRecommendation?.title ?? context.recommendedAction;
  const recommendationDetail = launchReady && launchSignal
    ? `${launchSignal.client} is ${launchSignal.statusLabel.toLowerCase()}.`
    : simplifiRecommendation?.detail ?? context.recommendationDetail;
  const recommendationWhy = launchReady
    ? ['Launch workflow completed.', 'Project and skin briefs were generated.', 'Approval is the next dependency.']
    : context.recommendationWhy ?? context.sinceLastVisit;
  const dailyBrief = context.dailyBrief?.length ? context.dailyBrief : context.sinceLastVisit;
  const opportunityHealth = context.opportunityHealth ?? ['Active: Current workspace', 'Watching: New signals', 'Follow-Up Needed: Open commitments'];
  const winWall = context.winWall ?? ['Progress is being tracked'];
  const badgeLabel = launchReady && launchSignal ? launchSignal.message : context.badgeLabel;
  const guideActions: EAGuideAction[] = launchReady && launchSignal
    ? [
        { id: 'review-package', label: 'Review Package', kind: 'href', href: launchSignal.links.reviewPackage },
        { id: 'open-skin-brief', label: 'Open Skin Brief', kind: 'href', href: launchSignal.links.skinBrief },
        { id: 'open-project-brief', label: 'Open Project Brief', kind: 'href', href: launchSignal.links.projectBrief },
        { id: 'approval', label: 'Continue To Approval', kind: 'href', href: launchSignal.links.approval },
        { id: 'codex', label: 'Codex Handoff', kind: 'href', href: launchSignal.links.codexBuilder },
        { id: 'deployment', label: 'Deployment Package', kind: 'href', href: launchSignal.links.deployment },
      ]
    : simplifiRecommendation
      ? (simplifiRecommendation.actions as EAGuideAction[])
      : context.actions;

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
                    <p>I help you remember opportunities, follow through on commitments, and focus on what matters most.</p>
                  </div>
                  <button type="button" className="ea-guide-icon-btn" onClick={() => completeFirstUse(true)} aria-label="Close EA Guide">
                    x
                  </button>
                </div>
                <p className="ea-guide-first-use-copy">What would you like to do?</p>
                <div className="ea-guide-actions">
                  <button type="button" className="ea-guide-action" onClick={() => completeFirstUse()}>
                    Show Me Around
                  </button>
                  <Link href="/simplifi/capture" className="ea-guide-action" onClick={() => completeFirstUse()}>
                    Capture Something
                  </Link>
                  <Link href="/simplifi/workspace" className="ea-guide-action" onClick={() => completeFirstUse()}>
                    Review Watch List
                  </Link>
                  <Link href="/simplifi" className="ea-guide-action ea-guide-action-muted" onClick={() => completeFirstUse()}>
                    Learn How Simplifi Works
                  </Link>
                  <button type="button" className="ea-guide-action ea-guide-action-muted" onClick={() => completeFirstUse(true)}>
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
          <span className="ea-guide-core">
            <Image src="/ea-logo.png" alt="" width={34} height={34} priority={false} />
          </span>
          <span className="ea-guide-state">{state === 'idle' ? 'EA Guide' : state}</span>
          {!open && badgeLabel ? <span className="ea-guide-badge">{badgeLabel}</span> : null}
        </button>
      </div>

      {voiceOpen ? (
        <div className="ea-guide-voice" role="dialog" aria-modal="true" aria-label="EA Guide voice mode">
          <div className="ea-guide-voice-orb">
            <span />
            <span />
            <span />
            <Image src="/ea-logo.png" alt="" width={72} height={72} />
          </div>
          <p className="ea-guide-eyebrow">EA Guide Voice Mode</p>
          <h2>Listening...</h2>
          <p>What would you like to do?</p>
          <div className="ea-guide-voice-actions">
            {['Save This', 'Add To Watch List', 'Create Reminder', 'Show Follow-Ups', 'Review Opportunities'].map((label) => (
              <button key={label} type="button" onClick={() => saveMemory(label, recommendedAction)}>
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

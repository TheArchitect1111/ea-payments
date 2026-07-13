'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { EAGuideAction } from '@/lib/ea-guide';
import { applyDiscoverSignal, buildAdvisorBrief } from '@/lib/assistant/brief';
import { ASSISTANT_LABELS, SURFACE_EYEBROW } from '@/lib/assistant/constants';
import { trackAssistantEvent } from '@/lib/assistant/instrumentation';
import { applyLiveSignals, type LiveBriefSignals } from '@/lib/assistant/signals';
import type {
  AskGuideResponse,
  AssistantLevel,
  AssistantSurface,
  DiscoverSignal,
  GuidanceMessage,
} from '@/lib/assistant/types';
import { EA_GUIDE_USER_KEY } from '@/lib/ea-guide-types';
import AdvisorBrief from './AdvisorBrief';
import AssistantDetails from './AssistantDetails';
import AssistantPanel from './AssistantPanel';
import AssistantTrigger from './AssistantTrigger';
import GetGuidanceFlow from './GetGuidanceFlow';
import './assistant.css';

type EAAssistantProps = {
  surface: AssistantSurface;
  /** Optional personality/capability envelope from workspace shell. */
  workspaceAiContext?: string;
};

function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return 'anon';
  const existing = window.localStorage.getItem(EA_GUIDE_USER_KEY);
  if (existing) return existing;
  const next = `user-${crypto.randomUUID().slice(0, 8)}`;
  window.localStorage.setItem(EA_GUIDE_USER_KEY, next);
  return next;
}

export default function EAAssistant({ surface, workspaceAiContext }: EAAssistantProps) {
  const pathname = usePathname() ?? '/';
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<AssistantLevel>('brief');
  const [messages, setMessages] = useState<GuidanceMessage[]>([]);
  const [discoverSignal, setDiscoverSignal] = useState<DiscoverSignal | null>(null);
  const [liveSignals, setLiveSignals] = useState<LiveBriefSignals | null>(null);
  const [userId, setUserId] = useState('anon');

  const isDiscover = surface === 'discover' || pathname.includes('/discover') || pathname.includes('/assessment');
  const hideOnSimplifi =
    pathname.startsWith('/simplifi') || pathname.includes('/portal/') && pathname.includes('/simplifi');

  useEffect(() => {
    setUserId(getOrCreateUserId());
  }, []);

  useEffect(() => {
    function updateLiveSignals(event: Event) {
      const signal = (event as CustomEvent<LiveBriefSignals>).detail;
      if (!signal?.kind) return;
      setLiveSignals(signal);
    }

    window.addEventListener('ea-assistant:live-signals', updateLiveSignals);
    return () => window.removeEventListener('ea-assistant:live-signals', updateLiveSignals);
  }, []);

  useEffect(() => {
    if (surface !== 'portal' && surface !== 'admin') return;

    async function loadLiveSignals() {
      if (surface === 'admin') {
        try {
          const response = await fetch('/api/ea-factory/launch-status', { cache: 'no-store' });
          const payload = await response.json();
          setLiveSignals({ kind: 'admin', launch: payload.active ?? null });
        } catch {
          setLiveSignals({ kind: 'admin', launch: null });
        }
        return;
      }

      const slugMatch = pathname.match(/\/portal\/([^/]+)/);
      const slug = slugMatch?.[1];
      if (!slug || ['login', 'register', 'forgot-password', 'reset-password'].includes(slug)) return;
      if (pathname.includes('/updates')) return;

      try {
        const response = await fetch('/api/portal/captures', { cache: 'no-store' });
        if (!response.ok) return;
        const payload = await response.json();
        const captures = Array.isArray(payload.captures) ? payload.captures : [];
        const opportunityCount = captures.filter(
          (capture: { considerSlug?: string; shareUrl?: string }) => capture.considerSlug || capture.shareUrl,
        ).length;
        setLiveSignals({
          kind: 'portal',
          slug,
          captureCount: captures.length,
          opportunityCount,
        });
      } catch {
        // Keep static brief when live data is unavailable.
      }
    }

    void loadLiveSignals();
  }, [pathname, surface]);

  useEffect(() => {
    if (!isDiscover) return;

    function updateDiscoverContext(event: Event) {
      const signal = (event as CustomEvent<DiscoverSignal>).detail;
      if (!signal?.id) return;
      setDiscoverSignal(signal);
    }

    function focusDiscoverQuestion(event: Event) {
      updateDiscoverContext(event);
      setOpen(true);
      setLevel('brief');
      trackAssistantEvent({
        event: 'assistant.opened',
        surface,
        pathname,
        userId,
      });
    }

    window.addEventListener('ea-guide:discover-context', updateDiscoverContext);
    window.addEventListener('ea-guide:discover-focus-question', focusDiscoverQuestion);
    window.addEventListener('ea-guide:discover-choice', updateDiscoverContext);
    return () => {
      window.removeEventListener('ea-guide:discover-context', updateDiscoverContext);
      window.removeEventListener('ea-guide:discover-focus-question', focusDiscoverQuestion);
      window.removeEventListener('ea-guide:discover-choice', updateDiscoverContext);
    };
  }, [isDiscover, pathname, surface, userId]);

  const brief = useMemo(() => {
    const base = buildAdvisorBrief(pathname, userId);
    const withDiscover = isDiscover ? applyDiscoverSignal(base, discoverSignal) : base;
    const withLive = applyLiveSignals(withDiscover, liveSignals);
    if (!workspaceAiContext) return withLive;
    return {
      ...withLive,
      whyBullets: [...withLive.whyBullets, workspaceAiContext],
      details: {
        ...withLive.details,
        aboutPage: [withLive.details.aboutPage, workspaceAiContext].filter(Boolean).join('\n\n'),
      },
    };
  }, [pathname, userId, isDiscover, discoverSignal, liveSignals, workspaceAiContext]);

  const showBadge = brief.needsAttention || Boolean(brief.badgeLabel);

  const handleClose = useCallback(() => {
    trackAssistantEvent({
      event: 'assistant.closed',
      surface,
      pathname,
      userId,
      organizationId: brief.pageContext.organizationId,
    });
    setOpen(false);
    setLevel('brief');
  }, [brief.pageContext.organizationId, pathname, surface, userId]);

  const handleToggle = useCallback(() => {
    setOpen((value) => {
      const next = !value;
      if (next) {
        trackAssistantEvent({
          event: 'assistant.opened',
          surface,
          pathname,
          userId,
          organizationId: brief.pageContext.organizationId,
        });
      } else {
        trackAssistantEvent({
          event: 'assistant.closed',
          surface,
          pathname,
          userId,
          organizationId: brief.pageContext.organizationId,
        });
        setLevel('brief');
      }
      return next;
    });
  }, [brief.pageContext.organizationId, pathname, surface, userId]);

  const handleAction = useCallback((action: EAGuideAction) => {
    trackAssistantEvent({
      event: 'assistant.action_clicked',
      surface,
      pathname,
      userId,
      organizationId: brief.pageContext.organizationId,
      actionId: action.id,
    });
    if (action.kind === 'event' && action.eventName) {
      window.dispatchEvent(
        new CustomEvent(action.eventName, { detail: { source: 'ea-assistant', context: brief.contextId } }),
      );
      return;
    }
    if (action.kind === 'memory') {
      window.dispatchEvent(
        new CustomEvent('ea-assistant:memory', { detail: { label: action.label, context: brief.contextId } }),
      );
    }
  }, [brief.contextId, brief.pageContext.organizationId, pathname, surface, userId]);

  const handleAsk = useCallback(async (question: string): Promise<GuidanceMessage> => {
    trackAssistantEvent({
      event: 'assistant.question_submitted',
      surface,
      pathname,
      userId,
      organizationId: brief.pageContext.organizationId,
      questionLength: question.length,
    });

    const userMessage: GuidanceMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch('/api/ea-guide/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          pathname,
          userId,
          organizationId: brief.pageContext.organizationId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ask failed with status ${response.status}`);
      }

      const payload = (await response.json()) as AskGuideResponse;
      if (!payload.answer?.trim()) {
        throw new Error('Empty answer');
      }

      const assistantMessage: GuidanceMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: payload.answer,
        confidence: payload.confidence,
        nextSteps: payload.nextSteps,
        suggestEscalation: payload.suggestEscalation,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      trackAssistantEvent({
        event: 'assistant.ask_success',
        surface,
        pathname,
        userId,
        organizationId: brief.pageContext.organizationId,
        questionLength: question.length,
      });
      return assistantMessage;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ask failed';
      const assistantMessage: GuidanceMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: ASSISTANT_LABELS.askFailure,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      trackAssistantEvent({
        event: 'assistant.ask_failure',
        surface,
        pathname,
        userId,
        organizationId: brief.pageContext.organizationId,
        questionLength: question.length,
        error: message,
      });
      return assistantMessage;
    }
  }, [pathname, userId, brief.pageContext.organizationId, surface]);

  if (hideOnSimplifi) return null;

  const panelTitle =
    level === 'guidance'
      ? ASSISTANT_LABELS.getGuidance
      : level === 'details'
        ? ASSISTANT_LABELS.viewDetails
        : ASSISTANT_LABELS.briefTitle;

  return (
    <div className="ea-assistant-root" data-ea-assistant={surface}>
      <AssistantPanel
        open={open}
        title={panelTitle}
        eyebrow={SURFACE_EYEBROW[surface]}
        subtitle={brief.greeting}
        onClose={handleClose}
      >
        {level === 'brief' ? (
          <AdvisorBrief
            brief={brief}
            onAction={handleAction}
            onGetGuidance={() => {
              trackAssistantEvent({
                event: 'assistant.guidance_selected',
                surface,
                pathname,
                userId,
                organizationId: brief.pageContext.organizationId,
              });
              setLevel('guidance');
            }}
            onViewDetails={() => setLevel('details')}
          />
        ) : null}
        {level === 'guidance' ? (
          <GetGuidanceFlow
            pageContext={brief.pageContext}
            messages={messages}
            onBack={() => setLevel('brief')}
            onAsk={handleAsk}
          />
        ) : null}
        {level === 'details' ? (
          <AssistantDetails details={brief.details} onBack={() => setLevel('brief')} />
        ) : null}
      </AssistantPanel>

      <AssistantTrigger open={open} showBadge={showBadge} onToggle={handleToggle} />
    </div>
  );
}

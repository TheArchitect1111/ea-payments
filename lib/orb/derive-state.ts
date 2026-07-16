import type { ActionCenterPayload } from '@/lib/action-center';
import type { OrbBriefSlice, OrbFinding, OrbRecommendation, OrbSessionContext, OrbSessionInput, OrbVisualState } from './types';
import { orbStatePriority, pickHighestOrbState } from './priority';
import { buildOrbCopy } from './copy';

function isTimeSensitiveItem(title: string, detail: string, kind?: string): boolean {
  const hay = `${title} ${detail} ${kind ?? ''}`.toLowerCase();
  return /overdue|due soon|due today|expir|deadline|today|urgent/.test(hay);
}

function collectFindings(input: OrbSessionInput): OrbFinding[] {
  const findings: OrbFinding[] = [];
  for (const item of input.actionCenter.needsAttention.slice(0, 3)) {
    findings.push({
      id: item.id,
      title: item.title,
      detail: item.detail,
      href: item.href,
    });
  }
  for (const item of input.brief.items.slice(0, 3)) {
    if (findings.some((f) => f.title === item.title)) continue;
    findings.push({
      id: item.id,
      title: item.title,
      detail: item.detail,
      href: item.href,
    });
  }
  for (const item of input.actionCenter.recommended.slice(0, 2)) {
    if (findings.length >= 5) break;
    if (findings.some((f) => f.id === item.id || f.title === item.title)) continue;
    findings.push({
      id: item.id,
      title: item.title,
      detail: item.detail,
      href: item.href,
    });
  }
  return findings.slice(0, 5);
}

function buildRecommendation(input: OrbSessionInput): OrbRecommendation | null {
  const attention = input.actionCenter.needsAttention[0];
  if (attention?.href) {
    return {
      label: attention.title,
      href: attention.href,
      why: attention.detail,
    };
  }
  const recommended = input.actionCenter.recommended[0];
  if (recommended?.href) {
    return {
      label: recommended.title,
      href: recommended.href,
      why: recommended.detail,
    };
  }
  if (input.brief.recommendedNext) {
    return {
      label: input.brief.recommendedNext.label,
      href: input.brief.recommendedNext.href,
    };
  }
  const top = input.objects[0];
  if (top) {
    return {
      label: top.nextAction,
      href: `/simplifi/opportunity/${top.id}`,
      why: top.whyThisMatters.slice(0, 120),
    };
  }
  return null;
}

function informationalState(input: OrbSessionInput): OrbVisualState {
  const { actionCenter, brief, objects } = input;
  const attention = actionCenter.needsAttention;
  const hasTimeSensitive =
    attention.some((i) => isTimeSensitiveItem(i.title, i.detail)) ||
    brief.items.some((i) => isTimeSensitiveItem(i.title, i.detail, i.kind));

  if (hasTimeSensitive) return 'timeSensitive';

  if (attention.length > 0 || actionCenter.recommended.some((r) => r.priority === 'critical' || r.priority === 'high')) {
    if (objects[0] && (objects[0].opportunityScore ?? 0) >= 70) return 'opportunity';
    return 'recommendation';
  }

  if (actionCenter.watchlist.length > 0 || brief.items.some((i) => i.kind === 'momentum' || i.kind === 'explore')) {
    return 'discovery';
  }

  if (objects.length === 0 && attention.length === 0) return 'quiet';
  return 'idle';
}

export function deriveOrbSession(input: OrbSessionInput): OrbSessionContext {
  const online = input.online ?? true;
  const candidates: OrbVisualState[] = [];

  if (!online) candidates.push('offline');
  if (input.interaction === 'listening') candidates.push('listening');
  if (input.interaction === 'thinking') candidates.push('thinking');
  if (input.interaction === 'speaking') candidates.push('speaking');
  candidates.push(informationalState(input));

  const state = pickHighestOrbState(candidates);
  const findings = collectFindings(input);
  const recommendation = buildRecommendation(input);
  const copy = buildOrbCopy({
    pathname: input.pathname,
    brief: input.brief,
    findings,
    recommendation,
    actionCenter: input.actionCenter,
    objectCount: input.objects.length,
    entityId: input.entityId,
  });

  const dueCount = input.actionCenter.needsAttention.filter((i) =>
    isTimeSensitiveItem(i.title, i.detail),
  ).length;
  const unreadCount = findings.length;

  return {
    state,
    priority: orbStatePriority(state),
    title: copy.title,
    summary: copy.summary,
    findings,
    recommendation,
    currentRoute: input.pathname,
    unreadCount,
    dueCount,
    ariaLabel: copy.ariaLabel,
  };
}

export function emptyBriefSlice(): OrbBriefSlice {
  return {
    greeting: 'Good morning.',
    items: [],
    recommendedNext: null,
  };
}

export function emptyActionCenter(): ActionCenterPayload {
  return { needsAttention: [], recommended: [], watchlist: [] };
}

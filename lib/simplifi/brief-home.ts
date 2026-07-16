/**
 * Brief home Pass 2 — grounded summary rows + opportunity status lines.
 * Derives copy only from existing Brief / Action Center / Simplifi objects.
 */
import type { ActionCenterPayload } from '@/lib/action-center';
import type { DailyBriefItem, SimplifiObject } from '@/lib/simplifi-objects';
import { sortInbox } from '@/lib/simplifi-objects';

export type BriefHomeSummaryTone = 'attention' | 'proposal' | 'followup' | 'reading';

export type BriefHomeSummaryRow = {
  id: string;
  title: string;
  detail?: string;
  href: string;
  tone: BriefHomeSummaryTone;
};

export type BriefHomeEmptyState = {
  title: string;
  explanation: string;
  actionLabel: string;
  actionHref: string;
};

function looksLikeProposal(obj: SimplifiObject): boolean {
  const hay = `${obj.title} ${obj.type} ${obj.savePurpose ?? ''} ${obj.nextAction}`.toLowerCase();
  return hay.includes('proposal') || Boolean(obj.considerUrl || obj.magnifiUrl);
}

function looksLikeReading(obj: SimplifiObject): boolean {
  const hay = `${obj.title} ${obj.type} ${obj.savePurpose ?? ''} ${obj.saveReason ?? ''}`.toLowerCase();
  return (
    hay.includes('article') ||
    hay.includes('read') ||
    hay.includes('research') ||
    hay.includes('later') ||
    obj.type === 'Note'
  );
}

function countLabel(n: number, singular: string, plural: string): string {
  return n === 1 ? `1 ${singular}` : `${n} ${plural}`;
}

/**
 * Aggregated Today's Brief lines (mock-style), only when real data supports them.
 * Falls back to individual brief items when aggregates are thin.
 */
export function buildBriefHomeSummaries(input: {
  objects: SimplifiObject[];
  actionCenter: ActionCenterPayload;
  briefItems: DailyBriefItem[];
}): BriefHomeSummaryRow[] {
  const active = sortInbox(
    input.objects.filter((o) => o.status !== 'archived' && o.outcomeStatus !== 'won' && o.outcomeStatus !== 'lost'),
  );
  const rows: BriefHomeSummaryRow[] = [];

  const highOppCount = active.filter(
    (o) =>
      o.priority === 'High' ||
      (o.opportunityScore ?? 0) >= 55 ||
      o.priorityLevel === 'high' ||
      o.priorityLevel === 'critical',
  ).length;
  const deserveCount = Math.max(highOppCount, input.actionCenter.needsAttention.length);
  if (deserveCount > 0) {
    rows.push({
      id: 'sum-attention',
      title: `${countLabel(deserveCount, 'opportunity deserves', 'opportunities deserve')} attention`,
      detail: input.actionCenter.needsAttention[0]?.detail ?? input.briefItems[0]?.detail,
      href: input.actionCenter.needsAttention[0]?.href ?? '/simplifi/inbox',
      tone: 'attention',
    });
  }

  const proposals = active.filter(looksLikeProposal);
  if (proposals.length > 0) {
    const first = proposals[0];
    rows.push({
      id: 'sum-proposal',
      title:
        proposals.length === 1
          ? 'One proposal is ready'
          : `${proposals.length} proposals are ready to review`,
      detail: first.title,
      href: `/simplifi/opportunity/${first.id}`,
      tone: 'proposal',
    });
  }

  const followup =
    input.actionCenter.needsAttention[0] ??
    input.briefItems.find((item) => item.kind === 'deadline' || item.kind === 'due-soon' || item.kind === 'overdue' || item.kind === 'stale');
  if (followup) {
    rows.push({
      id: 'sum-followup',
      title: followup.title,
      detail: followup.detail,
      href: followup.href ?? '/simplifi/follow-ups',
      tone: 'followup',
    });
  }

  const reading = active.filter(looksLikeReading);
  if (reading.length > 0) {
    rows.push({
      id: 'sum-reading',
      title: `${countLabel(reading.length, 'item worth', 'items worth')} reviewing`,
      detail: reading[0].title,
      href: `/simplifi/opportunity/${reading[0].id}`,
      tone: 'reading',
    });
  }

  if (rows.length >= 2) {
    return dedupeSummaryRows(rows).slice(0, 4);
  }

  // Thin data: surface concrete brief items instead of inventing aggregates.
  const fromItems = input.briefItems.slice(0, 4).map((item) => ({
    id: item.id,
    title: item.title,
    detail: item.detail,
    href: item.href ?? '/simplifi/inbox',
    tone: toneFromBriefKind(item.kind),
  }));
  return dedupeSummaryRows([...rows, ...fromItems]).slice(0, 4);
}

function toneFromBriefKind(kind: DailyBriefItem['kind']): BriefHomeSummaryTone {
  if (kind === 'momentum') return 'attention';
  if (kind === 'explore') return 'reading';
  if (kind === 'deadline' || kind === 'due-soon' || kind === 'overdue' || kind === 'stale') return 'followup';
  return 'attention';
}

function dedupeSummaryRows(rows: BriefHomeSummaryRow[]): BriefHomeSummaryRow[] {
  const seen = new Set<string>();
  const out: BriefHomeSummaryRow[] = [];
  for (const row of rows) {
    const key = row.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

/** Status line under recent opportunity titles — grounded in object fields only. */
export function opportunityStatusLine(obj: SimplifiObject): string {
  const bits: string[] = [];
  if (looksLikeProposal(obj)) bits.push('Proposal ready');
  else if (obj.nextAction?.trim()) bits.push(obj.nextAction.trim());
  else if (obj.savePurpose?.trim()) bits.push(obj.savePurpose.trim());
  else bits.push(obj.type);

  bits.push(relativeUpdatedLabel(obj.dateCaptured));
  return bits.join(' · ');
}

export function relativeUpdatedLabel(iso: string): string {
  const captured = new Date(iso);
  if (Number.isNaN(captured.getTime())) return 'Updated recently';
  const diffMs = Date.now() - captured.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `Updated ${Math.max(1, mins)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Updated ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Updated yesterday';
  if (days < 7) return `Updated ${days}d ago`;
  return `Updated ${captured.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

export function briefHomeEmptyState(input: {
  loggedIn: boolean;
  hasObjects: boolean;
}): BriefHomeEmptyState {
  if (!input.loggedIn) {
    return {
      title: 'Sign in to personalize your Brief',
      explanation: 'Your opportunities and follow-ups will show here. You can still capture without an account.',
      actionLabel: 'Sign in',
      actionHref: '/simplifi/login',
    };
  }
  if (!input.hasObjects) {
    return {
      title: 'Your Brief is clear',
      explanation: 'Capture a URL, note, or file — Simplifi will score it and surface what deserves attention.',
      actionLabel: 'Quick capture',
      actionHref: '/simplifi/capture',
    };
  }
  return {
    title: 'Nothing urgent right now',
    explanation: "New follow-ups and high-momentum opportunities will appear in Today's Brief.",
    actionLabel: 'Open inbox',
    actionHref: '/simplifi/inbox',
  };
}

/**
 * Mobile Brief home helpers — same design language as web Pass 2.
 * Portable types (no @/lib imports) for Expo Metro.
 */

export type BriefHomeSummaryTone = 'attention' | 'proposal' | 'followup' | 'reading';

export type BriefHomeSummaryRow = {
  id: string;
  title: string;
  detail?: string;
  tone: BriefHomeSummaryTone;
};

export type BriefObjectLike = {
  id: string;
  title: string;
  type?: string;
  status?: string;
  priority?: string;
  priorityLevel?: string;
  opportunityScore?: number;
  nextAction?: string;
  dueDate?: string;
  savePurpose?: string;
  saveReason?: string;
  dateCaptured?: string;
  outcomeStatus?: string;
  considerUrl?: string;
  magnifiUrl?: string;
};

export type BriefItemLike = {
  id?: string;
  title: string;
  detail?: string;
  kind?: string;
  href?: string;
};

export type ActionCenterLike = {
  needsAttention?: Array<{ id?: string; title?: string; detail?: string; href?: string }>;
  recommended?: Array<{ id?: string; title?: string; detail?: string }>;
  watchlist?: Array<{ id?: string; title?: string; detail?: string }>;
};

function looksLikeProposal(obj: BriefObjectLike): boolean {
  const hay = `${obj.title} ${obj.type ?? ''} ${obj.savePurpose ?? ''} ${obj.nextAction ?? ''}`.toLowerCase();
  return hay.includes('proposal') || Boolean(obj.considerUrl || obj.magnifiUrl);
}

function looksLikeReading(obj: BriefObjectLike): boolean {
  const hay = `${obj.title} ${obj.type ?? ''} ${obj.savePurpose ?? ''} ${obj.saveReason ?? ''}`.toLowerCase();
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

function toneFromKind(kind?: string): BriefHomeSummaryTone {
  if (kind === 'momentum') return 'attention';
  if (kind === 'explore') return 'reading';
  if (kind === 'deadline' || kind === 'due-soon' || kind === 'overdue' || kind === 'stale') return 'followup';
  return 'attention';
}

function dedupe(rows: BriefHomeSummaryRow[]): BriefHomeSummaryRow[] {
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

export function buildBriefHomeSummaries(input: {
  objects: BriefObjectLike[];
  actionCenter: ActionCenterLike;
  briefItems: BriefItemLike[];
}): BriefHomeSummaryRow[] {
  const active = input.objects.filter(
    (o) => o.status !== 'archived' && o.outcomeStatus !== 'won' && o.outcomeStatus !== 'lost',
  );
  const rows: BriefHomeSummaryRow[] = [];
  const needsAttention = input.actionCenter.needsAttention ?? [];

  const highOppCount = active.filter(
    (o) =>
      o.priority === 'High' ||
      (o.opportunityScore ?? 0) >= 55 ||
      o.priorityLevel === 'high' ||
      o.priorityLevel === 'critical',
  ).length;
  const deserveCount = Math.max(highOppCount, needsAttention.length);
  if (deserveCount > 0) {
    rows.push({
      id: 'sum-attention',
      title: `${countLabel(deserveCount, 'opportunity deserves', 'opportunities deserve')} attention`,
      detail: needsAttention[0]?.detail ?? input.briefItems[0]?.detail,
      tone: 'attention',
    });
  }

  const proposals = active.filter(looksLikeProposal);
  if (proposals.length > 0) {
    const first = proposals[0];
    rows.push({
      id: 'sum-proposal',
      title: proposals.length === 1 ? 'One proposal is ready' : `${proposals.length} proposals are ready to review`,
      detail: first.title,
      tone: 'proposal',
    });
  }

  const followup =
    needsAttention[0] ??
    input.briefItems.find((item) =>
      ['deadline', 'due-soon', 'overdue', 'stale'].includes(String(item.kind ?? '')),
    );
  if (followup) {
    rows.push({
      id: 'sum-followup',
      title: followup.title ?? 'Follow up',
      detail: followup.detail,
      tone: 'followup',
    });
  }

  const reading = active.filter(looksLikeReading);
  if (reading.length > 0) {
    rows.push({
      id: 'sum-reading',
      title: `${countLabel(reading.length, 'item worth', 'items worth')} reviewing`,
      detail: reading[0].title,
      tone: 'reading',
    });
  }

  if (rows.length >= 2) return dedupe(rows).slice(0, 4);

  const fromItems = input.briefItems.slice(0, 4).map((item, index) => ({
    id: item.id ?? `brief-${index}`,
    title: item.title,
    detail: item.detail,
    tone: toneFromKind(item.kind),
  }));
  return dedupe([...rows, ...fromItems]).slice(0, 4);
}

export function opportunityStatusLine(obj: BriefObjectLike): string {
  const bits: string[] = [];
  if (looksLikeProposal(obj)) bits.push('Proposal ready');
  else if (obj.nextAction?.trim()) bits.push(obj.nextAction.trim());
  else if (obj.savePurpose?.trim()) bits.push(obj.savePurpose.trim());
  else bits.push(obj.type ?? 'Opportunity');

  if (obj.dateCaptured) bits.push(relativeUpdatedLabel(obj.dateCaptured));
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

export function formatBriefDate(date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function initialsFromTitle(title: string): string {
  const parts = title.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

const AVATAR_PALETTE = ['#1B2B4D', '#3B82F6', '#C9A844', '#7C3AED', '#0F766E', '#B45309'];

export function avatarColor(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i += 1) hash = (hash + title.charCodeAt(i) * (i + 1)) % 997;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

export function summaryToneIcon(tone: BriefHomeSummaryTone): string {
  switch (tone) {
    case 'attention':
      return '★';
    case 'proposal':
      return '▤';
    case 'followup':
      return '◉';
    case 'reading':
      return '◆';
    default:
      return '◆';
  }
}

export function toneColor(tone: BriefHomeSummaryTone): string {
  switch (tone) {
    case 'attention':
      return '#C9A844';
    case 'proposal':
      return '#3B82F6';
    case 'followup':
      return '#7C3AED';
    case 'reading':
      return '#0F766E';
    default:
      return '#1B2B4D';
  }
}

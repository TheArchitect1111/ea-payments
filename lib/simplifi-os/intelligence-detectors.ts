import type { SimplifiObject } from '@/lib/simplifi-objects';
import { isTerminalOutcome } from '@/lib/outcome-tracking';
import { buildExpirationAlerts } from '@/lib/smart-expiration';
import { buildRelationshipClusters } from '@/lib/relationship-hints';
import type { IntelligenceFindingType } from './types';

export type IntelligenceItemDraft = {
  fingerprint: string;
  itemType: IntelligenceFindingType | string;
  title: string;
  explanation: string;
  evidence: Array<{ objectId: string; label: string; detail?: string }>;
  confidence: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  relatedObjectIds: string[];
  nextAction: string;
  whyMatters: string;
  reevaluateAt: string;
  expiresAt: string;
};

function daysSince(iso?: string): number {
  if (!iso) return 999;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return 999;
  return Math.floor((Date.now() - t) / 86_400_000);
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(title: string): Set<string> {
  return new Set(normalizeTitle(title).split(' ').filter((t) => t.length > 3));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function inDays(n: number): string {
  return new Date(Date.now() + n * 86_400_000).toISOString();
}

/**
 * Rule-based detectors — records remain source of truth; no LLM required.
 */
export function detectIntelligenceItems(objects: SimplifiObject[]): IntelligenceItemDraft[] {
  const active = objects.filter((o) => !isTerminalOutcome(o.outcomeStatus) && o.status !== 'archived');
  const drafts: IntelligenceItemDraft[] = [];
  const seen = new Set<string>();

  const push = (draft: IntelligenceItemDraft) => {
    if (seen.has(draft.fingerprint)) return;
    seen.add(draft.fingerprint);
    drafts.push(draft);
  };

  // Overdue / stalled / forgotten commitments from expiration engine
  for (const alert of buildExpirationAlerts(active)) {
    const obj = active.find((o) => o.id === alert.objectId);
    if (!obj) continue;
    const type =
      alert.kind === 'overdue'
        ? 'upcoming_deadline'
        : alert.kind === 'stale'
          ? 'stalled_opportunity'
          : 'forgotten_commitment';
    push({
      fingerprint: `${type}:${obj.id}`,
      itemType: type,
      title: alert.title,
      explanation: alert.detail,
      evidence: [{ objectId: obj.id, label: obj.title, detail: alert.detail }],
      confidence: alert.kind === 'overdue' ? 0.92 : 0.78,
      priority: alert.kind === 'overdue' ? 'critical' : 'high',
      relatedObjectIds: [obj.id],
      nextAction: obj.nextAction || 'Review and set a next step',
      whyMatters: obj.whyThisMatters || alert.detail,
      reevaluateAt: inDays(1),
      expiresAt: inDays(14),
    });
  }

  // Upcoming deadlines (not yet overdue)
  for (const obj of active) {
    if (!obj.dueDate) continue;
    const due = Date.parse(obj.dueDate);
    if (!Number.isFinite(due)) continue;
    const days = Math.ceil((due - Date.now()) / 86_400_000);
    if (days < 0 || days > 7) continue;
    push({
      fingerprint: `upcoming_deadline:${obj.id}:${obj.dueDate}`,
      itemType: 'upcoming_deadline',
      title: `Due soon: ${obj.title}`,
      explanation: `Follow-up target ${obj.dueDate} (${days} day${days === 1 ? '' : 's'}).`,
      evidence: [{ objectId: obj.id, label: obj.title, detail: obj.nextAction }],
      confidence: 0.88,
      priority: days <= 2 ? 'high' : 'medium',
      relatedObjectIds: [obj.id],
      nextAction: obj.nextAction || 'Complete the scheduled follow-up',
      whyMatters: 'Upcoming commitments slip when they stay off the Brief.',
      reevaluateAt: inDays(1),
      expiresAt: obj.dueDate,
    });
  }

  // Duplicate / repeated ideas (title similarity)
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i];
      const b = active[j];
      const score = jaccard(tokenSet(a.title), tokenSet(b.title));
      if (score < 0.55) continue;
      const ids = [a.id, b.id].sort();
      push({
        fingerprint: `duplicate_work:${ids.join(':')}`,
        itemType: 'duplicate_work',
        title: 'Possible duplicate captures',
        explanation: `"${a.title}" and "${b.title}" look like the same work (similarity ${(score * 100).toFixed(0)}%).`,
        evidence: [
          { objectId: a.id, label: a.title },
          { objectId: b.id, label: b.title },
        ],
        confidence: Math.min(0.95, 0.55 + score / 2),
        priority: 'medium',
        relatedObjectIds: ids,
        nextAction: 'Merge, link, or dismiss the duplicate',
        whyMatters: 'Duplicate work fragments follow-through and confuses Orbie memory.',
        reevaluateAt: inDays(7),
        expiresAt: inDays(30),
      });
    }
  }

  // Repeated ideas — same normalized title stem appears 3+ times historically in active+recent
  const stemCounts = new Map<string, SimplifiObject[]>();
  for (const obj of objects) {
    const stem = normalizeTitle(obj.title).split(' ').slice(0, 3).join(' ');
    if (stem.length < 6) continue;
    const list = stemCounts.get(stem) ?? [];
    list.push(obj);
    stemCounts.set(stem, list);
  }
  for (const [stem, list] of stemCounts) {
    if (list.length < 3) continue;
    const ids = list.map((o) => o.id);
    push({
      fingerprint: `repeated_idea:${stem}`,
      itemType: 'repeated_idea',
      title: `Repeated idea: ${list[0].title}`,
      explanation: `You captured variants of this idea ${list.length} times.`,
      evidence: list.slice(0, 4).map((o) => ({ objectId: o.id, label: o.title })),
      confidence: 0.8,
      priority: 'medium',
      relatedObjectIds: ids.slice(0, 6),
      nextAction: 'Promote one capture to the active opportunity and archive the rest',
      whyMatters: 'Repeated mentions usually mean unfinished intent.',
      reevaluateAt: inDays(5),
      expiresAt: inDays(21),
    });
  }

  // Emerging clusters from relationship hints
  const clusters = buildRelationshipClusters(active);
  for (const cluster of clusters.slice(0, 6)) {
    if (cluster.objectIds.length < 2) continue;
    push({
      fingerprint: `emerging_opportunity:${cluster.id}`,
      itemType: 'emerging_opportunity',
      title: `Emerging connection: ${cluster.label}`,
      explanation: cluster.hint || `${cluster.objectIds.length} related captures share this cluster.`,
      evidence: cluster.objectIds.slice(0, 4).map((id) => {
        const obj = active.find((o) => o.id === id);
        return { objectId: id, label: obj?.title ?? id };
      }),
      confidence: 0.66,
      priority: 'low',
      relatedObjectIds: cluster.objectIds.slice(0, 8),
      nextAction: 'Review the cluster and confirm the primary opportunity',
      whyMatters: 'Related captures often hide a single higher-value opportunity.',
      reevaluateAt: inDays(3),
      expiresAt: inDays(21),
    });
  }

  // Dormant relationships — people/orgs with no recent activity
  for (const obj of active.filter((o) => o.type === 'Person' || o.type === 'Organization')) {
    const age = daysSince(obj.dateCaptured);
    if (age < 14) continue;
    push({
      fingerprint: `inactive_client:${obj.id}`,
      itemType: 'inactive_client',
      title: `Quiet relationship: ${obj.title}`,
      explanation: `No recent activity for ~${age} days.`,
      evidence: [{ objectId: obj.id, label: obj.title, detail: `Last captured ${obj.dateCaptured}` }],
      confidence: 0.7,
      priority: age > 30 ? 'high' : 'medium',
      relatedObjectIds: [obj.id],
      nextAction: obj.nextAction || 'Send a light-touch check-in',
      whyMatters: 'Dormant relationships quietly become lost opportunities.',
      reevaluateAt: inDays(3),
      expiresAt: inDays(30),
    });
  }

  // Increasing momentum
  for (const obj of active) {
    if ((obj.opportunityScore ?? 0) < 60) continue;
    if (daysSince(obj.dateCaptured) > 10) continue;
    push({
      fingerprint: `momentum:${obj.id}`,
      itemType: 'momentum',
      title: `Gaining momentum: ${obj.title}`,
      explanation: `Opportunity score ${obj.opportunityScore} with recent capture activity.`,
      evidence: [{ objectId: obj.id, label: obj.title, detail: obj.nextAction }],
      confidence: 0.74,
      priority: 'high',
      relatedObjectIds: [obj.id],
      nextAction: obj.nextAction || 'Take the next high-leverage step now',
      whyMatters: 'Momentum decays quickly without a visible next action.',
      reevaluateAt: inDays(2),
      expiresAt: inDays(10),
    });
  }

  // Relationship gaps — people/orgs never clustered with any opportunity
  const clustered = new Set(clusters.flatMap((c) => c.objectIds));
  const opportunities = active.filter((o) => o.type === 'Opportunity' || o.type === 'Signal');
  for (const obj of active.filter((o) => o.type === 'Person' || o.type === 'Organization')) {
    if (clustered.has(obj.id)) continue;
    if (opportunities.length < 1) continue;
    push({
      fingerprint: `relationship_gap:${obj.id}`,
      itemType: 'relationship_gap',
      title: `Unlinked relationship: ${obj.title}`,
      explanation: `${obj.type} is not connected to your active opportunities yet.`,
      evidence: [{ objectId: obj.id, label: obj.title }],
      confidence: 0.62,
      priority: 'low',
      relatedObjectIds: [obj.id],
      nextAction: 'Link this relationship to the relevant opportunity',
      whyMatters: 'Unlinked people and companies weaken Orbie’s ability to connect context.',
      reevaluateAt: inDays(5),
      expiresAt: inDays(30),
    });
  }

  // Repeatedly deferred / ignored — savePurpose watch without due progress
  for (const obj of active) {
    if (!obj.savePurpose) continue;
    if (obj.dueDate && Date.parse(obj.dueDate) > Date.now()) continue;
    if (daysSince(obj.dateCaptured) < 10) continue;
    push({
      fingerprint: `pending_promise:${obj.id}`,
      itemType: 'pending_promise',
      title: `Still waiting: ${obj.title}`,
      explanation: `Saved for "${obj.savePurpose}" but has not moved.`,
      evidence: [
        {
          objectId: obj.id,
          label: obj.title,
          detail: obj.saveReason || obj.savePurpose,
        },
      ],
      confidence: 0.72,
      priority: 'medium',
      relatedObjectIds: [obj.id],
      nextAction: obj.nextAction || 'Complete, defer with a date, or dismiss',
      whyMatters: 'Deferred items without dates become forgotten commitments.',
      reevaluateAt: inDays(2),
      expiresAt: inDays(21),
    });
  }

  return drafts;
}

export function rankIntelligenceItems(items: IntelligenceItemDraft[]): IntelligenceItemDraft[] {
  const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
  return [...items].sort((a, b) => {
    const p = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (p !== 0) return p;
    return b.confidence - a.confidence;
  });
}

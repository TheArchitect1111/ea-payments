import type { DailyBriefItem, SimplifiObject } from '@/lib/simplifi-objects';
import { buildDailyBrief } from '@/lib/simplifi-objects';
import { isSimplifiBriefIntelEnabled, isSimplifiOsConfigured } from './flags';
import { supabaseRest } from './supabase';

export type BriefIntelSectionKey =
  | 'needsAttention'
  | 'momentum'
  | 'commitmentsAtRisk'
  | 'recommendedFollowUps'
  | 'emergingConnections'
  | 'nextBestActions';

export type BriefIntelItem = {
  id: string;
  section: BriefIntelSectionKey;
  title: string;
  detail: string;
  whyMatters: string;
  nextAction: string;
  href?: string;
  confidence: number;
  priority: string;
  relatedObjectIds: string[];
  evidence: unknown;
  feedbackState: string;
  status: string;
};

export type MergedDailyBrief = ReturnType<typeof buildDailyBrief> & {
  intelligence?: {
    enabled: boolean;
    sections: Record<BriefIntelSectionKey, BriefIntelItem[]>;
  };
};

type StoredItem = {
  id: string;
  item_type: string;
  title: string;
  explanation: string;
  why_matters: string | null;
  next_action: string | null;
  confidence: number;
  priority: string;
  related_object_ids: string[] | null;
  evidence: unknown;
  feedback_state: string;
  status: string;
};

function sectionForType(type: string): BriefIntelSectionKey {
  switch (type) {
    case 'upcoming_deadline':
    case 'forgotten_commitment':
    case 'pending_promise':
      return 'commitmentsAtRisk';
    case 'stalled_opportunity':
    case 'inactive_client':
    case 'relationship_gap':
      return 'needsAttention';
    case 'momentum':
      return 'momentum';
    case 'emerging_opportunity':
    case 'duplicate_work':
    case 'repeated_idea':
      return 'emergingConnections';
    default:
      return 'recommendedFollowUps';
  }
}

function toBriefItem(row: StoredItem): BriefIntelItem {
  const primary = row.related_object_ids?.[0];
  const section = sectionForType(row.item_type);
  return {
    id: row.id,
    section,
    title: row.title,
    detail: row.explanation,
    whyMatters: row.why_matters || row.explanation,
    nextAction: row.next_action || 'Review this item',
    href: primary ? `/simplifi/opportunity/${primary}` : undefined,
    confidence: Number(row.confidence) || 0.5,
    priority: row.priority,
    relatedObjectIds: row.related_object_ids ?? [],
    evidence: row.evidence,
    feedbackState: row.feedback_state,
    status: row.status,
  };
}

function emptySections(): Record<BriefIntelSectionKey, BriefIntelItem[]> {
  return {
    needsAttention: [],
    momentum: [],
    commitmentsAtRisk: [],
    recommendedFollowUps: [],
    emergingConnections: [],
    nextBestActions: [],
  };
}

/**
 * Preserve classic Brief; optionally attach intelligence sections when flag on.
 */
export async function buildMergedDailyBrief(input: {
  objects: SimplifiObject[];
  firstName: string;
  portalSlug: string;
}): Promise<MergedDailyBrief> {
  const base = buildDailyBrief(input.objects, input.firstName, input.portalSlug);

  if (!isSimplifiBriefIntelEnabled() || !isSimplifiOsConfigured()) {
    return { ...base, intelligence: { enabled: false, sections: emptySections() } };
  }

  try {
    const rows = await supabaseRest<StoredItem[]>(
      `simplifi_intelligence_items?portal_slug=eq.${encodeURIComponent(input.portalSlug)}&status=eq.active&order=confidence.desc&limit=40&select=id,item_type,title,explanation,why_matters,next_action,confidence,priority,related_object_ids,evidence,feedback_state,status`,
      { method: 'GET' },
    );

    const sections = emptySections();
    if (!rows.ok || !Array.isArray(rows.data)) {
      return { ...base, intelligence: { enabled: true, sections } };
    }

    const seenTitles = new Set(base.items.map((i) => i.title.toLowerCase()));
    const priorityWeight: Record<string, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    const ranked = [...rows.data].sort((a, b) => {
      const pw = (priorityWeight[b.priority] ?? 0) - (priorityWeight[a.priority] ?? 0);
      if (pw !== 0) return pw;
      return Number(b.confidence) - Number(a.confidence);
    });

    for (const row of ranked) {
      if (seenTitles.has(row.title.toLowerCase())) continue;
      const item = toBriefItem(row);
      seenTitles.add(row.title.toLowerCase());
      sections[item.section].push(item);
      if (item.priority === 'critical' || item.priority === 'high') {
        sections.nextBestActions.push(item);
      }
    }

    // Cap sections
    (Object.keys(sections) as BriefIntelSectionKey[]).forEach((key) => {
      sections[key] = sections[key].slice(0, key === 'nextBestActions' ? 5 : 4);
    });

    // Surface top intel into classic items without duplicating
    const extraClassic: DailyBriefItem[] = sections.needsAttention.slice(0, 2).map((i) => ({
      id: `intel-${i.id}`,
      title: i.title,
      detail: `${i.detail} — Why: ${i.whyMatters}`,
      href: i.href,
      kind: 'stale' as const,
    }));
    const mergedItems = [...base.items];
    for (const extra of extraClassic) {
      if (!mergedItems.some((m) => m.title === extra.title)) mergedItems.push(extra);
    }

    return {
      ...base,
      items: mergedItems.slice(0, 8),
      intelligence: { enabled: true, sections },
    };
  } catch (err) {
    console.error('[simplifi-os] brief merge failed', err);
    return { ...base, intelligence: { enabled: false, sections: emptySections() } };
  }
}

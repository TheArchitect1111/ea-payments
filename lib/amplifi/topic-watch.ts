import { loadStudioRecord, saveStudioRecord } from '@/lib/creative-studio/persistence';
import { runAmplifiTopicResearch, type AmplifiTopicResearchResult } from './topic-research';

export type WatchCadence = 'daily' | 'twice-weekly' | 'weekly';
export type WatchStatus = 'active' | 'paused' | 'stopped';

export type WatchDiscovery = {
  id: string;
  at: string;
  note: string;
  newSourceCount: number;
  sources: Array<{ title: string; url: string; publishedAt?: string | null; kind: string }>;
  draftTitle: string;
};

export type AmplifiTopicWatch = {
  id: string;
  organizationId: string;
  topic: string;
  cadence: WatchCadence;
  timezone: string;
  status: WatchStatus;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  lastSummary?: string;
  lastDraftTitle?: string;
  lastDraft?: AmplifiTopicResearchResult['draft'];
  sourceHistory: Array<{ url: string; firstSeenAt: string }>;
  discoveries: WatchDiscovery[];
};

function watchId() {
  return `watch-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function key(organizationId: string) {
  return `amplifi-watch-${organizationId}`;
}

async function loadWatches(organizationId: string): Promise<AmplifiTopicWatch[]> {
  const stored = await loadStudioRecord<AmplifiTopicWatch[]>('experience', key(organizationId));
  return Array.isArray(stored) ? stored : [];
}

async function saveWatches(organizationId: string, watches: AmplifiTopicWatch[]) {
  await saveStudioRecord({
    recordType: 'experience',
    id: key(organizationId),
    organizationId,
    payload: watches,
    title: 'Amplifi Topic Watches',
  });
}

export async function listTopicWatches(organizationId: string): Promise<AmplifiTopicWatch[]> {
  const watches = await loadWatches(organizationId);
  return watches.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createTopicWatch(input: {
  organizationId: string;
  topic: string;
  cadence: WatchCadence;
  timezone: string;
}): Promise<AmplifiTopicWatch> {
  const watches = await loadWatches(input.organizationId);
  const now = new Date().toISOString();
  const next: AmplifiTopicWatch = {
    id: watchId(),
    organizationId: input.organizationId,
    topic: input.topic.trim(),
    cadence: input.cadence,
    timezone: input.timezone,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    sourceHistory: [],
    discoveries: [],
  };
  await saveWatches(input.organizationId, [next, ...watches.filter((w) => w.topic !== next.topic)]);
  return next;
}

export async function updateTopicWatch(
  organizationId: string,
  id: string,
  patch: Partial<Pick<AmplifiTopicWatch, 'status' | 'cadence' | 'timezone'>>,
): Promise<AmplifiTopicWatch | null> {
  const watches = await loadWatches(organizationId);
  const index = watches.findIndex((w) => w.id === id);
  if (index < 0) return null;
  const updated = {
    ...watches[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  watches[index] = updated;
  await saveWatches(organizationId, watches);
  return updated;
}

function cadenceDays(cadence: WatchCadence): number {
  if (cadence === 'daily') return 1;
  if (cadence === 'twice-weekly') return 3;
  return 7;
}

function dateRange(days: number) {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - days);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = '';
    return u.toString().replace(/\/$/, '');
  } catch {
    return url.trim();
  }
}

function watchDue(watch: AmplifiTopicWatch, now = new Date()): boolean {
  if (watch.status !== 'active') return false;
  if (!watch.lastRunAt) return true;
  const elapsed = now.getTime() - new Date(watch.lastRunAt).getTime();
  return elapsed >= cadenceDays(watch.cadence) * 86_400_000;
}

export async function runTopicWatch(
  watch: AmplifiTopicWatch,
): Promise<{ watch: AmplifiTopicWatch; research: AmplifiTopicResearchResult; newSourceCount: number }> {
  const range = dateRange(Math.max(7, cadenceDays(watch.cadence) * 7));
  const research = await runAmplifiTopicResearch({
    topic: watch.topic,
    dateFrom: range.from,
    dateTo: range.to,
    maxSources: 8,
    scrapeTop: 3,
  });
  const known = new Set(watch.sourceHistory.map((row) => normalizeUrl(row.url)));
  const fresh = research.sources.filter((source) => !known.has(normalizeUrl(source.url)));
  const now = new Date().toISOString();

  const sourceHistory = [...watch.sourceHistory];
  for (const source of fresh) {
    sourceHistory.push({ url: normalizeUrl(source.url), firstSeenAt: now });
  }

  const discoveries = [...watch.discoveries];
  if (fresh.length > 0) {
    discoveries.unshift({
      id: `discovery-${Date.now().toString(36)}`,
      at: now,
      note: `${fresh.length} new source${fresh.length === 1 ? '' : 's'} worth reviewing`,
      newSourceCount: fresh.length,
      sources: fresh.slice(0, 6).map((source) => ({
        title: source.title,
        url: source.url,
        kind: source.kind,
        publishedAt: source.publishedAt,
      })),
      draftTitle: research.draftTitle,
    });
  }

  return {
    research,
    newSourceCount: fresh.length,
    watch: {
      ...watch,
      updatedAt: now,
      lastRunAt: now,
      lastSummary: research.sources[0]?.title || research.topic,
      lastDraftTitle: research.draftTitle,
      lastDraft: research.draft,
      sourceHistory: sourceHistory.slice(-400),
      discoveries: discoveries.slice(0, 50),
    },
  };
}

export async function runDueTopicWatches(organizationId: string): Promise<{
  checked: number;
  updated: number;
  discoveries: number;
}> {
  const watches = await loadWatches(organizationId);
  let updated = 0;
  let discoveries = 0;
  const next = [...watches];

  for (let i = 0; i < next.length; i += 1) {
    const watch = next[i];
    if (!watchDue(watch)) continue;
    try {
      const result = await runTopicWatch(watch);
      next[i] = result.watch;
      updated += 1;
      discoveries += result.newSourceCount;
    } catch {
      next[i] = {
        ...watch,
        updatedAt: new Date().toISOString(),
      };
    }
  }

  if (updated > 0) await saveWatches(organizationId, next);
  return { checked: watches.length, updated, discoveries };
}

export async function upsertTopicWatch(input: {
  organizationId: string;
  topic: string;
  cadence: WatchCadence;
  timezone: string;
}) {
  const existing = (await loadWatches(input.organizationId)).find(
    (watch) => watch.topic.toLowerCase() === input.topic.trim().toLowerCase(),
  );
  if (!existing) return createTopicWatch(input);
  return (
    await updateTopicWatch(input.organizationId, existing.id, {
      status: 'active',
      cadence: input.cadence,
      timezone: input.timezone,
    })
  )!;
}

export async function saveTopicWatchResult(organizationId: string, watch: AmplifiTopicWatch) {
  const watches = await loadWatches(organizationId);
  const index = watches.findIndex((row) => row.id === watch.id);
  if (index < 0) {
    await saveWatches(organizationId, [watch, ...watches]);
    return;
  }
  watches[index] = watch;
  await saveWatches(organizationId, watches);
}

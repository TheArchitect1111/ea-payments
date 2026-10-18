import 'server-only';
import { readFileSync, statSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

export type HelpEntry = {
  key: string; group: string; label: string; href: string | null;
  steps: string[]; location?: string; audience?: string;
  roles?: string[]; verification?: string; behavior?: string;
  source?: string; raw: Record<string, unknown>;
};
export type KnowledgeManifest = {
  manifestId: string; schemaVersion: string;
  audit?: { date?: string };
  menus: Record<string, unknown>;
  questionsEvaCannotReliablyAnswerToday?: Array<{ question: string; reason?: string }>;
  stepByStepWorkflows?: Record<string, string[]>;
};
type PortalConfig = { manifestFile: string; expectedEntries: number; origin: string };
export type LoadedKnowledge = {
  portalId: string; origin: string; expectedEntries: number;
  manifest: KnowledgeManifest; entries: HelpEntry[]; lastRefreshTime: string;
};
const root = resolve(process.cwd(), 'knowledge');
const registryFile = join(root, 'eva-portal-help-registry.json');
const cache = new Map<string, { fingerprint: string; value: LoadedKnowledge }>();
const liveCache = new Map<string, LoadedKnowledge>();

/** Vercel preview releases are immutable: current knowledge is a private Blob snapshot. */
export function previewKnowledgePrefix(): string | null {
  if (process.env.VERCEL_ENV !== 'preview' && process.env.EVA_WATCHER_TEST_MODE !== '1') return null;
  const branch = process.env.VERCEL_GIT_COMMIT_REF || 'local-test';
  return 'eva-portal-help/preview/' + branch.replace(/[^a-z0-9-]/gi, '-').slice(0, 100);
}
export function knowledgeSnapshotPath(portalId: string): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(portalId)) throw new Error('Invalid portal id');
  const prefix = previewKnowledgePrefix();
  if (!prefix) throw new Error('Runtime knowledge overrides are limited to preview');
  return prefix + '/manifests/' + portalId + '/current.json';
}


function withinKnowledge(filename: string): string {
  if (!/^[a-z0-9][a-z0-9-]*\.json$/.test(filename)) throw new Error('Invalid knowledge filename');
  const target = resolve(root, filename);
  if (!target.startsWith(root + sep)) throw new Error('Knowledge path escapes root');
  return target;
}
function registry(): Record<string, PortalConfig> {
  const parsed: unknown = JSON.parse(readFileSync(registryFile, 'utf8'));
  const data = parsed as { portals?: Record<string, PortalConfig> };
  if (!data || !data.portals || typeof data.portals !== 'object') throw new Error('Knowledge registry unavailable');
  return data.portals;
}
function string(value: unknown): string { return typeof value === 'string' ? value.trim() : ''; }
function stepsFrom(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((step): step is string => typeof step === 'string' && step.trim().length > 0) : [];
}
function collectEntries(menus: Record<string, unknown>): HelpEntry[] {
  const entries: HelpEntry[] = [];
  for (const [group, contents] of Object.entries(menus)) {
    if (!Array.isArray(contents)) continue; // Audit notes are objects, not menu controls.
    contents.forEach((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('Invalid menu entry: ' + group + ':' + index);
      const raw = item as Record<string, unknown>;
      const label = string(raw.label) || string(raw.title) || string(raw.button) ||
        string(raw.control) || string(raw.section) || string(raw.id);
      if (!label) throw new Error('Menu entry without label: ' + group + ':' + index);
      const href = string(raw.href) || string(raw.ctaDestination) || string(raw.path) ||
        string(raw.potentialHref) || null;
      entries.push({
        key: group + ':' + index, group, label, href,
        steps: stepsFrom(raw.steps), location: string(raw.location),
        audience: string(raw.audience), roles: Array.isArray(raw.roles) ? raw.roles.filter((x): x is string => typeof x === 'string') : [],
        behavior: string(raw.behavior) || string(raw.action),
        verification: string(raw.verification), source: string(raw.source), raw
      });
    });
  }
  return entries;
}
export function loadPortalKnowledge(portalId: string): LoadedKnowledge {
  const live = liveCache.get(portalId);
  if (live) return live;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(portalId)) throw new Error('Invalid portal id');
  const conf = registry()[portalId];
  if (!conf) throw new Error('Portal knowledge is not registered: ' + portalId);
  if (!Number.isSafeInteger(conf.expectedEntries) || conf.expectedEntries <= 0) throw new Error('Invalid expected menu count');
  const origin = new URL(conf.origin);
  if (origin.protocol !== 'https:' || origin.pathname !== '/') throw new Error('Invalid portal origin');
  const path = withinKnowledge(conf.manifestFile);
  const stamp = statSync(path);
  const fingerprint = [path, stamp.mtimeMs, stamp.size, conf.expectedEntries, conf.origin].join(':');
  const previous = cache.get(portalId);
  if (previous?.fingerprint === fingerprint) return previous.value;
  const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));
  const manifest = parsed as KnowledgeManifest;
  if (!manifest || typeof manifest.manifestId !== 'string' || !manifest.menus || typeof manifest.menus !== 'object') {
    throw new Error('Malformed portal help manifest');
  }
  const entries = collectEntries(manifest.menus);
  if (entries.length !== conf.expectedEntries) throw new Error('Menu inventory mismatch: expected ' + conf.expectedEntries + ', got ' + entries.length);
  const value: LoadedKnowledge = { portalId, origin: origin.origin, expectedEntries: conf.expectedEntries, manifest, entries, lastRefreshTime: new Date().toISOString() };
  cache.set(portalId, { fingerprint, value });
  return value;
}
export function health(portalId: string): { status: 200 | 503; ok: boolean; error?: string } {
  try { loadPortalKnowledge(portalId); return { status: 200, ok: true }; }
  catch { return { status: 503, ok: false, error: 'Portal help knowledge unavailable' }; }
}
export function knowledge(portalId: string): { portalId: string; entryCount: number; lastRefreshTime: string } {
  const d = loadPortalKnowledge(portalId);
  return { portalId: d.portalId, entryCount: d.entries.length, lastRefreshTime: d.lastRefreshTime };
}

/** Validates a refreshed manifest using its own tenant registry, not another portal's roles. */
export function setLivePortalKnowledge(portalId: string, manifest: KnowledgeManifest, lastRefreshTime: string): LoadedKnowledge {
  const conf = registry()[portalId];
  if (!conf) throw new Error('Unregistered portal');
  const origin = new URL(conf.origin);
  if (origin.protocol !== 'https:') throw new Error('Unsafe origin');
  if (!manifest || typeof manifest.manifestId !== 'string' || !manifest.menus || typeof manifest.menus !== 'object') throw new Error('Malformed refreshed manifest');
  const entries = collectEntries(manifest.menus);
  if (entries.length < 1 || entries.length > 2000) throw new Error('Refreshed menu count outside supported range');
  if (!Array.isArray((manifest as KnowledgeManifest & { roles?: unknown[] }).roles)) throw new Error('Missing role policy');
  if (!Number.isFinite(Date.parse(lastRefreshTime))) throw new Error('Invalid refresh time');
  const data: LoadedKnowledge = { portalId, origin: origin.origin, expectedEntries: entries.length,
    manifest, entries, lastRefreshTime };
  liveCache.set(portalId, data);
  return data;
}
export function clearLivePortalKnowledge(portalId: string): void { liveCache.delete(portalId); }
export async function loadPortalKnowledgeLive(portalId: string): Promise<LoadedKnowledge> {
  const conf = registry()[portalId];
  if (!conf) throw new Error('Unregistered portal');
  if (!previewKnowledgePrefix() || !process.env.BLOB_READ_WRITE_TOKEN) return loadPortalKnowledge(portalId);
  const { get } = await import('@vercel/blob');
  const found = await get(knowledgeSnapshotPath(portalId), { access: 'private', useCache: false });
  if (!found) { clearLivePortalKnowledge(portalId); return loadPortalKnowledge(portalId); }
  if (found.statusCode !== 200 || !found.stream) throw new Error('Knowledge snapshot unreadable');
  const raw = await new Response(found.stream).text();
  if (raw.length > 3_000_000) throw new Error('Knowledge snapshot too large');
  const document = JSON.parse(raw) as { portalId?: string; manifest?: KnowledgeManifest; lastRefreshTime?: string; entryCount?: number };
  if (document.portalId !== portalId || !document.manifest || !document.lastRefreshTime) throw new Error('Invalid tenant snapshot');
  const loaded = setLivePortalKnowledge(portalId, document.manifest, document.lastRefreshTime);
  if (loaded.entries.length !== document.entryCount) throw new Error('Snapshot entry count mismatch');
  return loaded;
}

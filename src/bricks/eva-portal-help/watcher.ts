import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { get, put } from '@vercel/blob';
import {
  knowledgeSnapshotPath, loadPortalKnowledge, previewKnowledgePrefix,
  setLivePortalKnowledge, type KnowledgeManifest,
} from './manifest-loader';

type WatchConfig = {
  manifestFile: string;
  sourceUrl: string;
  origin: string;
  expectedEntries: number;
};
type StoredSnapshot = {
  portalId: string;
  manifest: KnowledgeManifest;
  entryCount: number;
  lastRefreshTime: string;
  sourceHash: string;
};
type RefreshEvent = {
  type: 'eva.portal-help.refresh'; portalId: string; at: string;
  changed: boolean; entryCount: number; lastRefreshTime: string;
  sourceHash: string; backupPath: string | null;
};
export type WatchStore = {
  read: (pathname: string) => Promise<string | null>;
  write: (pathname: string, body: string, overwrite: boolean) => Promise<void>;
};
export type WatchDependencies = {
  store?: WatchStore;
  readSource?: (url: string) => Promise<string>;
  now?: () => string;
};
const MAX_BYTES = 3_000_000;
const digest = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
function config(portalId: string): WatchConfig {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(portalId)) throw new Error('Invalid portal ID');
  const parsed = JSON.parse(readFileSync(resolve(process.cwd(), 'knowledge/eva-portal-help-registry.json'), 'utf8')) as { portals?: Record<string, WatchConfig> };
  const item = parsed.portals?.[portalId];
  if (!item) throw new Error('Portal not registered');
  if (!/^[a-z0-9-]+\.json$/.test(item.manifestFile)) throw new Error('Invalid source name');
  const url = new URL(item.sourceUrl);
  if (url.protocol !== 'https:' || url.hostname !== 'raw.githubusercontent.com' ||
    !url.pathname.endsWith('/knowledge/' + item.manifestFile) ||
    !url.pathname.includes('/TheArchitect1111/ea-payments/')) {
    throw new Error('Menu source must be a registered EA repository JSON document');
  }
  return item;
}
const privateStore: WatchStore = {
  async read(pathname) {
    const result = await get(pathname, { access: 'private', useCache: false });
    if (!result) return null;
    if (result.statusCode !== 200 || !result.stream) throw new Error('Private Blob read failed');
    const contents = await new Response(result.stream).text();
    if (contents.length > MAX_BYTES) throw new Error('Private Blob exceeds size limit');
    return contents;
  },
  async write(pathname, contents, overwrite) {
    await put(pathname, contents, {
      access: 'private', contentType: 'application/json', addRandomSuffix: false,
      allowOverwrite: overwrite,
    });
  }
};
async function defaultSource(url: string): Promise<string> {
  const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error('Source menu registry fetch failed: HTTP ' + res.status);
  const text = await res.text();
  if (text.length > MAX_BYTES) throw new Error('Source registry too large');
  return text;
}
function numberOfEntries(manifest: KnowledgeManifest): number {
  if (!manifest || !manifest.menus || typeof manifest.menus !== 'object') throw new Error('Invalid menu source');
  let count = 0;
  for (const list of Object.values(manifest.menus)) if (Array.isArray(list)) {
    count += list.length;
    for (const entry of list) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error('Malformed source entry');
      const item = entry as {label?: string; title?:string; button?:string; control?:string; section?:string; id?:string};
      if (![item.label,item.title,item.button,item.control,item.section,item.id].some(x=>typeof x==='string'&&x.trim())) throw new Error('Unlabeled source entry');
    }
  }
  if (count < 1 || count > 2000) throw new Error('Unsafe source inventory size');
  return count;
}
/** Preserve source instructions but replace obsolete control names when the label changes. */
function withUpdatedLabels(next: KnowledgeManifest, previous: KnowledgeManifest): KnowledgeManifest {
  const manifest: KnowledgeManifest = structuredClone(next);
  for (const [group, entries] of Object.entries(manifest.menus)) {
    const prior = previous.menus[group];
    if (!Array.isArray(entries) || !Array.isArray(prior)) continue;
    entries.forEach((item: Record<string, unknown>, index: number) => {
      const before = prior[index] as Record<string, unknown> | undefined;
      if (!before || typeof item?.label !== 'string' || typeof before.label !== 'string' ||
        item.label === before.label) return;
      const oldHref = String(before.href || before.path || '');
      const newHref = String(item.href || item.path || '');
      if (!oldHref || oldHref !== newHref) return; // Never silently remap a different control.
      if (Array.isArray(item.steps)) {
        item.steps = item.steps.map(step => typeof step === 'string'
          ? step.split(before.label as string).join(item.label as string) : step);
      }
    });
  }
  return manifest;
}
/** Refreshes only the registered portal. Production writes are never permitted. */
export async function refreshPortalKnowledge(portalId: string, deps: WatchDependencies = {}) {
  const conf = config(portalId);
  const prefix = previewKnowledgePrefix();
  if (!prefix) throw new Error('Refresh is preview-only');
  const store = deps.store ?? privateStore;
  if (!deps.store && !process.env.BLOB_READ_WRITE_TOKEN) throw new Error('Private Blob credentials unavailable');
  const readSource = deps.readSource ?? defaultSource;
  const now = deps.now?.() ?? new Date().toISOString();
  if (!Number.isFinite(Date.parse(now))) throw new Error('Invalid time');
  const raw = await readSource(conf.sourceUrl);
  if (raw.length > MAX_BYTES) throw new Error('Source registry too large');
  const source = JSON.parse(raw) as KnowledgeManifest;
  if (!source || typeof source.manifestId !== 'string' || typeof source.schemaVersion !== 'string' ||
    !Array.isArray((source as KnowledgeManifest & {roles?:unknown}).roles)) throw new Error('Invalid source manifest');
  numberOfEntries(source);
  const currentPath = knowledgeSnapshotPath(portalId);
  const previousText = await store.read(currentPath);
  const previousSnapshot: StoredSnapshot | null = previousText ? JSON.parse(previousText) as StoredSnapshot : null;
  if (previousSnapshot && previousSnapshot.portalId !== portalId) throw new Error('Snapshot cross-tenant mismatch');
  const baseline = previousSnapshot?.manifest ?? loadPortalKnowledge(portalId).manifest;
  const next = withUpdatedLabels(source, baseline);
  const entryCount = numberOfEntries(next);
  const sourceHash = digest({ menus: next.menus, roles: (next as KnowledgeManifest & {roles?:unknown}).roles,
    helpQuestionRouting: (next as KnowledgeManifest & {helpQuestionRouting?:unknown}).helpQuestionRouting });
  const changed = previousSnapshot ? previousSnapshot.sourceHash !== sourceHash :
    digest({ menus: baseline.menus, roles:(baseline as KnowledgeManifest & {roles?:unknown}).roles,
      helpQuestionRouting:(baseline as KnowledgeManifest & {helpQuestionRouting?:unknown}).helpQuestionRouting }) !== sourceHash;
  let lastRefreshTime = previousSnapshot?.lastRefreshTime ?? now;
  let backupPath: string | null = null;

  if (changed || !previousSnapshot) {
    // On the first refresh keep the bundled baseline, even when there is no prior Blob.
    const prior = previousSnapshot ?? {portalId,manifest:baseline,
      entryCount:numberOfEntries(baseline),lastRefreshTime:now,sourceHash:digest(baseline)};
    backupPath = prefix+'/backups/'+portalId+'/'+now.replace(/[:.]/g,'-')+'-'+randomUUID()+'.json';
    await store.write(backupPath, JSON.stringify(prior), false);
    if (changed) lastRefreshTime=now;
    const replacement: StoredSnapshot = {portalId,manifest:next,entryCount,lastRefreshTime,sourceHash};
    await store.write(currentPath, JSON.stringify(replacement), true);
    const echoed = await store.read(currentPath);
    if (!echoed || (JSON.parse(echoed) as StoredSnapshot).sourceHash !== sourceHash) {
      throw new Error('Private Blob write verification failed');
    }
  }
  const active = changed || !previousSnapshot ? next : previousSnapshot.manifest;
  const result = setLivePortalKnowledge(portalId, active, lastRefreshTime);
  if (result.entries.length !== entryCount) throw new Error('Activated inventory mismatch');
  const logPath = prefix+'/refresh-logs/'+portalId+'/'+now.replace(/[:.]/g,'-')+'-'+randomUUID()+'.json';
  const event: RefreshEvent = {type:'eva.portal-help.refresh',portalId,at:now,changed,
    entryCount,lastRefreshTime,sourceHash,backupPath};
  await store.write(logPath, JSON.stringify(event), false);
  return {ok:true,portalId,changed,entryCount,lastRefreshTime,backupPath,logPath};
}
export async function refreshAllRegisteredPortals(deps:WatchDependencies = {}) {
  const parsed = JSON.parse(readFileSync(resolve(process.cwd(), 'knowledge/eva-portal-help-registry.json'),'utf8')) as {portals:Record<string,unknown>};
  const results: Array<{portalId:string;ok:boolean;entryCount?:number;error?:string}> = [];
  for (const portalId of Object.keys(parsed.portals)) {
    try {
      const r = await refreshPortalKnowledge(portalId, deps);
      results.push({portalId,ok:true,entryCount:r.entryCount});
    } catch (e) {
      results.push({portalId,ok:false,error:e instanceof Error?e.message:'Refresh failed'});
    }
  }
  return {ok:results.every(result=>result.ok), results};
}

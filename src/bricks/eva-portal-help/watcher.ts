import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { get, put } from '@vercel/blob';
import {
  knowledgeSnapshotPath, loadPortalKnowledge, previewKnowledgePrefix,
  setLivePortalKnowledge, type KnowledgeManifest,
} from './manifest-loader';

export type LiveMenuSource = {kind:'app-config'|'html-nav';group:string;file?:string;path?:string;ariaLabel?:string;hrefPrefix?:string;roles:string[]};
export type LiveMenuItem = {label:string;href:string;section?:string;roles?:string[]};
type WatchConfig = {liveSources?:LiveMenuSource[];
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
  mode?: 'manifest' | 'live';
  readLiveSource?: (source:LiveMenuSource, conf:WatchConfig)=>Promise<LiveMenuItem[]>;
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

const safeFile=/^knowledge\/eva-menu-sources\/[a-z0-9-]+\.json$/;
function checkLive(source:LiveMenuSource,conf:WatchConfig) {
  if(!/^[a-zA-Z][a-zA-Z0-9]*$/.test(source.group)||!Array.isArray(source.roles)||!source.roles.length)
    throw Error('Invalid nav group or roles');
  if(source.kind==='app-config') {
    if(!source.file||!safeFile.test(source.file))throw Error('Invalid app menu file');
  } else if(source.kind==='html-nav') {
    if(!source.path||!/^\/[a-z0-9/-]*$/.test(source.path)||!source.ariaLabel)throw Error('Invalid nav selector');
    if(source.hrefPrefix&&!/^\/[a-z0-9/-]*$/.test(source.hrefPrefix))throw Error('Invalid nav link prefix');
    if(new URL(conf.origin).protocol!=='https:')throw Error('Invalid origin');
  } else throw Error('Unsupported source kind');
}
function unescapeHtml(text:string) {
  return text.replace(/&(#x[0-9a-f]+|#[0-9]+|amp|quot|apos|lt|gt|nbsp);/gi,(_,e:string)=>{
    const named:Record<string,string>={amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' '};
    if(e.startsWith('#')) {
      const cp=e[1]==='x'?parseInt(e.slice(2),16):parseInt(e.slice(1),10);
      return cp>31&&cp<=0x10ffff?String.fromCodePoint(cp):'';
    }
    return named[e.toLowerCase()]||'';
  });
}
export function parseLiveNavigation(html:string,source:LiveMenuSource):LiveMenuItem[] {
  if(!source.ariaLabel)throw Error('Missing source selector');
  const nav=[...html.matchAll(/<nav\b([^>]*)>([\s\S]*?)<\/nav>/gi)].find(match=>{
    const label=match[1].match(/\baria-label=["']([^"']+)["']/i)?.[1];
    return label&&unescapeHtml(label)===source.ariaLabel;
  });
  if(!nav)throw Error('Live nav selector missing');
  const items:LiveMenuItem[]=[];
  for(const match of nav[2].matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const href=unescapeHtml(match[1].match(/\bhref=["']([^"']+)["']/i)?.[1]||'');
    const label=unescapeHtml(match[2].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim());
    if(!href||!label||label.length>150)continue;
    const resolved=href[0]==='#'?(source.hrefPrefix||'')+href:href;
    if(!resolved.startsWith('/')&&!resolved.startsWith('#')&&!resolved.startsWith('https://'))continue;
    items.push({label,href:resolved,section:source.group,roles:source.roles});
  }
  if(!items.length)throw Error('Live nav returned no items');
  return items;
}
async function getLiveMenu(source:LiveMenuSource,conf:WatchConfig):Promise<LiveMenuItem[]>{
  checkLive(source,conf);
  if(source.kind==='app-config') {
    const file=JSON.parse(readFileSync(resolve(process.cwd(),source.file!),'utf8')) as {group?:string;items?:LiveMenuItem[]};
    if(file.group!==source.group||!Array.isArray(file.items))throw Error('App nav config invalid');
    return file.items;
  }
  const url=new URL(source.path!,conf.origin);
  if(url.origin!==new URL(conf.origin).origin)throw Error('Cross-site source');
  const res=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!res.ok||!res.headers.get('content-type')?.includes('text/html'))throw Error('Live nav HTTP '+res.status);
  if(new URL(res.url).hostname.replace(/^www\./,'')!==url.hostname.replace(/^www\./,''))throw Error('Cross-site redirect');
  const html=await res.text();
  if(html.length>MAX_BYTES)throw Error('Live page too large');
  return parseLiveNavigation(html,source);
}
function mergeLive(baseline:KnowledgeManifest,readings:{source:LiveMenuSource;items:LiveMenuItem[]}[]):KnowledgeManifest{
  const next=structuredClone(baseline);
  for(const {source,items} of readings){
    if(!Array.isArray(items)||!items.length||items.length>300)throw Error('Invalid live menu size');
    const previous=Array.isArray(next.menus[source.group])?next.menus[source.group] as Record<string,unknown>[]:[];
    const old=new Map(previous.map(item=>[String(item.href||''),item]));
    const seen=new Set<string>();
    next.menus[source.group]=items.map(item=>{
      if(!item||!item.label||!item.href||seen.has(item.href))throw Error('Invalid or duplicate live menu');
      if(!item.href.startsWith('/')&&!item.href.startsWith('#')&&!item.href.startsWith('https://'))throw Error('Unsafe href');
      seen.add(item.href);
      const before=old.get(item.href);
      const roles=source.roles.filter(role=>(item.roles||source.roles).includes(role));
      if(!roles.length)throw Error('No allowed role');
      const previousSteps=Array.isArray(before?.steps)?before.steps.filter(x=>typeof x==='string') as string[]:[];
      const prevLabel=typeof before?.label==='string'?before.label:'';
      return {label:item.label,href:item.href,section:item.section||source.group,roles,
        location:source.group,verification:'live-nav-source',source:source.kind,
        steps:previousSteps.length?previousSteps.map(step=>prevLabel?step.split(prevLabel).join(item.label):step)
          :["Open the "+source.group+" menu.","Select "+item.label+"."]};
    });
  }
  return next;
}
function liveDiff(before:KnowledgeManifest,after:KnowledgeManifest,groups:string[]){
  const diff:{group:string;operation:'added'|'removed'|'updated';label:string;href:string}[]=[];
  for(const group of groups){
    const a=Array.isArray(before.menus[group])?before.menus[group] as Record<string,unknown>[]:[];
    const b=Array.isArray(after.menus[group])?after.menus[group] as Record<string,unknown>[]:[];
    const left=new Map(a.map(x=>[String(x.href||''),x]));
    const right=new Map(b.map(x=>[String(x.href||''),x]));
    for(const [href,item] of right){
      const old=left.get(href);
      if(!old)diff.push({group,operation:'added',label:String(item.label),href});
      else if(old.label!==item.label||JSON.stringify(old.roles)!==JSON.stringify(item.roles))
        diff.push({group,operation:'updated',label:String(item.label),href});
    }
    for(const [href,item] of left)if(!right.has(href))
      diff.push({group,operation:'removed',label:String(item.label),href});
  }
  return diff;
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
/** Refreshes only the registered portal in the active Vercel environment. */
export async function refreshPortalKnowledge(portalId: string, deps: WatchDependencies = {}) {
  const conf = config(portalId);
  const prefix = previewKnowledgePrefix();
  if (!prefix) throw new Error('Refresh requires a supported Vercel environment');
  const store = deps.store ?? privateStore;
  if (!deps.store && !process.env.BLOB_READ_WRITE_TOKEN) throw new Error('Private Blob credentials unavailable');
  const readSource = deps.readSource ?? defaultSource;
  const now = deps.now?.() ?? new Date().toISOString();
  if (!Number.isFinite(Date.parse(now))) throw new Error('Invalid time');
  const mode=deps.mode||'manifest';
  if(mode!=='manifest'&&mode!=='live')throw Error('Invalid refresh mode');
  const raw=mode==='manifest'?await readSource(conf.sourceUrl):'';
  if (raw.length > MAX_BYTES) throw new Error('Source registry too large');
  const source=mode==='manifest'?JSON.parse(raw) as KnowledgeManifest:null;
  if(mode==='manifest'){
    if(!source||typeof source.manifestId!=='string'||typeof source.schemaVersion!=='string'||
      !Array.isArray((source as KnowledgeManifest & {roles?:unknown}).roles))throw Error('Invalid source manifest');
    numberOfEntries(source);
  }
  const currentPath = knowledgeSnapshotPath(portalId);
  const previousText = await store.read(currentPath);
  const previousSnapshot: StoredSnapshot | null = previousText ? JSON.parse(previousText) as StoredSnapshot : null;
  if (previousSnapshot && previousSnapshot.portalId !== portalId) throw new Error('Snapshot cross-tenant mismatch');
  const baseline = previousSnapshot?.manifest ?? loadPortalKnowledge(portalId).manifest;
  const readings=mode==='live'?await Promise.all((conf.liveSources||[]).map(async source=>{
    checkLive(source,conf);
    return {source,items:await (deps.readLiveSource||getLiveMenu)(source,conf)};
  })):[];
  if(mode==='live'&&!readings.length)throw Error('No live nav configured');
  const next=mode==='live'?mergeLive(baseline,readings):withUpdatedLabels(source!,baseline);
  const changedItems=mode==='live'?liveDiff(baseline,next,readings.map(r=>r.source.group)):[];
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
  await store.write(logPath, JSON.stringify({...event,mode,changedItemsCount:changedItems.length,diff:changedItems}),false);
  return {ok:true,portalId,mode,changed,changedItemsCount:changedItems.length,entryCount,lastRefreshTime,backupPath,logPath};
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

import { get, list, put } from '@vercel/blob';
import type * as FileSystemPromises from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

export const SHELVES = [
  { id: 'top', label: 'TOP', detail: 'Hero / Videos' },
  { id: 'middle', label: 'MIDDLE', detail: 'Warm Letter / Text Blocks' },
  { id: 'form', label: 'FORM', detail: 'Intake / Registration Forms' },
  { id: 'gallery', label: 'GALLERY', detail: 'Photos / Film Vault' },
  { id: 'footer', label: 'FOOTER', detail: 'Contact / Links' },
] as const;
export type ShelfId = (typeof SHELVES)[number]['id'];
export type ContentWhen = 'always' | 'register' | 'waitlist' | 'foundry' | 'multiple';
export type ContentAudience = 'everyone' | 'waitlist' | 'foundry';
export type ContentStatus = 'draft' | 'live';
export type HqItem = {
  id: string; shelf: ShelfId; title: string; text: string; mediaUrl?: string; posterUrl?: string;
  mediaType?: 'image' | 'video'; buttonLabel?: string; destination?: string; when: ContentWhen;
  audience: ContentAudience; status: ContentStatus; scheduledAt?: string; updatedAt: string; updatedBy: string;
};
export type FormDestination = { emails: string[]; sheetUrl?: string };
export type ProjectSummary = { id: string; name: string; domain: string };
export type HqProject = {
  id: string; name: string; domain: string; livePath: string; shelves: ShelfId[]; lockDesign: boolean;
  items: HqItem[]; formDestinations: Record<string, FormDestination>; updatedAt: string; updatedBy: string;
};

const ROOT = 'data/content';
const PROJECTS_PATH = 'data/projects.json';
const TMP_ROOT = join(tmpdir(), 'universal-phone-hq-data');
type RuntimeFileSystem = typeof FileSystemPromises;
function runtimeFs(): RuntimeFileSystem {
  const getBuiltinModule = (process as NodeJS.Process & { getBuiltinModule: (specifier: string) => RuntimeFileSystem }).getBuiltinModule;
  return getBuiltinModule('node:fs/promises');
}
let localFallbackUsed = !process.env.BLOB_READ_WRITE_TOKEN;
export function hqStorageStatus() { return localFallbackUsed ? 'local' : 'blob'; }
function contentPath(id: string) { return ROOT + '/' + id + '/project.json'; }
function isValidId(id: string) { return /^[a-z0-9][a-z0-9-]{0,48}$/.test(id); }
function safeLocalPath(root: string, pathname: string) {
  const result = resolve(root, pathname);
  if (!result.startsWith(resolve(root) + '/')) throw new Error('Invalid HQ storage path.');
  return result;
}
function safeLocalMediaPath(root: string, kind: 'image' | 'video', id: string, filename: string) {
  const folder = kind === 'image' ? 'public/uploads' : 'public/videos';
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '-');
  const result = resolve(root, folder, id, safeName);
  if (!isValidId(id) || !result.startsWith(resolve(root) + '/')) throw new Error('Invalid HQ media path.');
  return result;
}
async function readLocalJson<T>(pathname: string): Promise<T | null> {
  for (const root of [TMP_ROOT, resolve(process.cwd())]) {
    try { return JSON.parse(await runtimeFs().readFile(safeLocalPath(root, pathname), 'utf8')) as T; } catch {}
  }
  return null;
}
async function writeLocalJson(pathname: string, value: unknown) {
  const serialized = JSON.stringify(value, null, 2);
  for (const root of [resolve(process.cwd()), TMP_ROOT]) {
    const target = safeLocalPath(root, pathname);
    try { await runtimeFs().mkdir(dirname(target), { recursive: true }); await runtimeFs().writeFile(target, serialized, 'utf8'); localFallbackUsed = true; return; } catch {}
  }
  throw new Error('Local HQ storage is unavailable.');
}
async function readBlobJson<T>(pathname: string): Promise<T | null> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try { const file = await get(pathname, { access: 'private', useCache: false }); if (file?.statusCode === 200) return JSON.parse(await new Response(file.stream).text()) as T; } catch { localFallbackUsed = true; }
  }
  return readLocalJson<T>(pathname);
}
async function writeBlobJson(pathname: string, value: unknown) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try { await put(pathname, Buffer.from(JSON.stringify(value), 'utf8'), { access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true }); return; } catch { localFallbackUsed = true; }
  }
  await writeLocalJson(pathname, value);
}
async function saveProjectManifest(project: ProjectSummary) {
  const manifest = await readBlobJson<ProjectSummary[]>(PROJECTS_PATH) ?? [];
  const next = [...manifest.filter((entry) => entry.id !== project.id), project].sort((a, b) => a.name.localeCompare(b.name));
  await writeBlobJson(PROJECTS_PATH, next);
}
export async function listHqProjects(): Promise<HqProject[]> {
  const manifest = await readBlobJson<ProjectSummary[]>(PROJECTS_PATH) ?? [];
  const byId = new Map<string, HqProject>();
  for (const entry of manifest) {
    if (!entry || !isValidId(entry.id)) continue;
    const saved = await readBlobJson<HqProject>(contentPath(entry.id));
    if (saved) byId.set(entry.id, saved);
  }
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { blobs } = await list({ prefix: ROOT + '/', limit: 500 });
      for (const blob of blobs) {
        if (!blob.pathname.endsWith('/project.json')) continue;
        const project = await readBlobJson<HqProject>(blob.pathname);
        if (project && isValidId(project.id)) byId.set(project.id, project);
      }
    } catch { localFallbackUsed = true; }
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}
export async function getHqProject(id: string): Promise<HqProject | null> {
  if (!isValidId(id)) return null;
  const saved = await readBlobJson<HqProject>(contentPath(id));
  if (!saved) return null;
  const [rules, destinations] = await Promise.all([
    readBlobJson<Record<string, Pick<HqItem, 'when' | 'audience'>>>(ROOT + '/' + id + '/rules.json'),
    readBlobJson<Record<string, FormDestination>>(ROOT + '/' + id + '/form-destinations.json'),
  ]);
  return { ...saved, items: saved.items.map((item) => ({ ...item, ...(rules?.[item.id] ?? {}) })), formDestinations: destinations ?? saved.formDestinations };
}
export async function saveHqProject(project: HqProject) {
  if (!isValidId(project.id)) throw new Error('Project ID is invalid.');
  const previous = await readBlobJson<HqProject>(contentPath(project.id));
  if (previous) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const pathname = ROOT + '/' + project.id + '/history/' + stamp + '.json';
    await writeBlobJson(pathname, { ...previous, savedAt: new Date().toISOString() });
    const indexPath = ROOT + '/' + project.id + '/history/index.json';
    const existing = await readBlobJson<Array<{ pathname: string; savedAt: string }>>(indexPath) ?? [];
    const keep = existing.filter((entry) => Date.now() - new Date(entry.savedAt).getTime() <= 30 * 86400000);
    await writeBlobJson(indexPath, [...keep, { pathname, savedAt: new Date().toISOString() }]);
  }
  const shelves = project.shelves ?? SHELVES.map(({ id }) => id);
  await Promise.all([
    writeBlobJson(contentPath(project.id), { ...project, shelves }),
    writeBlobJson(ROOT + '/' + project.id + '/shelves.json', shelves),
    ...SHELVES.map(({ id }) => writeBlobJson(ROOT + '/' + project.id + '/shelves/' + id + '.json', project.items.filter((item) => item.shelf === id))),
    writeBlobJson(ROOT + '/' + project.id + '/rules.json', Object.fromEntries(project.items.map(({ id, when, audience }) => [id, { when, audience }]))),
    writeBlobJson(ROOT + '/' + project.id + '/form-destinations.json', project.formDestinations),
    saveProjectManifest({ id: project.id, name: project.name, domain: project.domain }),
  ]);
}
export async function undoHqProject(id: string): Promise<HqProject | null> {
  if (!isValidId(id)) return null;
  const history = process.env.BLOB_READ_WRITE_TOKEN
    ? (await list({ prefix: ROOT + '/' + id + '/history/', limit: 1000 })).blobs.filter((blob) => /\/history\/\d{4}-/.test(blob.pathname))
    : [];
  const recent = history.filter((blob) => Date.now() - new Date(blob.uploadedAt).getTime() <= 30 * 86400000).sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  const snapshot = recent[0] ? await readBlobJson<HqProject & { savedAt?: string }>(recent[0].pathname) : null;
  if (!snapshot) return null;
  const restored = { ...snapshot, updatedAt: new Date().toISOString(), updatedBy: 'Admin' };
  await saveHqProject(restored);
  return restored;
}
export function makePublicProject(project: HqProject): HqProject {
  const now = Date.now();
  return { ...project, formDestinations: {}, items: project.items.filter((item) => item.status === 'live' || Boolean(item.scheduledAt && new Date(item.scheduledAt).getTime() <= now)) };
}
export async function saveSubmission(id: string, submission: Record<string, unknown>) {
  if (!isValidId(id)) throw new Error('Project ID is invalid.');
  const pathname = 'data/submissions/' + id + '.json';
  await writeBlobJson(pathname, [...(await readBlobJson<Array<Record<string, unknown>>>(pathname) ?? []), submission].slice(-5000));
}
export async function updateSubmissionDelivery(id: string, submissionId: string, delivery: Record<string, unknown>) {
  if (!isValidId(id)) throw new Error('Project ID is invalid.');
  const pathname = 'data/submissions/' + id + '.json';
  const current = await readBlobJson<Array<Record<string, unknown>>>(pathname) ?? [];
  await writeBlobJson(pathname, current.map((entry) => entry.id === submissionId ? { ...entry, delivery } : entry));
}

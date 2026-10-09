import { get, list, put } from '@vercel/blob';

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
  id: string;
  shelf: ShelfId;
  title: string;
  text: string;
  mediaUrl?: string;
  posterUrl?: string;
  mediaType?: 'image' | 'video';
  buttonLabel?: string;
  destination?: string;
  when: ContentWhen;
  audience: ContentAudience;
  status: ContentStatus;
  scheduledAt?: string;
  updatedAt: string;
  updatedBy: string;
};

export type FormDestination = { emails: string[]; sheetUrl?: string };

export type HqProject = {
  id: string;
  name: string;
  domain: string;
  livePath: string;
  shelves: ShelfId[];
  lockDesign: boolean;
  items: HqItem[];
  formDestinations: Record<string, FormDestination>;
  updatedAt: string;
  updatedBy: string;
};

const ROOT = 'data/content';
const SEEDED: HqProject[] = [
  { id: 'tb3', name: 'TB3', domain: 'tb3.online', livePath: 'https://tb3.online', shelves: SHELVES.map((shelf) => shelf.id), lockDesign: true, items: [], formDestinations: {}, updatedAt: '2026-10-09T00:00:00.000Z', updatedBy: 'Robert' },
  { id: 'amanda', name: 'Amanda', domain: 'amandacatherine.ca', livePath: 'https://amandacatherine.ca', shelves: SHELVES.map((shelf) => shelf.id), lockDesign: true, items: [], formDestinations: {}, updatedAt: '2026-10-09T00:00:00.000Z', updatedBy: 'Robert' },
];

function contentPath(id: string) { return `${ROOT}/${id}/project.json`; }
function isValidId(id: string) { return /^[a-z0-9][a-z0-9-]{0,48}$/.test(id); }

async function readBlobJson<T>(pathname: string): Promise<T | null> {
  try {
    const file = await get(pathname, { access: 'private', useCache: false });
    if (!file || file.statusCode !== 200) return null;
    return JSON.parse(await new Response(file.stream).text()) as T;
  } catch {
    return null;
  }
}

async function writeBlobJson(pathname: string, value: unknown) {
  await put(pathname, Buffer.from(JSON.stringify(value), 'utf8'), {
    access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true,
  });
}

export async function listHqProjects(): Promise<HqProject[]> {
  const stored: HqProject[] = [];
  try {
    const { blobs } = await list({ prefix: `${ROOT}/`, limit: 500 });
    for (const blob of blobs) {
      if (!blob.pathname.endsWith('/project.json')) continue;
      const project = await readBlobJson<HqProject>(blob.pathname);
      if (project && isValidId(project.id)) stored.push(project);
    }
  } catch {
    // The editor returns an actionable storage error on writes; seeded links still render.
  }
  const byId = new Map(SEEDED.map((project) => [project.id, project]));
  for (const project of stored) byId.set(project.id, project);
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getHqProject(id: string): Promise<HqProject | null> {
  if (!isValidId(id)) return null;
  const saved = await readBlobJson<HqProject>(contentPath(id));
  const base = saved ?? SEEDED.find((project) => project.id === id) ?? null;
  if (!base) return null;
  const [rules, destinations] = await Promise.all([
    readBlobJson<Record<string, Pick<HqItem, 'when' | 'audience'>>>(`${ROOT}/${id}/rules.json`),
    readBlobJson<Record<string, FormDestination>>(`${ROOT}/${id}/form-destinations.json`),
  ]);
  return {
    ...base,
    shelves: base.shelves ?? SHELVES.map((shelf) => shelf.id),
    items: base.items.map((item) => ({ ...item, ...(rules?.[item.id] ?? {}) })),
    formDestinations: destinations ?? base.formDestinations,
  };
}

export async function saveHqProject(project: HqProject) {
  if (!isValidId(project.id)) throw new Error('Project ID is invalid.');
  const previous = await readBlobJson<HqProject>(contentPath(project.id)) ?? SEEDED.find((entry) => entry.id === project.id) ?? null;
  if (previous) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    await writeBlobJson(`${ROOT}/${project.id}/history/${stamp}.json`, { ...previous, savedAt: new Date().toISOString() });
  }
  await Promise.all([
    writeBlobJson(contentPath(project.id), { ...project, shelves: project.shelves ?? SHELVES.map((shelf) => shelf.id) }),
    writeBlobJson(`${ROOT}/${project.id}/shelves.json`, project.shelves ?? SHELVES.map((shelf) => shelf.id)),
    writeBlobJson(`${ROOT}/${project.id}/rules.json`, Object.fromEntries(project.items.map(({ id, when, audience }) => [id, { when, audience }]))),
    writeBlobJson(`${ROOT}/${project.id}/form-destinations.json`, project.formDestinations),
  ]);
}

export async function undoHqProject(id: string): Promise<HqProject | null> {
  const { blobs } = await list({ prefix: `${ROOT}/${id}/history/`, limit: 1000 });
  const recent = blobs
    .filter((blob) => Date.now() - new Date(blob.uploadedAt).getTime() <= 30 * 24 * 60 * 60 * 1000)
    .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  if (!recent[0]) return null;
  const snapshot = await readBlobJson<HqProject & { savedAt?: string }>(recent[0].pathname);
  if (!snapshot) return null;
  const restored: HqProject = { ...snapshot, updatedAt: new Date().toISOString(), updatedBy: 'Robert' };
  await saveHqProject(restored);
  return restored;
}

export function makePublicProject(project: HqProject): HqProject {
  const now = Date.now();
  return {
    ...project,
    formDestinations: {},
    items: project.items
      .filter((item) => item.status === 'live' || Boolean(item.scheduledAt && new Date(item.scheduledAt).getTime() <= now))
      .map((item) => item.scheduledAt && new Date(item.scheduledAt).getTime() <= now ? { ...item, status: 'live' as const, scheduledAt: undefined } : item),
  };
}

export async function saveSubmission(id: string, submission: Record<string, unknown>) {
  if (!isValidId(id)) throw new Error('Project ID is invalid.');
  const pathname = `data/submissions/${id}.json`;
  const current = await readBlobJson<Array<Record<string, unknown>>>(pathname) ?? [];
  await writeBlobJson(pathname, [...current, submission].slice(-5000));
}

export async function savePublicMedia(id: string, file: File, kind: 'image' | 'video') {
  if (!isValidId(id)) throw new Error('Project ID is invalid.');
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'media';
  const path = kind === 'image' ? 'public/uploads' : 'public/videos';
  const blob = await put(`${path}/${id}/${Date.now()}-${safeName}`, file, {
    access: 'public', addRandomSuffix: false, contentType: file.type || 'application/octet-stream',
  });
  return { url: blob.url, pathname: blob.pathname };
}


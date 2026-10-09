import { NextRequest, NextResponse } from 'next/server';
import { authorizeHqRequest } from '../../../_lib/hq-auth';
import { getHqProject, makePublicProject, saveHqProject, undoHqProject, type HqProject } from '../../../_lib/hq-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CLIENT_SHELVES = new Set(['middle', 'form', 'gallery']);
const CLIENT_TEXT_FIELDS = new Set(['title', 'text', 'mediaUrl', 'posterUrl', 'mediaType', 'updatedAt', 'updatedBy']);

function sameJson(left: unknown, right: unknown) { return JSON.stringify(left) === JSON.stringify(right); }

function clientContentOnly(previous: HqProject, next: HqProject) {
  const { items: previousItems, updatedAt: _previousUpdatedAt, updatedBy: _previousUpdatedBy, ...previousProject } = previous;
  const { items: nextItems, updatedAt: _nextUpdatedAt, updatedBy: _nextUpdatedBy, ...nextProject } = next;
  if (!sameJson(previousProject, nextProject)) return false;
  const nextById = new Map(nextItems.map((item) => [item.id, item]));
  for (const item of previousItems) {
    const updated = nextById.get(item.id);
    if (!updated || item.shelf !== updated.shelf) return false;
    if (!CLIENT_SHELVES.has(item.shelf)) {
      if (!sameJson(item, updated)) return false;
      continue;
    }
    const oldImmutable = Object.fromEntries(Object.entries(item).filter(([key]) => !CLIENT_TEXT_FIELDS.has(key)));
    const newImmutable = Object.fromEntries(Object.entries(updated).filter(([key]) => !CLIENT_TEXT_FIELDS.has(key)));
    if (!sameJson(oldImmutable, newImmutable)) return false;
    if (updated.mediaUrl !== item.mediaUrl && updated.mediaUrl && !updated.mediaUrl.startsWith('/uploads/') && !/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(updated.mediaUrl)) return false;
    if (updated.mediaType !== item.mediaType && updated.mediaType !== 'image') return false;
  }
  for (const item of nextItems) {
    if (previousItems.some((existing) => existing.id === item.id)) continue;
    if (!CLIENT_SHELVES.has(item.shelf) || item.when !== 'always' || item.audience !== 'everyone' || item.status !== 'draft') return false;
    if (item.buttonLabel || item.destination || item.scheduledAt) return false;
    if (item.mediaType && item.mediaType !== 'image') return false;
    if (item.mediaUrl && !item.mediaUrl.startsWith('/uploads/') && !/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(item.mediaUrl)) return false;
    if (Object.keys(item).some((key) => !new Set(['id', 'shelf', 'title', 'text', 'mediaUrl', 'posterUrl', 'mediaType', 'when', 'audience', 'status', 'updatedAt', 'updatedBy']).has(key))) return false;
  }
  return true;
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const project = await getHqProject(id);
  if (!project) return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
  return NextResponse.json({ project: makePublicProject(project) }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const auth = await authorizeHqRequest(req, 'admin:manage', { clientProjectId: id, allowClientContent: true });
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await req.json().catch(() => null) as { project?: HqProject; action?: string } | null;
  try {
    if (body?.action === 'undo') {
      if (auth.client) return NextResponse.json({ error: 'Undo is available to the project administrator.' }, { status: 403 });
      const restored = await undoHqProject(id);
      return restored
        ? NextResponse.json({ project: restored })
        : NextResponse.json({ error: 'No saved version is available to undo.' }, { status: 404 });
    }
    if (!body?.project || body.project.id !== id || !Array.isArray(body.project.items)) {
      return NextResponse.json({ error: 'A valid project update is required.' }, { status: 400 });
    }
    if (auth.client) {
      const previous = await getHqProject(id);
      if (!previous || !clientContentOnly(previous, body.project)) return NextResponse.json({ error: 'Client sessions can only edit text and photos in MIDDLE, FORM, and GALLERY.' }, { status: 403 });
    }
    const saved = { ...body.project, updatedAt: new Date().toISOString(), updatedBy: auth.user.name || 'Robert' };
    await saveHqProject(saved);
    return NextResponse.json({ project: saved });
  } catch (error) {
    console.error('[phone-hq] save failed', error);
    return NextResponse.json({ error: 'Persistent storage is unavailable. No changes were saved.' }, { status: 503 });
  }
}

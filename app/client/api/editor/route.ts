import { createHash } from 'node:crypto';
import { get, put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminActionFromRequest } from '@/lib/admin-session-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function validPath(path: unknown): path is string {
  return typeof path === 'string' && path.startsWith('/') && path.length < 300 && !path.startsWith('/hq') &&
    !path.startsWith('/api/') && !path.includes('..') && /^\/[a-zA-Z0-9/_\-\[\]]*$/.test(path);
}
function filename(path: string) { return 'data/hq-page-edits/' + createHash('sha256').update(path).digest('hex').slice(0, 24) + '.json'; }
async function readEdit(path: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('Persistent page storage is not configured.');
  const file = await get(filename(path), { access: 'private', useCache: false });
  return file?.statusCode === 200 ? JSON.parse(await new Response(file.stream).text()) as Record<string, unknown> : null;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const path = req.nextUrl.searchParams.get('path');
  if (!validPath(path)) return NextResponse.json({ error: 'Choose a valid page route.' }, { status: 400 });
  try {
    return NextResponse.json({ edit: await readEdit(path) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load saved page fields.' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: 'Persistent page storage is not configured.' }, { status: 503 });
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || !validPath(body.path)) return NextResponse.json({ error: 'Choose a valid page route.' }, { status: 400 });
  const edit = {
    path: body.path,
    title: typeof body.title === 'string' ? body.title.slice(0, 180) : '',
    hero: typeof body.hero === 'string' ? body.hero.slice(0, 2000) : '',
    content: typeof body.content === 'string' ? body.content.slice(0, 12000) : '',
    links: typeof body.links === 'string' ? body.links.slice(0, 6000) : '',
    updatedAt: new Date().toISOString(),
    updatedBy: auth.user.name || auth.user.email || 'EA admin',
  };
  try {
    await put(filename(edit.path), Buffer.from(JSON.stringify(edit), 'utf8'), {
      access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true,
    });
    const hook = process.env.OPEN_DESIGN_VERCEL_DEPLOY_HOOK_URL;
    if (!hook) return NextResponse.json({ ok: true, path: edit.path, deploy: false, message: 'Saved. A Vercel deploy hook is not configured.' });
    const deployment = await fetch(hook, { method: 'POST', cache: 'no-store' });
    if (!deployment.ok) return NextResponse.json({ ok: true, path: edit.path, deploy: false, message: 'Saved, but the Vercel deploy hook returned an error.' });
    return NextResponse.json({ ok: true, path: edit.path, deploy: true, message: 'Saved. Vercel redeploy requested.' });
  } catch {
    return NextResponse.json({ error: 'Page changes could not be saved.' }, { status: 503 });
  }
}

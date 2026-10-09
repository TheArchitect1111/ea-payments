import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminActionFromRequest } from '@/lib/admin-session-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OWNER = process.env.OPEN_DESIGN_GITHUB_OWNER ?? process.env.GITHUB_OWNER ?? 'TheArchitect1111';
const REPO = process.env.OPEN_DESIGN_GITHUB_REPO ?? process.env.GITHUB_REPO ?? 'ea-payments';
const BRANCH = process.env.OPEN_DESIGN_GITHUB_BASE ?? 'master';
const API = 'https://api.github.com';
function headers(token: string): HeadersInit {
  return { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' };
}
function validPath(path: unknown): path is string {
  return typeof path === 'string' && path.startsWith('/') && path.length < 300 && !path.startsWith('/hq') &&
    !path.startsWith('/api/') && !path.includes('..') && /^\/[a-zA-Z0-9/_\-\[\]]*$/.test(path);
}
function filename(path: string) { return 'data/hq-page-edits/' + createHash('sha256').update(path).digest('hex').slice(0, 24) + '.json'; }
function apiUrl(file: string) { return API + '/repos/' + OWNER + '/' + REPO + '/contents/' + file; }

export async function GET(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const token = process.env.GITHUB_TOKEN ?? process.env.OPEN_DESIGN_GITHUB_TOKEN;
  const path = req.nextUrl.searchParams.get('path');
  if (!token) return NextResponse.json({ error: 'Repository access is not configured.' }, { status: 503 });
  if (!validPath(path)) return NextResponse.json({ error: 'Choose a valid page route.' }, { status: 400 });
  try {
    const response = await fetch(apiUrl(filename(path)) + '?ref=' + encodeURIComponent(BRANCH), { headers: headers(token), cache: 'no-store' });
    if (response.status === 404) return NextResponse.json({ edit: null });
    if (!response.ok) return NextResponse.json({ error: 'Could not load saved page fields.' }, { status: 502 });
    const file = await response.json() as { content?: string; encoding?: string };
    const edit = file.content ? JSON.parse(Buffer.from(file.content.replace(/\n/g, ''), 'base64').toString('utf8')) : null;
    return NextResponse.json({ edit }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Could not load saved page fields.' }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const token = process.env.GITHUB_TOKEN ?? process.env.OPEN_DESIGN_GITHUB_TOKEN;
  if (!token) return NextResponse.json({ error: 'Repository save is not configured. Add a GitHub token with contents write access.' }, { status: 503 });
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
  const url = apiUrl(filename(edit.path));
  try {
    const current = await fetch(url + '?ref=' + encodeURIComponent(BRANCH), { headers: headers(token), cache: 'no-store' });
    const currentData = current.ok ? await current.json() as { sha?: string } : null;
    if (!current.ok && current.status !== 404) throw new Error('Could not check existing page edit (' + current.status + ').');
    const saved = await fetch(url, {
      method: 'PUT', headers: headers(token),
      body: JSON.stringify({
        message: 'HQ edit: ' + edit.path,
        content: Buffer.from(JSON.stringify(edit, null, 2)).toString('base64'),
        branch: BRANCH,
        ...(currentData?.sha ? { sha: currentData.sha } : {}),
      }),
    });
    if (!saved.ok) throw new Error('Repository save failed (' + saved.status + ').');
    return NextResponse.json({ ok: true, path: edit.path, deploy: 'Vercel deploy triggered by repository commit.' });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Save failed.' }, { status: 502 });
  }
}

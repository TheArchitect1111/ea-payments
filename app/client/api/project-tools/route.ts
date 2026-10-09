import { get, put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import projectIndex from '../../../../data/hq-projects-index.json';
import { requireAdminActionFromRequest } from '@/lib/admin-session-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Feature = 'letters' | 'test-payment' | 'video-library';
type VideoEntry = { title: string; url: string };
type ProjectTools = { waitlistLetter?: string; registerLetter?: string; testPayment?: boolean; videos?: VideoEntry[] };
const projects = projectIndex as Array<{ id: string; features: Feature[] }>;
function getProject(id: string) { return projects.find((project) => project.id === id); }
function pathFor(id: string) { return 'data/content/' + id + '/hq-tools.json'; }
async function readTools(id: string): Promise<ProjectTools> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('HQ project storage is not configured.');
  try {
    const blob = await get(pathFor(id), { access: 'private', useCache: false });
    if (!blob || blob.statusCode !== 200) return {};
    return JSON.parse(await new Response(blob.stream).text()) as ProjectTools;
  } catch { return {}; }
}
function cleanText(value: unknown, max: number) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }

export async function GET(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const id = req.nextUrl.searchParams.get('projectId') || '';
  if (!/^[a-z0-9][a-z0-9-]{0,48}$/.test(id) || !getProject(id)) return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
  try { return NextResponse.json({ tools: await readTools(id) }, { headers: { 'Cache-Control': 'no-store' } }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Project settings could not be loaded.' }, { status: 503 }); }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: 'HQ project storage is not configured.' }, { status: 503 });
  const body = await req.json().catch(() => null) as { projectId?: string; tools?: ProjectTools } | null;
  const id = body?.projectId || '';
  const project = getProject(id);
  if (!project || !body?.tools || typeof body.tools !== 'object') return NextResponse.json({ error: 'Project settings are invalid.' }, { status: 400 });
  const next: ProjectTools = {};
  if (project.features.includes('letters')) {
    next.waitlistLetter = cleanText(body.tools.waitlistLetter, 12000);
    next.registerLetter = cleanText(body.tools.registerLetter, 12000);
  }
  if (project.features.includes('test-payment')) next.testPayment = body.tools.testPayment === true;
  if (project.features.includes('video-library')) {
    const videos = Array.isArray(body.tools.videos) ? body.tools.videos.slice(0, 40) : [];
    if (videos.some((video) => !video || typeof video.title !== 'string' || typeof video.url !== 'string' || !video.title.trim() || !(/^(https:\/\/|\/videos\/)/i.test(video.url.trim())))) {
      return NextResponse.json({ error: 'Each video needs a title and a valid HTTPS or /videos/ URL.' }, { status: 400 });
    }
    next.videos = videos.map((video) => ({ title: cleanText(video.title, 120), url: cleanText(video.url, 1000) }));
  }
  try {
    await put(pathFor(id), Buffer.from(JSON.stringify(next), 'utf8'), { access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'Project settings could not be saved.' }, { status: 503 }); }
}

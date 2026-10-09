import { NextRequest, NextResponse } from 'next/server';
import { requireAdminActionFromRequest } from '@/lib/admin-session-guard';
import { listHqProjects, saveHqProject, SHELVES, type HqProject } from '../../_lib/hq-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:access');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: 'Persistent Vercel Blob storage is not configured for My Projects HQ.' }, { status: 503 });
  return NextResponse.json({ projects: await listHqProjects() }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminActionFromRequest(req, 'admin:manage');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await req.json().catch(() => null) as { name?: string; domain?: string } | null;
  const name = body?.name?.trim().slice(0, 80) ?? '';
  const domain = body?.domain?.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '') ?? '';
  if (!name || !/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i.test(domain)) {
    return NextResponse.json({ error: 'Enter a project name and a valid domain.' }, { status: 400 });
  }
  const id = name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'project';
  const existing = await listHqProjects();
  let uniqueId = id;
  let suffix = 2;
  while (existing.some((project) => project.id === uniqueId)) uniqueId = `${id}-${suffix++}`;
  const project: HqProject = {
    id: uniqueId, name, domain, livePath: `https://${domain}`, shelves: SHELVES.map((shelf) => shelf.id), lockDesign: true,
    items: [], formDestinations: {}, updatedAt: new Date().toISOString(), updatedBy: auth.user.name || 'Robert',
  };
  try {
    await saveHqProject(project);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('[phone-hq] project creation failed', error);
    return NextResponse.json({ error: 'Persistent storage is unavailable. Connect the Vercel Blob store and retry.' }, { status: 503 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireFactoryApiAccess } from '@/lib/factory-api-auth';
import {
  exportFactoryProjectJson,
  exportFactoryProjectMarkdown,
} from '@/lib/factory-export';
import { getProject } from '@/lib/factory-project';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

/**
 * Downloadable Factory package for email + admin.
 * Requires admin session (open the link while logged in).
 */
export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireFactoryApiAccess(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const project = await getProject(id.trim());
  if (!project) {
    return NextResponse.json({ ok: false, error: 'Project not found.' }, { status: 404 });
  }

  const type = request.nextUrl.searchParams.get('type') ?? 'markdown';
  const safeName = project.client.replace(/[^\w.-]+/g, '-').slice(0, 48) || project.id;

  if (type === 'json') {
    return new NextResponse(exportFactoryProjectJson(project), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="factory-${safeName}-${project.id}.json"`,
      },
    });
  }

  return new NextResponse(exportFactoryProjectMarkdown(project), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="factory-${safeName}-${project.id}.md"`,
    },
  });
}

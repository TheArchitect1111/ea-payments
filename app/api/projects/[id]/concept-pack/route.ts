import { NextRequest, NextResponse } from 'next/server';
import { requireFactoryApiAccess } from '@/lib/factory-api-auth';
import {
  buildFactoryConceptPackAsync,
  exportFactoryConceptPackMarkdown,
  renderFactoryConceptPackDocument,
} from '@/lib/factory-concept-pack';
import { getProject } from '@/lib/factory-project';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

type Params = { params: Promise<{ id: string }> };

/**
 * Sit-down Concept Pack — open in browser / print for a prospect meeting.
 * format=html (default) | markdown
 */
export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireFactoryApiAccess(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const project = await getProject(id.trim());
  if (!project) {
    return NextResponse.json({ ok: false, error: 'Project not found.' }, { status: 404 });
  }

  const pack = await buildFactoryConceptPackAsync(project);
  const format = request.nextUrl.searchParams.get('format') || 'html';
  const safeName = project.client.replace(/[^\w.-]+/g, '-').slice(0, 48) || project.id;

  if (format === 'markdown' || format === 'md') {
    return new NextResponse(exportFactoryConceptPackMarkdown(pack), {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `inline; filename="concept-pack-${safeName}.md"`,
      },
    });
  }

  return new NextResponse(renderFactoryConceptPackDocument(pack), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

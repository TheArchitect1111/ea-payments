import { NextRequest, NextResponse } from 'next/server';
import { adminApiUnauthorized, guardAdminApi } from '@/lib/api/admin-route';
import { ensurePublicPreview, renderVideoProject } from '@/lib/video-factory/render';
import { listVideoEngines } from '@/lib/video-factory/providers';
import { resolveNarrationProvider } from '@/lib/video-factory/narration';
import { listVideoProjects, resolveVideoProject } from '@/lib/video-factory/registry';
import { projectDurationInSeconds } from '@/lib/video-factory/schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) return adminApiUnauthorized(auth);

  const projects = listVideoProjects().map((project) => ({
    id: project.id,
    title: project.title,
    topic: project.topic,
    durationSeconds: projectDurationInSeconds(project),
  }));

  return NextResponse.json({
    ok: true,
    service: 'EA Video Factory',
    primaryEngine: 'remotion',
    engines: listVideoEngines(),
    narration: resolveNarrationProvider(),
    projects,
  });
}

export async function POST(req: NextRequest) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) return adminApiUnauthorized(auth);

  const body = (await req.json().catch(() => ({}))) as {
    projectId?: string;
    topic?: string;
    engine?: 'remotion' | 'gemini';
    force?: boolean;
  };

  if (body.engine === 'gemini') {
    return NextResponse.json(
      {
        ok: false,
        service: 'EA Video Factory',
        status: 'use-optional-provider',
        error: 'Gemini is optional. POST /api/integrations/video/generate with admin session is not used here; use engine=remotion or the Gemini generate route.',
      },
      { status: 400 },
    );
  }

  const project = resolveVideoProject({ projectId: body.projectId, topic: body.topic });

  const payload = (previewUrl: string, cached: boolean, extra?: Record<string, unknown>) => ({
    ok: true,
    service: 'EA Video Factory',
    engine: 'remotion',
    cached,
    projectId: project.id,
    title: project.title,
    description: project.description,
    previewUrl,
    durationSeconds: projectDurationInSeconds(project),
    ...extra,
  });

  try {
    if (!body.force) {
      const cached = await ensurePublicPreview(project.id);
      if (cached) {
        return NextResponse.json(payload(cached.previewUrl, true));
      }
    }

    const rendered = await renderVideoProject(project.id);
    return NextResponse.json(payload(rendered.previewUrl, false));
  } catch (error) {
    const cached = await ensurePublicPreview(project.id);
    if (cached) {
      return NextResponse.json(
        payload(cached.previewUrl, true, {
          fallback: 'cached-after-render-error',
          renderError: error instanceof Error ? error.message : 'Remotion render failed',
        }),
      );
    }

    return NextResponse.json(
      {
        ok: false,
        service: 'EA Video Factory',
        status: 'render-failed',
        projectId: project.id,
        error: error instanceof Error ? error.message : 'Remotion render failed',
      },
      { status: 502 },
    );
  }
}

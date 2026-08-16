import { NextRequest, NextResponse } from 'next/server';
import {
  addBundleToSandbox,
  createSandbox,
  renderMediaOnVercel,
  uploadToVercelBlob,
} from '@remotion/vercel';
import { adminApiUnauthorized, guardAdminApi } from '@/lib/api/admin-route';
import { listVideoEngines } from '@/lib/video-factory/providers';
import { resolveNarrationProvider } from '@/lib/video-factory/narration';
import { listVideoProjects, resolveVideoProject } from '@/lib/video-factory/registry';
import { projectDurationInSeconds } from '@/lib/video-factory/schema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

const BUNDLE_DIR = '.remotion';

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
    primaryEngine: 'remotion-vercel-sandbox',
    engines: listVideoEngines(),
    narration: resolveNarrationProvider(),
    projects,
    blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  });
}

export async function POST(req: NextRequest) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) return adminApiUnauthorized(auth);

  const body = (await req.json().catch(() => ({}))) as {
    projectId?: string;
    topic?: string;
    engine?: 'remotion' | 'gemini';
  };

  if (body.engine === 'gemini') {
    return NextResponse.json(
      {
        ok: false,
        service: 'EA Video Factory',
        status: 'use-optional-provider',
        error: 'Gemini is optional. Use the Remotion Vercel Sandbox engine for the primary Video Factory path.',
      },
      { status: 400 },
    );
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    return NextResponse.json(
      {
        ok: false,
        service: 'EA Video Factory',
        status: 'blob-not-configured',
        error: 'BLOB_READ_WRITE_TOKEN is not configured. Attach a Vercel Blob store to the ea-payments project.',
      },
      { status: 503 },
    );
  }

  const project = resolveVideoProject({ projectId: body.projectId, topic: body.topic });
  const sandbox = await createSandbox({ timeout: maxDuration * 1000 });

  try {
    await addBundleToSandbox({ sandbox, bundleDir: BUNDLE_DIR });

    const { sandboxFilePath, contentType } = await renderMediaOnVercel({
      sandbox,
      compositionId: project.id,
      inputProps: {},
    });

    const uploaded = await uploadToVercelBlob({
      sandbox,
      sandboxFilePath,
      contentType,
      blobToken,
      access: 'public',
    });

    return NextResponse.json({
      ok: true,
      service: 'EA Video Factory',
      engine: 'remotion-vercel-sandbox',
      cached: false,
      projectId: project.id,
      title: project.title,
      description: project.description,
      previewUrl: uploaded.url,
      bytes: uploaded.size,
      durationSeconds: projectDurationInSeconds(project),
    });
  } catch (error) {
    console.error('[video-factory/render] Vercel Sandbox render failed', error);
    return NextResponse.json(
      {
        ok: false,
        service: 'EA Video Factory',
        status: 'render-failed',
        engine: 'remotion-vercel-sandbox',
        projectId: project.id,
        error: error instanceof Error ? error.message : 'Vercel Sandbox render failed',
      },
      { status: 502 },
    );
  } finally {
    await sandbox.stop().catch(() => undefined);
  }
}

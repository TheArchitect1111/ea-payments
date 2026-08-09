import { NextRequest, NextResponse } from 'next/server';
import { adminApiUnauthorized, guardAdminApi } from '@/lib/api/admin-route';
import { ensurePublicPreview } from '@/lib/video-factory/render';
import { resolveVideoProject } from '@/lib/video-factory/registry';
import { uploadYouTubeVideo, youtubePublisherConfigured } from '@/lib/integrations/youtube/publisher';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const auth = await guardAdminApi(req);
  if (!auth.ok) return adminApiUnauthorized(auth);

  if (!youtubePublisherConfigured()) {
    return NextResponse.json(
      { ok: false, service: 'EA Video Factory', status: 'youtube-not-configured' },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    projectId?: string;
    topic?: string;
    title?: string;
    description?: string;
    privacyStatus?: 'private' | 'unlisted' | 'public';
  };

  const project = resolveVideoProject({ projectId: body.projectId, topic: body.topic });
  const rendered = await ensurePublicPreview(project.id);
  if (!rendered) {
    return NextResponse.json(
      {
        ok: false,
        service: 'EA Video Factory',
        status: 'video-not-rendered',
        error: 'Generate the Remotion episode before publishing.',
      },
      { status: 409 },
    );
  }

  const privacyStatus = body.privacyStatus ?? 'private';
  if (!['private', 'unlisted', 'public'].includes(privacyStatus)) {
    return NextResponse.json({ ok: false, error: 'invalid privacyStatus' }, { status: 400 });
  }

  try {
    const uploaded = await uploadYouTubeVideo({
      metadata: {
        title: body.title?.trim() || project.title,
        description: body.description?.trim() || project.description,
        tags: project.youtubeTags,
        privacyStatus,
      },
      bytes: rendered.bytes,
      mimeType: 'video/mp4',
    });

    return NextResponse.json({
      ok: true,
      service: 'EA Video Factory',
      status: 'uploaded',
      engine: 'remotion',
      projectId: project.id,
      videoId: uploaded.id ?? null,
      privacyStatus,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: 'EA Video Factory',
        status: 'upload-failed',
        error: error instanceof Error ? error.message : 'YouTube upload failed',
      },
      { status: 502 },
    );
  }
}

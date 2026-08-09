import { NextRequest, NextResponse } from 'next/server';
import { uploadYouTubeVideo } from '@/lib/integrations/youtube/publisher';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function unauthorized() {
  return NextResponse.json(
    {
      ok: false,
      service: 'EA YouTube Publisher',
      status: 'unauthorized',
    },
    { status: 401 },
  );
}

function publishSecretConfigured(): boolean {
  return Boolean(process.env.YOUTUBE_PUBLISH_SECRET?.trim());
}

function isAuthorized(req: NextRequest): boolean {
  const configuredSecret = process.env.YOUTUBE_PUBLISH_SECRET?.trim();
  if (!configuredSecret) return false;
  const supplied = req.headers.get('x-ea-youtube-publish-secret')?.trim();
  return Boolean(supplied && supplied === configuredSecret);
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'EA YouTube Publisher',
    status: publishSecretConfigured() ? 'ready' : 'publish-secret-not-configured',
    accepts: ['multipart/form-data'],
    fields: {
      video: 'required video file',
      title: 'required',
      description: 'optional',
      privacyStatus: 'optional: private | unlisted | public; defaults to private',
    },
    authHeader: 'x-ea-youtube-publish-secret',
  });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();

  try {
    const form = await req.formData();
    const video = form.get('video');
    const title = String(form.get('title') ?? '').trim();
    const description = String(form.get('description') ?? '').trim();
    const privacyStatusRaw = String(form.get('privacyStatus') ?? 'private').trim();

    if (!(video instanceof File)) {
      return NextResponse.json(
        { ok: false, service: 'EA YouTube Publisher', error: 'video file is required' },
        { status: 400 },
      );
    }

    if (!title) {
      return NextResponse.json(
        { ok: false, service: 'EA YouTube Publisher', error: 'title is required' },
        { status: 400 },
      );
    }

    if (!video.type.startsWith('video/')) {
      return NextResponse.json(
        { ok: false, service: 'EA YouTube Publisher', error: 'video must be a video MIME type' },
        { status: 400 },
      );
    }

    if (!['private', 'unlisted', 'public'].includes(privacyStatusRaw)) {
      return NextResponse.json(
        { ok: false, service: 'EA YouTube Publisher', error: 'invalid privacyStatus' },
        { status: 400 },
      );
    }

    const bytes = new Uint8Array(await video.arrayBuffer());
    const uploaded = await uploadYouTubeVideo({
      metadata: {
        title,
        description,
        privacyStatus: privacyStatusRaw as 'private' | 'unlisted' | 'public',
      },
      bytes,
      mimeType: video.type,
    });

    return NextResponse.json({
      ok: true,
      service: 'EA YouTube Publisher',
      status: 'uploaded',
      videoId: uploaded.id ?? null,
      privacyStatus: privacyStatusRaw,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: 'EA YouTube Publisher',
        status: 'upload-failed',
        error: error instanceof Error ? error.message : 'Unknown YouTube upload error',
      },
      { status: 502 },
    );
  }
}

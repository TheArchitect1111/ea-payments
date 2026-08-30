import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';

export const dynamic = 'force-dynamic';

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 250 * 1024 * 1024;

function safeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'media';
}

export async function POST(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  if (!slug || !slug.toLowerCase().startsWith('amanda-catherine')) {
    return NextResponse.json({ ok: false, error: 'Amanda Catherine portal required.' }, { status: 400 });
  }

  const auth = await guardPortalApi(req, { slug });
  if (!auth.ok) return portalApiUnauthorized(auth);

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'Choose an image or video file.' }, { status: 400 });
  }

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  if (!isImage && !isVideo) {
    return NextResponse.json({ ok: false, error: 'Only image and video files are supported.' }, { status: 415 });
  }

  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) {
    return NextResponse.json(
      { ok: false, error: `${isVideo ? 'Video' : 'Image'} exceeds the ${Math.round(maxBytes / 1024 / 1024)} MB limit.` },
      { status: 413 },
    );
  }

  try {
    const blob = await put(`amanda-catherine/site/${Date.now()}-${safeFileName(file.name)}`, file, {
      access: 'public',
      addRandomSuffix: true,
      contentType: file.type,
    });
    return NextResponse.json({ ok: true, url: blob.url, pathname: blob.pathname, kind: isVideo ? 'video' : 'image' });
  } catch (error) {
    console.error('[amanda-site-media] upload failed', error);
    return NextResponse.json(
      { ok: false, error: 'Media upload is unavailable. Check the Vercel Blob connection for this project.' },
      { status: 503 },
    );
  }
}

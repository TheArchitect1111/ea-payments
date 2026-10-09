import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';
import { normalizeRole, roleAtLeast } from '@/lib/rbac';
import { createAmandaMediaAsset, listAmandaMediaAssets, updateAmandaMediaAsset } from '@/lib/amanda-catherine/media-assets';

export const dynamic = 'force-dynamic';
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 250 * 1024 * 1024;

function safeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'media';
}

async function authorize(request: NextRequest) {
  const auth = await guardPortalApi(request, { slug: 'amanda-catherine' });
  if (!auth.ok) return { response: portalApiUnauthorized(auth) };
  if (!roleAtLeast(normalizeRole(auth.session.role), 'admin')) {
    return { response: NextResponse.json({ ok: false, error: 'Amanda admin access required.' }, { status: 403 }) };
  }
  return { response: null as Response | null };
}

export async function GET(request: NextRequest) {
  const access = await authorize(request);
  if (access.response) return access.response;
  return NextResponse.json({ ok: true, media: await listAmandaMediaAssets(true) });
}

export async function POST(request: NextRequest) {
  const access = await authorize(request);
  if (access.response) return access.response;
  const form = await request.formData();
  const file = form.get('file');
  const title = String(form.get('title') || '').trim().slice(0, 200);
  if (!(file instanceof File) || !title) {
    return NextResponse.json({ ok: false, error: 'Choose a title and an image or video file.' }, { status: 400 });
  }
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  if (!isImage && !isVideo) return NextResponse.json({ ok: false, error: 'Only image and video files are supported.' }, { status: 415 });
  if (file.size > (isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)) {
    return NextResponse.json({ ok: false, error: 'The selected media exceeds the upload limit.' }, { status: 413 });
  }
  try {
    const blob = await put(`amanda-catherine/gallery/${Date.now()}-${safeFileName(file.name)}`, file, {
      access: 'public',
      addRandomSuffix: true,
      contentType: file.type,
    });
    const media = await createAmandaMediaAsset({
      title,
      url: blob.url,
      thumbnail: isImage ? blob.url : '',
      type: isVideo ? 'video' : 'image',
      sort_order: Number(form.get('sort_order') || 0),
      is_visible: form.get('is_visible') !== 'false',
    });
    return NextResponse.json({ ok: true, media }, { status: 201 });
  } catch (error) {
    console.error('[amanda-media] upload/save failed', error);
    return NextResponse.json({ ok: false, error: 'Media upload could not be saved.' }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  const access = await authorize(request);
  if (access.response) return access.response;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.id !== 'string') return NextResponse.json({ ok: false, error: 'Media id is required.' }, { status: 400 });
  const fields: Record<string, unknown> = {};
  if (typeof body.title === 'string') fields.title = body.title.trim().slice(0, 200);
  if (Number.isFinite(body.sort_order)) fields.sort_order = Number(body.sort_order);
  if (typeof body.is_visible === 'boolean') fields.is_visible = body.is_visible;
  await updateAmandaMediaAsset(body.id, fields);
  return NextResponse.json({ ok: true });
}

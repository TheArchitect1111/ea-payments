import { NextRequest } from 'next/server';
import { requireFactoryApiAccess } from '@/lib/factory-api-auth';
import { attachmentFromFile } from '@/lib/factory-launch-request';
import { requireSameOrigin } from '@/lib/bricks/access';
import { checkRateLimit } from '@/lib/ai/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 60;
/** Upload independently so a multi-page launch does not exceed the hosting request-body limit. */
export async function POST(request: NextRequest) {
  const auth = await requireFactoryApiAccess(request);
  if (!auth.ok) return auth.response;
  try {
    requireSameOrigin(request);
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!checkRateLimit(`screenshot-assets:${ip}`, 100, 3600000).ok) return Response.json({ error: 'Upload limit reached' }, { status: 429 });
    const form = await request.formData(); const file = form.get('file');
    if (!(file instanceof File) || !file.size || !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type))
      return Response.json({ error: 'Choose a PNG, JPG, WebP or GIF image.' }, { status: 400 });
    const attachment = await attachmentFromFile(file, { requireDurable: true });
    return Response.json({ ok: true, attachment }, { headers: { 'cache-control': 'private, no-store' } });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : 'Image upload failed' }, { status: 400 });
  }
}

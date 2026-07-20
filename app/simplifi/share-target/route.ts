import { NextResponse } from 'next/server';

/**
 * PWA share_target action (POST multipart).
 * When the service worker controls the client, sw-simplifi-capture.js stashes
 * image files in IndexedDB before this runs. Fallback: seed text/url only.
 */
export async function POST(request: Request) {
  const formData = await request.formData();
  const title = String(formData.get('title') || '').trim();
  const text = String(formData.get('text') || '').trim();
  const shareUrl = String(formData.get('url') || '').trim();
  const media = formData
    .getAll('media')
    .filter((f): f is File => typeof File !== 'undefined' && f instanceof File && f.size > 0);

  const params = new URLSearchParams();
  if (title) params.set('title', title.slice(0, 500));
  if (text) params.set('text', text.slice(0, 2000));
  if (shareUrl) params.set('url', shareUrl.slice(0, 2000));
  if (media.length > 0) params.set('shareHint', 'pwa');

  const target = `/simplifi/capture${params.toString() ? `?${params}` : ''}`;
  return NextResponse.redirect(new URL(target, request.url), 303);
}

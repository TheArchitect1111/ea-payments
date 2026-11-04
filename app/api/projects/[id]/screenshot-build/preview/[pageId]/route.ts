import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { requireFactoryApiAccess } from '@/lib/factory-api-auth';
import { loadScreenshotDraft } from '@/lib/factory-screenshot-runtime';
import { renderScreenshotPage } from '@/lib/factory-screenshot-build';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; pageId: string }> }) {
  const access = await requireFactoryApiAccess(request);
  if (!access.ok) return access.response;
  const { id, pageId } = await params;
  const draft = await loadScreenshotDraft(id);
  if (!draft || draft.projectId !== id || !draft.pages.some(p => p.id === pageId))
    return Response.json({ error: 'Private draft not found.' }, { status: 404 });
  return new Response(renderScreenshotPage(draft, pageId, randomUUID()), { headers: {
    'content-type': 'text/html; charset=utf-8', 'cache-control': 'private, no-store',
    'x-robots-tag': 'noindex, nofollow', 'referrer-policy': 'same-origin',
    'x-content-type-options': 'nosniff',
    'content-security-policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'self'; base-uri 'none'",
  } });
}

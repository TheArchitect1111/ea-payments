import { createHash } from 'node:crypto';
import { NextRequest } from 'next/server';
import { requireFactoryApiAccess } from '@/lib/factory-api-auth';
import { loadScreenshotDraft } from '@/lib/factory-screenshot-runtime';
import { getFactoryProject } from '@/lib/factory-project-store';
import { readCtpAssetBytes } from '@/lib/ctp-asset-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/** Authenticated immutable reference for the private visual comparison runner. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; pageId: string }> }) {
  const auth = await requireFactoryApiAccess(request);
  if (!auth.ok) return auth.response;
  const { id, pageId } = await params;
  const draft = await loadScreenshotDraft(id);
  const page = draft?.projectId === id ? draft.pages.find(p => p.id === pageId) : null;
  const project = page ? await getFactoryProject(id) : null;
  const assetId = /\/api\/ctp\/assets\/([a-zA-Z0-9_-]+)$/.exec(project?.attachments[page!.attachmentIndex]?.url || '')?.[1];
  const asset = assetId ? await readCtpAssetBytes(assetId) : null;
  if (!asset || !page || !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(asset.meta.mimeType) ||
    createHash('sha256').update(asset.bytes).digest('hex') !== page.imageHash)
    return Response.json({ error: 'Reference screenshot unavailable or changed' }, { status: 404 });
  return new Response(new Uint8Array(asset.bytes), { headers: { 'content-type': asset.meta.mimeType,
    'cache-control': 'private, no-store', 'x-content-type-options': 'nosniff', 'x-robots-tag': 'noindex' } });
}

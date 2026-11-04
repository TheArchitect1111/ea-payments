import { NextRequest } from 'next/server';
import { requireFactoryApiAccess } from '@/lib/factory-api-auth';
import { loadScreenshotDraft } from '@/lib/factory-screenshot-runtime';
import { getFactoryProject } from '@/lib/factory-project-store';
import { readCtpAssetBytes } from '@/lib/ctp-asset-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; index: string }> }) {
  const auth = await requireFactoryApiAccess(request);
  if (!auth.ok) return auth.response;
  const { id, index } = await params;
  if (!/^\d{1,4}$/.test(index)) return Response.json({ error: 'Asset not found' }, { status: 404 });
  const draft = await loadScreenshotDraft(id);
  if (!draft || draft.projectId !== id || !draft.pages.some(page => Object.values(page.images).includes(Number(index))))
    return Response.json({ error: 'Asset not bound to this private draft' }, { status: 404 });
  const project = await getFactoryProject(id);
  const assetId = /\/api\/ctp\/assets\/([a-zA-Z0-9_-]+)$/.exec(project?.attachments[Number(index)]?.url || '')?.[1];
  const asset = assetId ? await readCtpAssetBytes(assetId) : null;
  if (!asset || !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(asset.meta.mimeType))
    return Response.json({ error: 'Supported image unavailable' }, { status: 404 });
  return new Response(new Uint8Array(asset.bytes), { headers: { 'content-type': asset.meta.mimeType,
    'cache-control': 'private, no-store', 'x-content-type-options': 'nosniff', 'x-robots-tag': 'noindex' } });
}

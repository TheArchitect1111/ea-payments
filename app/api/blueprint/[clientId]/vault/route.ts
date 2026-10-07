import { get, put } from '@vercel/blob';
import { appendBlueprintVaultFile, getBlueprintRecord, publicBlueprint } from '@/lib/blueprint-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const ALLOWED = /^(image\/|video\/|application\/pdf$|application\/msword$|application\/vnd\.openxmlformats-officedocument\.|application\/vnd\.ms-excel$|text\/(csv|plain|tab-separated-values)$)/i;

function safeFileName(name: string) {
  return name.replace(/[\\/\0]/g, '-').replace(/[^A-Za-z0-9._ -]+/g, '-').replace(/\s+/g, '_').slice(0, 160) || 'file';
}
function cors(origin: string | null) {
  const allowed = Boolean(
    !origin ||
    origin === 'https://cc.efficiencyarchitects.online' ||
    origin === 'https://app.efficiencyarchitects.online' ||
    /^https:\/\/(?:efficiency-architects|ea-payments)-[a-z0-9-]+\.vercel\.app$/i.test(origin)
  );
  return {
    allowed,
    headers: {
      'Access-Control-Allow-Origin': allowed && origin ? origin : 'https://app.efficiencyarchitects.online',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    },
  };
}
export async function OPTIONS(request: Request) {
  const c = cors(request.headers.get('origin'));
  return new Response(null, { status: c.allowed ? 204 : 403, headers: c.headers });
}
export async function GET(request: Request, { params }: { params: Promise<{ clientId: string }> }) {
  const c = cors(request.headers.get('origin'));
  if (!c.allowed) return Response.json({ ok: false }, { status: 403, headers: c.headers });
  const { clientId } = await params;
  const record = await getBlueprintRecord(clientId);
  if (!record) return Response.json({ ok: false, error: 'Blueprint not found.' }, { status: 404, headers: c.headers });
  return Response.json({ ok: true, files: record.vaultFiles || [] }, { headers: c.headers });
}
export async function POST(request: Request, { params }: { params: Promise<{ clientId: string }> }) {
  const c = cors(request.headers.get('origin'));
  if (!c.allowed) return Response.json({ ok: false }, { status: 403, headers: c.headers });
  try {
    const { clientId } = await params;
    if (!(await getBlueprintRecord(clientId))) return Response.json({ ok: false, error: 'Blueprint not found.' }, { status: 404, headers: c.headers });
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return Response.json({ ok: false, error: 'Choose a file.' }, { status: 400, headers: c.headers });
    if (file.size <= 0 || file.size > MAX_FILE_BYTES) return Response.json({ ok: false, error: 'File must be between 1 byte and 25 MB.' }, { status: 413, headers: c.headers });
    const type = file.type || 'application/octet-stream';
    if (file.type && !ALLOWED.test(file.type)) return Response.json({ ok: false, error: 'This file type is not supported.' }, { status: 415, headers: c.headers });
    const filename = safeFileName(file.name);
    const path = `ea-blueprints/vault/${encodeURIComponent(clientId)}/${Date.now()}-${filename}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const blob = await put(path, bytes, { access: 'private', contentType: type, addRandomSuffix: true });
    const stored = await get(blob.pathname, { access: 'private', useCache: false });
    if (!stored || stored.statusCode !== 200) throw new Error('Storage verification failed.');
    const record = await appendBlueprintVaultFile(clientId, {
      name: file.name,
      type,
      size: file.size,
      blobPath: blob.pathname,
      uploadedAt: new Date().toISOString(),
    });
    return Response.json({ ok: true, files: record.vaultFiles, record: publicBlueprint(record) }, { headers: c.headers });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : 'Upload failed.' }, { status: 500, headers: c.headers });
  }
}

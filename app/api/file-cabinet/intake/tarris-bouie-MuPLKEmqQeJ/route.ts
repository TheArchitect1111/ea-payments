import { createHash } from 'node:crypto';
import { get, put } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const EXPECTED_SIZE = 1798727;
const EXPECTED_SHA256 = '390ed4546f66522f1ed84ccecd95bc037b24acd87eee7288913c9288027ac667';
const BLOB_PATH = 'ea-file-cabinet/tarris-bouie/Tarris_Bouie_Client_Services_Agreement_OFFICIAL.pdf';
const SHARE_URL = 'https://efficiencyarchitects.online/share/tarris-bouie-MuPLKEmqQeJ';

function sha256(data: Buffer) {
  return createHash('sha256').update(data).digest('hex');
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return Response.json({ ok: false, error: 'PDF file is required.' }, { status: 400 });
    }

    if (file.type && file.type !== 'application/pdf') {
      return Response.json({ ok: false, error: 'Only the approved PDF is accepted.' }, { status: 400 });
    }

    if (file.size !== EXPECTED_SIZE) {
      return Response.json({ ok: false, error: `Wrong file size: ${file.size}.` }, { status: 400 });
    }

    const original = Buffer.from(await file.arrayBuffer());
    const sourceSha256 = sha256(original);
    if (sourceSha256 !== EXPECTED_SHA256) {
      return Response.json({ ok: false, error: 'File fingerprint does not match the approved Tarris agreement.' }, { status: 400 });
    }

    const blob = await put(BLOB_PATH, original, {
      access: 'private',
      contentType: 'application/pdf',
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    const stored = await get(blob.pathname, { access: 'private', useCache: false });
    if (!stored || stored.statusCode !== 200) {
      throw new Error(`Stored Blob read failed: ${stored?.statusCode ?? 'missing'}`);
    }

    const storedBytes = Buffer.from(await new Response(stored.stream).arrayBuffer());
    const storedSha256 = sha256(storedBytes);
    if (storedBytes.length !== EXPECTED_SIZE || storedSha256 !== EXPECTED_SHA256) {
      throw new Error(`Stored verification failed: bytes=${storedBytes.length} sha256=${storedSha256}`);
    }

    return Response.json({
      ok: true,
      exactMatch: true,
      bytes: storedBytes.length,
      sha256: storedSha256,
      shareUrl: SHARE_URL,
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

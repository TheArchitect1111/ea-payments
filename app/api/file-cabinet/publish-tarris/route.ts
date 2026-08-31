import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { get, put } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const EXPECTED_SIZE = 1798727;
const EXPECTED_SHA256 = '390ed4546f66522f1ed84ccecd95bc037b24acd87eee7288913c9288027ac667';
const BLOB_PATH = 'ea-file-cabinet/tarris-bouie/Tarris_Bouie_Client_Services_Agreement_OFFICIAL.pdf';
const PART_COUNT = 8;

function sha256(data: Buffer) {
  return createHash('sha256').update(data).digest('hex');
}

export async function GET() {
  try {
    const base = 'https://raw.githubusercontent.com/TheArchitect1111/ea-payments/master/public/_file-cabinet-import/tarris';
    const parts: string[] = [];

    for (let index = 1; index <= PART_COUNT; index += 1) {
      const part = String(index).padStart(2, '0');
      const response = await fetch(`${base}/part-${part}.txt`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Transport part ${part} unavailable: HTTP ${response.status}`);
      }
      parts.push((await response.text()).trim());
    }

    const compressed = Buffer.from(parts.join(''), 'base64');
    const original = gunzipSync(compressed);
    const sourceSha256 = sha256(original);

    if (original.length !== EXPECTED_SIZE || sourceSha256 !== EXPECTED_SHA256) {
      throw new Error(`Source verification failed: bytes=${original.length} sha256=${sourceSha256}`);
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
    const exactMatch = storedBytes.length === EXPECTED_SIZE && storedSha256 === EXPECTED_SHA256;

    if (!exactMatch) {
      throw new Error(`Stored verification failed: bytes=${storedBytes.length} sha256=${storedSha256}`);
    }

    return Response.json({
      ok: true,
      exactMatch: true,
      bytes: storedBytes.length,
      sha256: storedSha256,
      pathname: blob.pathname,
      shareUrl: 'https://efficiencyarchitects.online/share/tarris-bouie-MuPLKEmqQeJ',
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

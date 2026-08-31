import { createHash, randomBytes } from 'node:crypto';
import { get, put } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_FILE_BYTES = 25 * 1024 * 1024;

function sha256(data: Buffer) {
  return createHash('sha256').update(data).digest('hex');
}

function slug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'client';
}

function safeFilename(value: string) {
  return value
    .replace(/[\\/\0]/g, '-')
    .replace(/[^A-Za-z0-9._ -]+/g, '-')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 160) || 'file';
}

function newShareId(clientSlug: string) {
  return `${clientSlug}-${randomBytes(9).toString('base64url')}`;
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get('file');
    const clientName = String(form.get('clientName') || '').trim();
    const requestedShareId = String(form.get('shareId') || '').trim();
    const expectedSha256 = String(form.get('expectedSha256') || '').trim().toLowerCase();
    const expectedSizeRaw = String(form.get('expectedSize') || '').trim();

    if (!(file instanceof File)) {
      return Response.json({ ok: false, error: 'Choose a file to share.' }, { status: 400 });
    }
    if (!clientName) {
      return Response.json({ ok: false, error: 'Client name is required.' }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
      return Response.json({ ok: false, error: 'File must be between 1 byte and 25 MB.' }, { status: 400 });
    }

    const clientSlug = slug(clientName);
    const shareId = requestedShareId
      ? slug(requestedShareId)
      : newShareId(clientSlug);
    const filename = safeFilename(file.name);
    const bytes = Buffer.from(await file.arrayBuffer());
    const sourceSha256 = sha256(bytes);

    if (expectedSizeRaw) {
      const expectedSize = Number(expectedSizeRaw);
      if (!Number.isSafeInteger(expectedSize) || expectedSize < 1 || bytes.length !== expectedSize) {
        return Response.json({ ok: false, error: `File size verification failed. Received ${bytes.length} bytes.` }, { status: 400 });
      }
    }
    if (expectedSha256 && sourceSha256 !== expectedSha256) {
      return Response.json({ ok: false, error: 'File fingerprint does not match the approved source-of-truth file.' }, { status: 400 });
    }

    const blobPath = `ea-file-cabinet/${clientSlug}/${shareId}/${filename}`;
    const contentType = file.type || 'application/octet-stream';
    const blob = await put(blobPath, bytes, {
      access: 'private',
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    const stored = await get(blob.pathname, { access: 'private', useCache: false });
    if (!stored || stored.statusCode !== 200) {
      throw new Error(`Private storage verification failed with status ${stored?.statusCode ?? 'missing'}.`);
    }

    const storedBytes = Buffer.from(await new Response(stored.stream).arrayBuffer());
    const storedSha256 = sha256(storedBytes);
    if (storedBytes.length !== bytes.length || storedSha256 !== sourceSha256) {
      throw new Error('Private storage verification failed: stored bytes do not match the source file.');
    }

    const record = {
      version: 1,
      shareId,
      clientName,
      clientSlug,
      filename,
      contentType,
      blobPath: blob.pathname,
      bytes: storedBytes.length,
      sha256: storedSha256,
      enabled: true,
      createdAt: new Date().toISOString(),
    };

    await put(
      `ea-file-cabinet/_shares/${shareId}.json`,
      Buffer.from(JSON.stringify(record), 'utf8'),
      {
        access: 'private',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
      },
    );

    const shareUrl = `https://efficiencyarchitects.online/share/${shareId}`;
    return Response.json({
      ok: true,
      exactMatch: true,
      shareId,
      shareUrl,
      bytes: record.bytes,
      sha256: record.sha256,
      filename: record.filename,
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

import { get, issueSignedToken, presignUrl } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PATHNAME = 'AesthetiKine 1-Day Nervous System Reset Manual.pdf';
const EXACT_SIZE = 12801515;

export async function GET() {
  try {
    const existing = await get(PATHNAME, { access: 'private', useCache: false });
    if (existing?.statusCode === 200) {
      return NextResponse.json({ ok: true, alreadyPresent: true, pathname: PATHNAME });
    }
  } catch {
    // Expected while the recovery target is missing.
  }

  const validUntil = Date.now() + 2 * 60 * 1000;
  const token = await issueSignedToken({
    pathname: PATHNAME,
    operations: ['put'],
    validUntil,
    allowedContentTypes: ['application/pdf'],
    maximumSizeInBytes: EXACT_SIZE,
  });
  const { presignedUrl } = await presignUrl(token, {
    pathname: PATHNAME,
    operation: 'put',
    access: 'private',
    validUntil,
    allowedContentTypes: ['application/pdf'],
    maximumSizeInBytes: EXACT_SIZE,
    allowOverwrite: false,
    addRandomSuffix: false,
  });

  return NextResponse.json({
    ok: true,
    alreadyPresent: false,
    pathname: PATHNAME,
    exactSize: EXACT_SIZE,
    contentType: 'application/pdf',
    expiresAt: validUntil,
    presignedUrl,
  });
}

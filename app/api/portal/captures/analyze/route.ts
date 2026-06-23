import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { getClientByPortalSlug } from '@/lib/airtable';
import { type CaptureInput } from '@/lib/capture-pipeline';
import { portalCaptureSource } from '@/lib/capture-records';
import { submitCapture, toCaptureApiResponse } from '@/lib/capture-submit';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function parseCaptureInput(req: Request): Promise<{
  input: CaptureInput;
  prospectName?: string;
  notes?: string;
  asyncMode: boolean;
}> {
  const contentType = req.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const url = (form.get('url') as string | null)?.trim();
    const notes = (form.get('notes') as string | null)?.trim();
    const prospectName = (form.get('prospectName') as string | null)?.trim();
    const asyncMode = (form.get('async') as string | null) !== 'false';
    const file = form.get('file');

    if (file instanceof File && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      return {
        input: {
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          fileBase64: buffer.toString('base64'),
          notes,
        },
        prospectName,
        notes,
        asyncMode,
      };
    }

    if (url) {
      return { input: { url, notes }, prospectName, notes, asyncMode };
    }

    throw new Error('URL or file is required.');
  }

  const body = (await req.json()) as {
    url?: string;
    notes?: string;
    prospectName?: string;
    async?: boolean;
    screenshotBase64?: string;
    pageUrl?: string;
  };

  const url = body.url?.trim();
  if (!url && !body.screenshotBase64) {
    throw new Error('URL is required.');
  }

  return {
    input: {
      url,
      notes: body.notes?.trim(),
      screenshotBase64: body.screenshotBase64,
      pageUrl: body.pageUrl?.trim() || url,
      fileName: body.screenshotBase64 ? 'screenshot.png' : undefined,
      mimeType: body.screenshotBase64 ? 'image/png' : undefined,
    },
    prospectName: body.prospectName?.trim(),
    notes: body.notes?.trim(),
    asyncMode: body.async !== false,
  };
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Please log in again.' }, { status: 401 });
  }

  const client = await getClientByPortalSlug(session.slug);
  if (!client) {
    return NextResponse.json({ ok: false, error: 'Client record not found.' }, { status: 404 });
  }

  if (client.packagePurchased !== 'Simplifi' && session.slug !== 'demo-client') {
    return NextResponse.json(
      { ok: false, error: 'Simplifi Early Access is required to capture opportunities.' },
      { status: 403 },
    );
  }

  let parsed: Awaited<ReturnType<typeof parseCaptureInput>>;
  try {
    parsed = await parseCaptureInput(req);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid capture request.';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  const source = portalCaptureSource(session.slug);
  const result = await submitCapture(parsed.input, source, {
    portalSlug: session.slug,
    prospectName: parsed.prospectName,
    notifyEmail: client.email,
    asyncMode: parsed.asyncMode,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? 'Simplifi could not process this opportunity.' },
      { status: 500 },
    );
  }

  return NextResponse.json(toCaptureApiResponse(result));
}

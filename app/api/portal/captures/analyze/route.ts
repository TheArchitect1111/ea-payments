import { NextResponse } from 'next/server';
import { guardPortalApiCookie, portalApiUnauthorized } from '@/lib/api/portal-route';
import { getClientByPortalSlug } from '@/lib/airtable';
import { type CaptureInput } from '@/lib/capture-pipeline';
import { portalCaptureSource } from '@/lib/capture-records';
import { submitCapture, toCaptureApiResponse } from '@/lib/capture-submit';
import { isModuleEnabled } from '@/lib/modules/portal-modules';

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
  const auth = await guardPortalApiCookie({ realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const session = auth.session;

  const client = await getClientByPortalSlug(session.slug);
  if (!client) {
    return NextResponse.json({ ok: false, error: 'Client record not found.' }, { status: 404 });
  }

  const simplifiEnabled = await isModuleEnabled({
    orgId: session.orgId,
    slug: session.slug,
    moduleId: 'simplifi',
    packagePurchased: client.packagePurchased,
    role: session.role,
  });

  if (!simplifiEnabled && session.slug !== 'demo-client') {
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

import { NextResponse } from 'next/server';
import { guardPortalApiCookie, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { getClientByPortalSlug } from '@/lib/airtable';
import { type CaptureInput } from '@/lib/capture-pipeline';
import { portalCaptureSource } from '@/lib/capture-records';
import { submitCapture, toCaptureApiResponse } from '@/lib/capture-submit';
import { isModuleEnabled } from '@/lib/modules/portal-modules';
import {
  MAX_CAPTURE_UPLOAD_BYTES,
  captureUploadTooLargeMessage,
} from '@/lib/capture-upload-limits';

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
      if (file.size > MAX_CAPTURE_UPLOAD_BYTES) {
        throw new Error(captureUploadTooLargeMessage(file.size));
      }
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

    if (notes) {
      return {
        input: { notes, fileName: 'shared-note.txt', mimeType: 'text/plain' },
        prospectName,
        notes,
        asyncMode,
      };
    }

    throw new Error('URL, notes, or file is required.');
  }

  const body = (await req.json()) as {
    url?: string;
    notes?: string;
    title?: string;
    prospectName?: string;
    async?: boolean;
    screenshotBase64?: string;
    pageUrl?: string;
  };

  const url = body.url?.trim();
  const notes = body.notes?.trim() || body.title?.trim();
  if (!url && !body.screenshotBase64 && !notes) {
    throw new Error('URL, notes, or screenshot is required.');
  }

  if (!url && !body.screenshotBase64 && notes) {
    return {
      input: {
        notes,
        fileName: 'shared-note.txt',
        mimeType: 'text/plain',
      },
      prospectName: body.prospectName?.trim(),
      notes,
      asyncMode: body.async !== false,
    };
  }

  return {
    input: {
      url,
      notes,
      screenshotBase64: body.screenshotBase64,
      pageUrl: body.pageUrl?.trim() || url,
      fileName: body.screenshotBase64 ? 'screenshot.png' : undefined,
      mimeType: body.screenshotBase64 ? 'image/png' : undefined,
    },
    prospectName: body.prospectName?.trim(),
    notes,
    asyncMode: body.async !== false,
  };
}

export async function POST(req: Request) {
  const auth = await guardPortalApiCookie({ realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  const session = auth.session;

  const client = await getClientByPortalSlug(tenant.portalSlug);
  if (!client) {
    return NextResponse.json({ ok: false, error: 'Client record not found.' }, { status: 404 });
  }

  const simplifiEnabled = await isModuleEnabled({
    orgId: tenant.organizationId,
    slug: tenant.portalSlug,
    moduleId: 'simplifi',
    packagePurchased: client.packagePurchased,
    role: session.role,
  });

  if (!simplifiEnabled && tenant.portalSlug !== 'demo-client') {
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
    const status = /Keep uploads under|File is /i.test(message) ? 413 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }

  const source = portalCaptureSource(tenant.portalSlug);
  const result = await submitCapture(parsed.input, source, {
    portalSlug: tenant.portalSlug,
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

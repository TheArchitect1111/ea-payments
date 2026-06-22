import { CAPTURE_CORS_HEADERS, verifyCaptureApiKey } from '@/lib/capture-auth';
import {
  analyzeAndCapture,
  analyzeAndCaptureAsset,
  enqueueCaptureAsset,
  type CaptureInput,
} from '@/lib/capture-pipeline';
import { scheduleCaptureJob } from '@/lib/capture-async';
import { buildCaptureApiResponse } from '@/lib/capture-response';

export async function OPTIONS() {
  return new Response(null, { headers: CAPTURE_CORS_HEADERS });
}

function corsJson(body: unknown, status = 200) {
  return Response.json(body, { status, headers: CAPTURE_CORS_HEADERS });
}

export async function POST(req: Request) {
  const headerKey = req.headers.get('x-ea-capture-key');
  const body = (await req.json()) as {
    url?: string;
    apiKey?: string;
    title?: string;
    mode?: 'capture' | 'blueprint' | 'amplify';
    screenshotBase64?: string;
    async?: boolean;
    notifyEmail?: string;
    portalSlug?: string;
    prospectName?: string;
  };
  const key = headerKey ?? body.apiKey;

  if (!verifyCaptureApiKey(key)) {
    return corsJson({ ok: false, error: 'Invalid capture API key.' }, 401);
  }

  const url = body.url?.trim();
  if (!url && !body.screenshotBase64) {
    return corsJson({ ok: false, error: 'URL or screenshot is required.' }, 400);
  }

  const source =
    body.mode === 'blueprint'
      ? 'Browser Extension (Blueprint)'
      : body.mode === 'amplify'
        ? 'Browser Extension (Amplifi)'
        : 'Browser Extension';

  const input: CaptureInput = {
    url,
    pageUrl: url,
    screenshotBase64: body.screenshotBase64,
    fileName: body.screenshotBase64 ? 'screenshot.png' : undefined,
    mimeType: body.screenshotBase64 ? 'image/png' : undefined,
    notes: body.title ? `Page title: ${body.title}` : undefined,
  };

  const options = {
    generateBlueprint: body.mode !== 'capture' ? true : true,
    portalSlug: body.portalSlug,
    prospectName: body.prospectName,
    notifyEmail: body.notifyEmail,
  };

  const asyncMode = body.async !== false;

  if (asyncMode) {
    const queued = await enqueueCaptureAsset(input, source, options);
    if (!queued.ok || !queued.record) {
      return corsJson({ ok: false, error: queued.error ?? 'Could not queue capture.' }, 500);
    }

    scheduleCaptureJob(queued.record.id, input, source, options);

    return corsJson({
      ok: true,
      processing: true,
      captureId: queued.record.id,
      status: 'Analyzing',
      record: queued.record,
    });
  }

  const result = url
    ? await analyzeAndCapture(url, source, options)
    : await analyzeAndCaptureAsset(input, source, options);

  if (!result.ok) {
    return corsJson({ ok: false, error: result.error }, 500);
  }

  return corsJson(buildCaptureApiResponse(result));
}

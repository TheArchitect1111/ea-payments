import { CAPTURE_CORS_HEADERS, verifyCaptureApiKey } from '@/lib/capture-auth';
import { type CaptureInput } from '@/lib/capture-pipeline';
import { submitCapture, toCaptureApiResponse } from '@/lib/capture-submit';

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
    notes?: string;
    selectedText?: string;
    source?: string;
  };
  const key = headerKey ?? body.apiKey;

  if (!verifyCaptureApiKey(key)) {
    return corsJson({ ok: false, error: 'Invalid capture API key.' }, 401);
  }

  const url = body.url?.trim();
  if (!url && !body.screenshotBase64) {
    return corsJson({ ok: false, error: 'URL or screenshot is required.' }, 400);
  }

  const source = body.source?.trim() || (
    body.mode === 'blueprint'
      ? 'Browser Extension (Blueprint)'
      : body.mode === 'amplify'
        ? 'Browser Extension (Amplifi)'
        : 'Browser Extension'
  );
  const notes = [
    body.title ? `Page title: ${body.title}` : '',
    body.selectedText ? `Selected text: ${body.selectedText}` : '',
    body.notes,
  ].filter(Boolean).join('\n\n');

  const input: CaptureInput = {
    url,
    pageUrl: url,
    screenshotBase64: body.screenshotBase64,
    fileName: body.screenshotBase64 ? 'screenshot.png' : undefined,
    mimeType: body.screenshotBase64 ? 'image/png' : undefined,
    notes: notes || undefined,
  };

  const result = await submitCapture(input, source, {
    generateBlueprint: body.mode !== 'capture' ? true : true,
    portalSlug: body.portalSlug,
    prospectName: body.prospectName,
    notifyEmail: body.notifyEmail,
    asyncMode: body.async !== false,
  });

  if (!result.ok) {
    return corsJson({ ok: false, error: result.error }, 500);
  }

  return corsJson(toCaptureApiResponse(result));
}

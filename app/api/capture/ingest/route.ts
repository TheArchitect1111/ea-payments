import { CAPTURE_CORS_HEADERS, verifyCaptureApiKey } from '@/lib/capture-auth';
import { analyzeAndCapture } from '@/lib/capture-pipeline';

export async function OPTIONS() {
  return new Response(null, { headers: CAPTURE_CORS_HEADERS });
}

export async function POST(req: Request) {
  const headerKey = req.headers.get('x-ea-capture-key');
  const body = (await req.json()) as { url?: string; apiKey?: string; title?: string };
  const key = headerKey ?? body.apiKey;

  if (!verifyCaptureApiKey(key)) {
    return Response.json(
      { ok: false, error: 'Invalid capture API key.' },
      { status: 401, headers: CAPTURE_CORS_HEADERS }
    );
  }

  const url = body.url?.trim();
  if (!url) {
    return Response.json(
      { ok: false, error: 'URL is required.' },
      { status: 400, headers: CAPTURE_CORS_HEADERS }
    );
  }

  const result = await analyzeAndCapture(url, 'Browser Extension');

  if (!result.ok) {
    return Response.json(
      { ok: false, error: result.error },
      { status: 500, headers: CAPTURE_CORS_HEADERS }
    );
  }

  return Response.json(
    {
      ok: true,
      record: result.record,
      scores: result.scores,
      classification: result.classification,
    },
    { headers: CAPTURE_CORS_HEADERS }
  );
}

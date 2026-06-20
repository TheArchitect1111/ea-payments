import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { analyzeAndCapture } from '@/lib/capture-pipeline';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const body = (await req.json()) as { url?: string; source?: string };
  const url = body.url?.trim();
  if (!url) {
    return Response.json({ ok: false, error: 'URL is required.' }, { status: 400 });
  }

  const result = await analyzeAndCapture(url, body.source ?? 'Mission Control');

  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: 500 });
  }

  return Response.json({
    ok: true,
    record: result.record,
    scores: result.scores,
    classification: result.classification,
    recommendations: result.recommendations,
    blueprint: result.blueprint,
    trust: result.trust,
  });
}

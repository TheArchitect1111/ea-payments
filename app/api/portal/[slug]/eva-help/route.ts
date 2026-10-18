import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { loadPortalKnowledge } from '@/src/bricks/eva-portal-help/manifest-loader';
import { guideOneStep } from '@/src/bricks/eva-portal-help/guide';
import { normalizeGuideRole } from '@/src/bricks/eva-portal-help/roles';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cookie = (await cookies()).get(EA_PORTAL_COOKIE)?.value;
  const session = cookie ? await verifySession(cookie) : null;
  if (!session) return NextResponse.json({ ok: false, error: 'Portal sign-in required.' }, { status: 401 });
  if (session.slug !== slug) return NextResponse.json({ ok: false, error: 'This portal is not available in your account.' }, { status: 403 });
  let data: ReturnType<typeof loadPortalKnowledge>;
  try { data = loadPortalKnowledge(slug); }
  catch { return NextResponse.json({ ok: false, error: 'Portal help knowledge unavailable.' }, { status: 503 }); }
  const origin = request.headers.get('origin');
  if (origin && origin !== data.origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ ok: false, error: 'Invalid request origin.' }, { status: 403 });
  }
  let body: { question?: unknown; entryKey?: unknown; stepIndex?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 }); }
  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (!question || question.length > 500) return NextResponse.json({ ok: false, error: 'Enter a question up to 500 characters.' }, { status: 400 });
  const entryKey = typeof body.entryKey === 'string' ? body.entryKey : undefined;
  const stepIndex = typeof body.stepIndex === 'number' ? body.stepIndex : undefined;
  try {
    const result = await guideOneStep({ portalId: slug, role: normalizeGuideRole(session.role), question, entryKey, stepIndex });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ ok: false, error: 'Portal help could not complete this request.' }, { status: 503 });
  }
}

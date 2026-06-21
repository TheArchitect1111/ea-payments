import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { getClientByPortalSlug } from '@/lib/airtable';
import { analyzeAndCapture } from '@/lib/capture-pipeline';
import { portalCaptureSource } from '@/lib/capture-records';

export const dynamic = 'force-dynamic';

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

  if (client.packagePurchased !== 'Simplifi') {
    return NextResponse.json(
      { ok: false, error: 'Simplifi Early Access is required to capture opportunities.' },
      { status: 403 },
    );
  }

  const body = (await req.json()) as { url?: string };
  const url = body.url?.trim();
  if (!url) {
    return NextResponse.json({ ok: false, error: 'URL is required.' }, { status: 400 });
  }

  const result = await analyzeAndCapture(url, portalCaptureSource(session.slug));

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? 'Simplifi could not process this opportunity.' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    record: result.record,
    scores: result.scores,
    recommendations: result.recommendations,
    trust: result.trust,
    magnifiUrl: result.record ? `/magnifi/${result.record.id}` : undefined,
    guidanceUrl: result.record ? `/simplifi/guidance/${result.record.id}` : undefined,
  });
}

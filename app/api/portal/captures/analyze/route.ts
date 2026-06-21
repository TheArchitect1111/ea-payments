import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { getClientByPortalSlug } from '@/lib/airtable';
import { analyzeAndCaptureAsset } from '@/lib/capture-pipeline';
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

  const contentType = req.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const url = (form.get('url') as string | null)?.trim();
    const notes = (form.get('notes') as string | null)?.trim();
    const prospectName = (form.get('prospectName') as string | null)?.trim();
    const file = form.get('file');

    if (file instanceof File && file.size > 0) {
      const result = await analyzeAndCaptureAsset(
        {
          fileName: file.name,
          mimeType: file.type,
          notes,
        },
        portalCaptureSource(session.slug),
        { portalSlug: session.slug, prospectName },
      );

      if (!result.ok) {
        return NextResponse.json(
          { ok: false, error: result.error ?? 'Simplifi could not process this asset.' },
          { status: 500 },
        );
      }

      return NextResponse.json(buildResponse(result));
    }

    if (url) {
      const result = await analyzeAndCaptureAsset(
        { url, notes },
        portalCaptureSource(session.slug),
        { portalSlug: session.slug, prospectName },
      );

      if (!result.ok) {
        return NextResponse.json(
          { ok: false, error: result.error ?? 'Simplifi could not process this opportunity.' },
          { status: 500 },
        );
      }

      return NextResponse.json(buildResponse(result));
    }

    return NextResponse.json({ ok: false, error: 'URL or file is required.' }, { status: 400 });
  }

  const body = (await req.json()) as { url?: string; notes?: string; prospectName?: string };
  const url = body.url?.trim();
  if (!url) {
    return NextResponse.json({ ok: false, error: 'URL is required.' }, { status: 400 });
  }

  const result = await analyzeAndCaptureAsset(
    { url, notes: body.notes?.trim() },
    portalCaptureSource(session.slug),
    { portalSlug: session.slug, prospectName: body.prospectName?.trim() },
  );

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? 'Simplifi could not process this opportunity.' },
      { status: 500 },
    );
  }

  return NextResponse.json(buildResponse(result));
}

function buildResponse(result: Awaited<ReturnType<typeof analyzeAndCaptureAsset>>) {
  return {
    ok: true,
    record: result.record,
    scores: result.scores,
    businessScores: result.opportunity?.analysis.scores,
    recommendations: result.recommendations,
    trust: result.trust,
    magnifiUrl: result.record ? `/magnifi/${result.record.id}` : undefined,
    guidanceUrl: result.record ? `/simplifi/guidance/${result.record.id}` : undefined,
    considerUrl: result.opportunity?.shareUrl,
    considerSlug: result.opportunity?.prospectSlug,
    clientMessage: result.opportunity?.clientMessage,
  };
}

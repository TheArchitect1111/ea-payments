import { NextRequest, NextResponse } from 'next/server';
import { runPostBuildConceptPack } from '@/lib/factory-post-build-concepts';
import { getFactoryProject } from '@/lib/factory-project-store';
import { buildQuickLaunchReview } from '@/lib/factory-quick-launch-review';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Preview-only recovery: force ECE + concept pack for a known project.
 * Auth: Bearer PREVIEW_RECOVER_TOKEN (Preview env only). Never enable on Production.
 */
export async function POST(req: NextRequest) {
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production.' }, { status: 404 });
  }

  const expected = (
    process.env.PREVIEW_RECOVER_TOKEN ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    ''
  ).trim();
  if (!expected) {
    return NextResponse.json({ error: 'Preview recover auth is not configured.' }, { status: 503 });
  }

  const auth = req.headers.get('authorization') || '';
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  if (!bearer || bearer !== expected) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let body: { projectId?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const projectId = String(body.projectId || '').trim();
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required.' }, { status: 400 });
  }

  const before = await getFactoryProject(projectId);
  if (!before) {
    return NextResponse.json({ error: 'Factory project not found.' }, { status: 404 });
  }

  const result = await runPostBuildConceptPack(projectId, { force: true });
  const after = (await getFactoryProject(projectId)) || before;
  const review = await buildQuickLaunchReview(after, { verifyPreviews: true });

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        blocked: result.blocked,
        error: result.error,
        qualityBlocked: review.qualityBlocked,
        qualityReasons: review.qualityReasons,
      },
      { status: result.blocked ? 409 : 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    skipped: result.skipped,
    client: after.client,
    qualityBlocked: review.qualityBlocked,
    qualityReasons: review.qualityReasons,
    concepts: review.concepts.map((c) => ({
      conceptId: c.conceptId,
      name: c.name,
      websitePreviewPath: c.websitePreviewPath,
      portalPreviewPath: c.portalPreviewPath,
      websiteVerified: c.websiteVerified,
      portalVerified: c.portalVerified,
    })),
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { resolveSessionFromRequest } from '@/lib/auth';
import { updateConnectOrgCopy } from '@/lib/connect-store';
import { roleAtLeast, normalizeRole } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await resolveSessionFromRequest(req, { realm: 'portal' });
  if (!session?.slug) {
    return NextResponse.json({ error: 'Portal login required.' }, { status: 401 });
  }
  if (!roleAtLeast(normalizeRole(session.role), 'owner')) {
    return NextResponse.json({ error: 'Portal owner access required.' }, { status: 403 });
  }

  let body: {
    offerHeadline?: string;
    resourceTitle?: string;
    guideIntro?: string;
    journeyIntro?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!body.offerHeadline?.trim() && !body.resourceTitle?.trim() && !body.guideIntro?.trim() && !body.journeyIntro?.trim()) {
    return NextResponse.json({ error: 'At least one copy field is required.' }, { status: 400 });
  }

  try {
    const result = await updateConnectOrgCopy({
      orgSlug: session.slug,
      offerHeadline: body.offerHeadline,
      resourceTitle: body.resourceTitle,
      guideIntro: body.guideIntro,
      journeyIntro: body.journeyIntro,
    });

    return NextResponse.json({
      ok: true,
      persisted: result.persisted,
      warning: result.warning,
      copy: {
        offerHeadline: result.org.offer.headline,
        resourceTitle: result.org.offer.resourceTitle,
        guideIntro: result.org.guide.intro,
        journeyIntro: result.org.journey.intro,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save copy.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

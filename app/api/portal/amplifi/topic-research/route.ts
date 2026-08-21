import { NextRequest, NextResponse } from 'next/server';
import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';
import { getClientByPortalSlug } from '@/lib/airtable';
import { isModuleEnabled } from '@/lib/modules/portal-modules';
import {
  runAmplifiTopicResearch,
  validateTopicResearchInput,
} from '@/lib/amplifi/topic-research';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * Amplifi Search — topic + date-range web research → social draft.
 * Does not publish; caller submits for approval separately.
 */
export async function POST(req: NextRequest) {
  const auth = await guardPortalApi(req, { realm: 'simplifi' });
  if (!auth.ok) return portalApiUnauthorized(auth);
  const tenant = portalTenant(auth.session);
  const session = auth.session;

  const client = await getClientByPortalSlug(tenant.portalSlug);
  if (!client) {
    return NextResponse.json({ ok: false, error: 'Client not found.' }, { status: 404 });
  }

  const amplifiEnabled = await isModuleEnabled({
    orgId: tenant.organizationId,
    slug: tenant.portalSlug,
    moduleId: 'amplifi',
    packagePurchased: client.packagePurchased,
    role: session.role,
  });

  if (!amplifiEnabled && tenant.portalSlug !== 'demo-client') {
    return NextResponse.json(
      { ok: false, error: 'Amplifi is required for topic research.' },
      { status: 403 },
    );
  }

  let body: { topic?: string; dateFrom?: string; dateTo?: string; maxSources?: number; postCount?: number; objective?: string; audience?: string; tone?: string; callToAction?: string; ctaUrl?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON.' }, { status: 400 });
  }

  const validated = validateTopicResearchInput(body);
  if (!validated.ok) {
    return NextResponse.json({ ok: false, error: validated.error }, { status: 400 });
  }

  try {
    const result = await runAmplifiTopicResearch({
      ...validated.value,
      maxSources: body.maxSources,
      postCount: Math.min(3, Math.max(1, Math.trunc(Number(body.postCount) || 1))) as 1 | 2 | 3,
      objective: String(body.objective || '').trim(),
      audience: String(body.audience || '').trim(),
      tone: String(body.tone || '').trim(),
      callToAction: String(body.callToAction || '').trim(),
      ctaUrl: String(body.ctaUrl || '').trim(),
      scrapeTop: 3,
    });
    return NextResponse.json({ ok: true, research: result });
  } catch (err) {
    console.error('[amplifi-topic-research]', err instanceof Error ? err.message : 'error');
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message.slice(0, 240)
            : 'Topic research failed. Try a narrower topic or date range.',
      },
      { status: 502 },
    );
  }
}

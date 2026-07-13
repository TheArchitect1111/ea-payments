import { cookies } from 'next/headers';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import {
  assembleLandingTemplate,
  assembleWebsiteForClient,
  getWebsiteEngineSummary,
  listUnifiedWebsiteSections,
  listWebsiteSectionsBySource,
} from '@/lib/platform/website-bridge';
import { getContentPackForClient } from '@/lib/platform/content-packs';

export const dynamic = 'force-dynamic';

/**
 * Website Engine API (admin).
 * GET /api/platform/website
 * GET /api/platform/website?view=landing
 * GET /api/platform/website?view=experience
 * GET /api/platform/website?view=client&client=cpr
 * GET /api/platform/website?view=assemble&id=cpr-home&name=CPR%20Home&org=cpr&theme=cpr-theme
 */
export async function GET(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view') ?? 'summary';

  if (view === 'landing') {
    return Response.json({
      ok: true,
      sections: listWebsiteSectionsBySource('landing-chassis'),
    });
  }

  if (view === 'experience') {
    return Response.json({
      ok: true,
      sections: listWebsiteSectionsBySource('experience-builder'),
    });
  }

  if (view === 'sections') {
    return Response.json({ ok: true, sections: listUnifiedWebsiteSections() });
  }

  if (view === 'client') {
    const clientId = searchParams.get('client')?.trim() || 'ea';
    const assembled = assembleWebsiteForClient(clientId);
    if (!assembled) {
      return Response.json({ error: `Unknown client: ${clientId}` }, { status: 404 });
    }
    return Response.json({
      ok: true,
      clientId: assembled.clientId,
      clientName: assembled.clientName,
      themeId: assembled.themeId,
      personalityId: assembled.personalityId,
      personalityName: assembled.personalityName,
      copy: assembled.copy,
      terminology: assembled.terminology,
      page: assembled.assembly.page,
      sections: assembled.sections,
      missingSectionIds: assembled.missingSectionIds,
      cssVars: assembled.cssVars,
      contentPack: (() => {
        const pack = getContentPackForClient(assembled.clientId);
        return pack
          ? { id: pack.id, label: pack.label, vertical: pack.vertical, summary: pack.summary }
          : null;
      })(),
    });
  }

  if (view === 'assemble') {
    const id = searchParams.get('id') ?? 'demo-home';
    const name = searchParams.get('name') ?? 'Demo Home';
    const organizationId = searchParams.get('org') ?? undefined;
    const themeId = searchParams.get('theme') ?? undefined;
    const assembled = assembleLandingTemplate({ id, name, organizationId, themeId });
    return Response.json({
      ok: true,
      page: assembled.page,
      resolved: assembled.resolved.map((r) => ({
        sectionId: r.instance.sectionId,
        kind: r.instance.kind,
        order: r.instance.order,
        name: r.definition?.name,
        source: r.definition?.source,
      })),
      missingSectionIds: assembled.missingSectionIds,
    });
  }

  return Response.json({
    ok: true,
    summary: getWebsiteEngineSummary(),
    sections: listUnifiedWebsiteSections().map((s) => ({
      id: s.id,
      kind: s.kind,
      name: s.name,
      source: s.source,
      landingKey: s.landingKey,
      blockId: s.blockId,
      category: s.category,
    })),
  });
}

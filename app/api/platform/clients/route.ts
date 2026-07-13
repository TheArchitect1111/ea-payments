import { cookies } from 'next/headers';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import {
  assembleClientApplication,
  listPlatformClients,
} from '@/lib/platform/client-configs';
import { listWorkspacePersonalities } from '@ea/personality-engine';
import { listWorkspaceThemes } from '@ea/theme-engine';

export const dynamic = 'force-dynamic';

/** GET /api/platform/clients — admin client config + assemble */
export async function GET(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view');
  const clientId = searchParams.get('client');

  if (view === 'themes') {
    return Response.json({ ok: true, themes: listWorkspaceThemes() });
  }
  if (view === 'personalities') {
    return Response.json({ ok: true, personalities: listWorkspacePersonalities() });
  }
  if (clientId) {
    const app = assembleClientApplication(clientId);
    if (!app) {
      return Response.json({ error: `Unknown client: ${clientId}` }, { status: 404 });
    }
    return Response.json({
      ok: true,
      client: app.client,
      theme: app.theme,
      cssVars: app.cssVars,
      personality: {
        id: app.personality.id,
        name: app.personality.name,
        density: app.personality.density,
        terminology: app.terminology,
        sectionOrder: app.personality.sectionOrder,
        aiInstructions: app.personality.aiInstructions,
      },
      capabilityIds: app.capabilityIds,
      plannedCapabilityIds: app.plannedCapabilityIds,
      surface: {
        navigation: app.surface.navigation,
        routes: app.surface.routes,
        widgets: app.surface.widgets,
        aiSkills: app.surface.aiSkills,
        missingCapabilityIds: app.surface.missingCapabilityIds,
      },
      aiContext: app.aiContext,
      capabilityConfig: app.capabilityConfig,
    });
  }

  return Response.json({ ok: true, clients: listPlatformClients() });
}

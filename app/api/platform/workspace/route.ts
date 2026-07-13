import { cookies } from 'next/headers';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import {
  assembleWorkspaceForClient,
  listWorkspaceShellSummaries,
} from '@/lib/platform/workspace-bridge';

export const dynamic = 'force-dynamic';

/**
 * Workspace Engine API (admin).
 * GET /api/platform/workspace
 * GET /api/platform/workspace?client=cpr
 */
export async function GET(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = new URL(req.url).searchParams.get('client');
  if (clientId) {
    const shell = assembleWorkspaceForClient(clientId);
    if (!shell) {
      return Response.json({ error: `Unknown client: ${clientId}` }, { status: 404 });
    }
    return Response.json({
      ok: true,
      shell: {
        organizationId: shell.organizationId,
        name: shell.name,
        workspaceName: shell.workspaceName,
        theme: shell.theme,
        cssVars: shell.cssVars,
        personality: {
          id: shell.personality.id,
          name: shell.personality.name,
          density: shell.personality.density,
          informationDepth: shell.personality.informationDepth,
        },
        terminology: shell.terminology,
        sectionOrder: shell.sectionOrder,
        dashboardSections: shell.dashboardSections,
        primaryActions: shell.primaryActions,
        emptyStateLanguage: shell.emptyStateLanguage,
        aiContext: shell.aiContext,
        plannedCapabilityIds: shell.plannedCapabilityIds,
        surface: {
          enabledCapabilityIds: shell.surface.enabledCapabilityIds,
          missingCapabilityIds: shell.surface.missingCapabilityIds,
          navigation: shell.surface.navigation,
          routes: shell.surface.routes,
          widgets: shell.surface.widgets,
          aiSkills: shell.surface.aiSkills,
        },
        capabilityConfig: shell.capabilityConfig,
      },
    });
  }

  return Response.json({ ok: true, workspaces: listWorkspaceShellSummaries() });
}

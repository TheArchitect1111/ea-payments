import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { listPlatformClients } from '@/lib/platform/client-configs';
import { assembleWorkspaceForClient } from '@/lib/platform/workspace-bridge';
import AdminLogin from '../master/AdminLogin';
import WorkspacePreviewClient from './WorkspacePreviewClient';

export const dynamic = 'force-dynamic';

export default async function WorkspacePreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    return <AdminLogin />;
  }

  const params = await searchParams;
  const clients = listPlatformClients();
  const clientId = params.client?.trim() || clients[0]?.id || 'ea';
  const shell = assembleWorkspaceForClient(clientId);

  return (
    <WorkspacePreviewClient
      clients={clients.map((c) => ({ id: c.id, name: c.name, workspaceName: c.workspaceName }))}
      clientId={clientId}
      shell={
        shell
          ? {
              organizationId: shell.organizationId,
              name: shell.name,
              workspaceName: shell.workspaceName,
              cssVars: shell.cssVars,
              theme: {
                id: shell.theme.id,
                primaryColor: shell.theme.primaryColor,
                accentColor: shell.theme.accentColor,
                backgroundColor: shell.theme.backgroundColor,
                surfaceColor: shell.theme.surfaceColor,
                textColor: shell.theme.textColor,
                mutedTextColor: shell.theme.mutedTextColor,
                borderColor: shell.theme.borderColor,
                fontHeading: shell.theme.fontHeading,
                fontBody: shell.theme.fontBody,
              },
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
              navigation: shell.surface.navigation,
              widgets: shell.surface.widgets,
              aiSkills: shell.surface.aiSkills,
              enabledCapabilityIds: shell.surface.enabledCapabilityIds,
              missingCapabilityIds: shell.surface.missingCapabilityIds,
            }
          : null
      }
    />
  );
}

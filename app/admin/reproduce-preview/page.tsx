import { cookies } from 'next/headers';
import { EA_ADMIN_COOKIE, verifyAdminSession } from '@/lib/ea-admin-auth';
import {
  assembleReproduceSurfaces,
  listReproduceClientOptions,
} from '@/lib/platform/reproduce';
import AdminLogin from '../master/AdminLogin';
import ReproducePreviewClient from './ReproducePreviewClient';

export const dynamic = 'force-dynamic';

export default async function ReproducePreviewPage({
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
  const clients = listReproduceClientOptions();
  const clientId = params.client?.trim() || clients[0]?.id || 'ea';
  const surfaces = assembleReproduceSurfaces(clientId);

  const portal = surfaces?.portal;
  const landing = surfaces?.landing;

  return (
    <ReproducePreviewClient
      clients={clients}
      clientId={clientId}
      urls={
        surfaces?.urls ?? {
          workspacePreview: `/admin/workspace-preview?client=${clientId}`,
          reproducePreview: `/admin/reproduce-preview?client=${clientId}`,
          publicSite: `/site/${clientId}`,
          websiteApi: `/api/platform/website?view=client&client=${clientId}`,
          workspaceApi: `/api/platform/workspace?client=${clientId}`,
          domainsApi: `/api/platform/domains?slug=${clientId}`,
        }
      }
      portal={
        portal
          ? {
              name: portal.name,
              workspaceName: portal.workspaceName,
              cssVars: portal.cssVars,
              personalityName: portal.personality.name,
              themeId: portal.theme.id,
              terminology: portal.terminology,
              homeLabel: portal.terminology.home || portal.workspaceName,
              membersLabel: portal.terminology.members || 'Members',
              startPrompt: portal.terminology.startPrompt || portal.emptyStateLanguage,
              navigation: portal.surface.navigation.map((n) => ({
                label: n.label,
                capabilityId: n.capabilityId,
              })),
              enabledCapabilityCount: portal.surface.enabledCapabilityIds.length,
              missingCapabilityCount: portal.surface.missingCapabilityIds.length,
              widgets: portal.surface.widgets.slice(0, 6).map((w) => ({
                id: w.id,
                title: w.title,
              })),
              primaryActions: portal.primaryActions.slice(0, 4),
            }
          : null
      }
      landing={
        landing
          ? {
              pageId: landing.assembly.page.id,
              pageName: landing.assembly.page.name,
              cssVars: landing.cssVars,
              personalityName: landing.personalityName,
              themeId: landing.themeId,
              copy: landing.copy,
              sections: landing.sections,
              missingSectionIds: landing.missingSectionIds,
              seo: landing.assembly.page.seo ?? {},
            }
          : null
      }
      contentPack={surfaces?.contentPack ?? null}
      domains={surfaces?.domains ?? []}
    />
  );
}

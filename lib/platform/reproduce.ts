/**
 * Reproduce Engine — assemble portal + landing from one ClientConfig.
 */
import { assembleWorkspaceForClient } from './workspace-bridge';
import { assembleWebsiteForClient, type AssembledClientWebsite } from './website-bridge';
import { getPlatformClientConfig, listPlatformClients } from './client-configs';
import { getContentPackForClient } from './content-packs';
import { listDomainsForSlug } from './domain-map';
import type { WorkspaceShell } from '@ea/workspace-engine';

export type ReproduceSurfaces = {
  clientId: string;
  clientName: string;
  workspaceName: string;
  contentPack: { id: string; label: string; vertical: string; summary: string } | null;
  domains: Array<{ host: string; surface: string; label?: string }>;
  portal: WorkspaceShell | null;
  landing: AssembledClientWebsite | null;
  urls: {
    workspacePreview: string;
    reproducePreview: string;
    publicSite: string;
    websiteApi: string;
    workspaceApi: string;
    domainsApi: string;
  };
};

export function assembleReproduceSurfaces(clientId: string): ReproduceSurfaces | null {
  const client = getPlatformClientConfig(clientId);
  if (!client) return null;

  const portal = assembleWorkspaceForClient(clientId);
  const landing = assembleWebsiteForClient(clientId);
  const pack = getContentPackForClient(clientId);
  const domains = listDomainsForSlug(clientId).map((b) => ({
    host: b.host,
    surface: b.surface,
    label: b.label,
  }));

  return {
    clientId: client.id,
    clientName: client.name,
    workspaceName: client.workspaceName,
    contentPack: pack
      ? { id: pack.id, label: pack.label, vertical: pack.vertical, summary: pack.summary }
      : null,
    domains,
    portal,
    landing,
    urls: {
      workspacePreview: `/admin/workspace-preview?client=${encodeURIComponent(client.id)}`,
      reproducePreview: `/admin/reproduce-preview?client=${encodeURIComponent(client.id)}`,
      publicSite: `/site/${encodeURIComponent(client.id)}`,
      websiteApi: `/api/platform/website?view=client&client=${encodeURIComponent(client.id)}`,
      workspaceApi: `/api/platform/workspace?client=${encodeURIComponent(client.id)}`,
      domainsApi: `/api/platform/domains?slug=${encodeURIComponent(client.id)}`,
    },
  };
}

export function listReproduceClientOptions() {
  return listPlatformClients().map((c) => ({
    id: c.id,
    name: c.name,
    workspaceName: c.workspaceName,
    hasLandingCopy: Boolean(c.landing?.heroHeadline),
  }));
}

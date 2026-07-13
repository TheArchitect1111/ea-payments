import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import {
  getCapabilityFrameworkHealth,
  getPlatformMarketplaceEntries,
  listPlatformCapabilities,
} from '@/lib/platform/capability-bootstrap';
import {
  assembleClientApplication,
  listPlatformClients,
} from '@/lib/platform/client-configs';
import {
  assembleWebsiteForClient,
  getWebsiteEngineSummary,
  listUnifiedWebsiteSections,
} from '@/lib/platform/website-bridge';
import { listWorkspaceShellSummaries } from '@/lib/platform/workspace-bridge';
import {
  getPaymentsContractHealth,
  listCommerceOffers,
  resolveCheckoutOffer,
} from '@/lib/platform/payments-bridge';
import { getPlatformCprReadiness } from '@/lib/platform/cpr-readiness';
import { getPlatformFoundationStatus } from '@/lib/platform/foundation-status';
import AdminLogin from '../master/AdminLogin';
import CapabilityMarketplaceClient from './CapabilityMarketplaceClient';

export const dynamic = 'force-dynamic';

export default async function CapabilityMarketplacePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;

  if (!verifyAdminSession(token)) {
    return <AdminLogin />;
  }

  const marketplace = getPlatformMarketplaceEntries();
  const health = getCapabilityFrameworkHealth();
  const catalog = listPlatformCapabilities().map((c) => ({
    id: c.id,
    name: c.name,
    status: c.status,
    version: c.version,
    category: c.category,
    moduleId: c.moduleId ?? null,
    enableKey: c.enableKey ?? null,
    certified: c.certified,
    consumers: c.consumers,
    dependencies: c.dependencies,
    reusable: c.reusable,
    recommendedPriority: c.recommendedPriority ?? null,
    description: c.description,
    purpose: c.purpose,
    riskLevel: c.riskLevel ?? null,
    extractionEffort: c.extractionEffort ?? null,
  }));

  const websiteSummary = getWebsiteEngineSummary();
  const websiteSections = listUnifiedWebsiteSections().map((s) => ({
    id: s.id,
    kind: s.kind,
    name: s.name,
    description: s.description,
    source: s.source,
    landingKey: s.landingKey ?? null,
    blockId: s.blockId ?? null,
    category: s.category ?? null,
  }));
  const websiteDemoAssembled = assembleWebsiteForClient('ea');
  const websiteDemo = websiteDemoAssembled
    ? {
        page: websiteDemoAssembled.assembly.page,
        missingSectionIds: websiteDemoAssembled.missingSectionIds,
        resolved: websiteDemoAssembled.assembly.resolved,
      }
    : {
        page: { id: 'ea-home', name: 'EA Home' },
        missingSectionIds: [] as string[],
        resolved: [] as Array<{
          instance: { sectionId: string; kind: string; order: number };
          definition?: { name?: string; source?: string };
        }>,
      };

  const clients = listPlatformClients().map((client) => {
    const app = assembleClientApplication(client.id);
    return {
      ...client,
      capabilityIds: app?.capabilityIds ?? [],
      plannedCapabilityIds: app?.plannedCapabilityIds ?? [],
      personalityName: app?.personality.name ?? client.personalityId,
      themeName: app?.theme.name ?? client.themeId,
      missingCapabilityIds: app?.surface.missingCapabilityIds ?? [],
      navCount: app?.surface.navigation.length ?? 0,
      widgetCount: app?.surface.widgets.length ?? 0,
    };
  });

  const workspaceSummaries = listWorkspaceShellSummaries();

  const paymentsHealth = getPaymentsContractHealth();
  const cprReadiness = getPlatformCprReadiness();
  const foundationStatus = getPlatformFoundationStatus();
  const paymentOffers = listCommerceOffers().map((offer) => {
    const resolved = resolveCheckoutOffer(offer.id);
    return {
      id: offer.id,
      kind: offer.kind,
      displayName: offer.displayName,
      airtablePackageName: offer.airtablePackageName,
      priceCents: offer.priceCents,
      interval: offer.interval ?? null,
      moduleCount: resolved?.moduleIds.length ?? offer.moduleIds.length,
      capabilityCount: resolved?.capabilityIds.length ?? 0,
      includesBilling: offer.moduleIds.includes('billing'),
      includesConnect: offer.moduleIds.includes('connect'),
      stripePriceEnvKey: offer.stripePriceEnvKey,
    };
  });

  const orgPresets = listPlatformClients().map((client) => ({
    id: client.id,
    label: client.name,
    organizationId: client.organizationId,
  }));

  return (
    <CapabilityMarketplaceClient
      marketplace={marketplace}
      catalog={catalog}
      health={health}
      clients={clients}
      websiteSummary={websiteSummary}
      websiteSections={websiteSections}
      orgPresets={orgPresets}
      workspaceSummaries={workspaceSummaries}
      paymentsHealth={paymentsHealth}
      paymentOffers={paymentOffers}
      cprReadiness={cprReadiness}
      foundationStatus={foundationStatus}
      websiteDemo={{
        pageId: websiteDemo.page.id,
        pageName: websiteDemo.page.name,
        missingSectionIds: websiteDemo.missingSectionIds,
        sections: websiteDemo.resolved.map((r) => ({
          sectionId: r.instance.sectionId,
          kind: r.instance.kind,
          order: r.instance.order,
          name: r.definition?.name ?? r.instance.sectionId,
          source: r.definition?.source ?? 'shared',
        })),
      }}
    />
  );
}

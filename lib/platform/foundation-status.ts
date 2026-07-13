/**
 * Platform foundation status - aggregate health across capability, payments, CPR readiness, packages.
 */
import { getCapabilityFrameworkHealth } from './capability-bootstrap';
import { getPaymentsContractHealth } from './payments-bridge';
import { getPlatformCprReadiness } from './cpr-readiness';
import { listPlatformClients } from './client-configs';
import { getWebsiteEngineSummary } from './website-bridge';
import { listWorkspaceShellSummaries } from './workspace-bridge';
import { getPackageSyncHealth } from './package-sync-health';

export type FoundationPackageId =
  | 'capability-registry'
  | 'module-engine'
  | 'theme-engine'
  | 'personality-engine'
  | 'website-engine'
  | 'workspace-engine'
  | 'payments-contract';

const FOUNDATION_PACKAGES: FoundationPackageId[] = [
  'capability-registry',
  'module-engine',
  'theme-engine',
  'personality-engine',
  'website-engine',
  'workspace-engine',
  'payments-contract',
];

export function getPlatformFoundationStatus() {
  const capabilities = getCapabilityFrameworkHealth();
  const payments = getPaymentsContractHealth();
  const cpr = getPlatformCprReadiness();
  const website = getWebsiteEngineSummary();
  const workspaceSummaries = listWorkspaceShellSummaries();
  const clients = listPlatformClients();
  const packageSync = getPackageSyncHealth();

  const slices = [
    {
      id: 'package-sync',
      label: 'Package sync',
      ok: packageSync.ok,
      detail: packageSync.drifted.length
        ? `${packageSync.drifted.length} drifted · ${packageSync.syncHint}`
        : packageSync.missing.length
          ? `${packageSync.missing.length} missing · ${packageSync.syncHint}`
          : `${packageSync.presentCount}/${packageSync.packageCount} vendor packages OK`,
      href: '/admin/capability-marketplace?tab=foundation',
    },
    {
      id: 'capabilities',
      label: 'Capability framework',
      ok: capabilities.ok,
      detail: `${capabilities.registryCount} registry / ${capabilities.moduleCount} modules`,
      href: '/admin/capability-marketplace',
    },
    {
      id: 'payments',
      label: 'Payments contract',
      ok: payments.ok,
      detail: `${payments.offerCount} offers (${payments.oneTimeCount} one-time / ${payments.subscriptionCount} sub)`,
      href: '/admin/capability-marketplace?tab=payments',
    },
    {
      id: 'cpr-readiness',
      label: 'CPR readiness',
      ok: cpr.ok,
      detail: `${cpr.mapped.length} hub modules mapped | migration ${cpr.migrationStatus}`,
      href: '/admin/capability-marketplace?tab=cpr-readiness',
    },
    {
      id: 'website',
      label: 'Website engine',
      ok: website.totalSections > 0,
      detail: `${website.totalSections} sections`,
      href: '/admin/capability-marketplace?tab=website',
    },
    {
      id: 'workspace',
      label: 'Workspace shells',
      ok: workspaceSummaries.length > 0,
      detail: `${workspaceSummaries.length} client shells | ${clients.length} configs`,
      href: '/admin/workspace-preview',
    },
  ];

  const ok = slices.every((s) => s.ok);

  return {
    ok,
    generatedAt: new Date().toISOString(),
    packages: FOUNDATION_PACKAGES,
    slices,
    packageSync,
    capabilities: {
      ok: capabilities.ok,
      registryCount: capabilities.registryCount,
      moduleCount: capabilities.moduleCount,
      cprHubMapped: capabilities.cprHubMapped,
      unmappedModules: capabilities.unmappedModules,
      cprHubUnmapped: capabilities.cprHubUnmapped,
    },
    payments: {
      ok: payments.ok,
      offerCount: payments.offerCount,
      oneTimeCount: payments.oneTimeCount,
      subscriptionCount: payments.subscriptionCount,
      errors: payments.errors,
    },
    cpr: {
      ok: cpr.ok,
      mapped: cpr.mapped.length,
      unmapped: cpr.unmapped,
      migrationStatus: cpr.migrationStatus,
      cprTenantManifests: cpr.cprTenant.manifestCount,
      familyHubManifests: cpr.familyHub.manifestCount,
    },
    website,
    workspaceShellCount: workspaceSummaries.length,
    clientConfigCount: clients.length,
  };
}

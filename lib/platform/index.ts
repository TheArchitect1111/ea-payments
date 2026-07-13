export {
  getPlatformCapabilityRegistry,
  resetPlatformCapabilityRegistry,
  listPlatformCapabilities,
  getPlatformMarketplaceEntries,
  assembleSurfaceForModuleIds,
  assembleSurfaceForCapabilityIds,
  mapModuleIdsToCapabilityIds,
  getDependencyGapsForModules,
  getCapabilityFrameworkHealth,
} from './capability-bootstrap';

export {
  PLATFORM_CLIENT_CONFIGS,
  listPlatformClients,
  getPlatformClientConfig,
  assembleClientApplication,
} from './client-configs';
export type { PlatformClientConfig, AssembledClientApplication } from './client-configs';

export {
  getWebsiteSectionRegistry,
  listUnifiedWebsiteSections,
  listWebsiteSectionsBySource,
  assembleLandingTemplate,
  assembleCustomWebsitePage,
  getWebsiteEngineSummary,
} from './website-bridge';

export {
  assembleWorkspaceForClient,
  assembleWorkspaceFromPlatformClient,
  resolvePlatformClientIdForPortal,
  resolveWorkspaceConfigFromOrg,
  resolveWorkspaceShellForPortal,
  parseOrganizationBrandColors,
  listWorkspaceShellSummaries,
} from './workspace-bridge';
export type { WorkspaceShell, PortalWorkspaceOverrides } from './workspace-bridge';

export { resolvePortalWorkspaceChrome } from './portal-workspace';
export type { PortalWorkspaceChrome, PortalWorkspaceWidget } from './portal-workspace';

export {
  COMMERCE_OFFERS,
  getCommerceOffer,
  listCommerceOffers,
  listEntitlementSnapshots,
  listPurchasableCheckoutOffers,
  offerDisplayForCheckout,
  resolveCapabilityEntitlements,
  resolveCheckoutOffer,
  resolvePortalModuleEntitlements,
  buildCommerceCheckoutMetadata,
  isCheckoutOfferPurchasable,
  packageIncludesBilling,
  packageIncludesConnect,
  toEntitlementSnapshot,
  validateOffersIntegrity,
  getPaymentsContractHealth,
} from './payments-bridge';
export type {
  CommerceOffer,
  CommerceOfferId,
  CommerceOfferKind,
  EntitlementSnapshot,
  ResolvedCheckoutOffer,
} from './payments-bridge';

export {
  getPlatformCprReadiness,
  CPR_HUB_MODULE_IDS,
  CPR_TENANT_HUB_MODULE_IDS,
  FAMILY_HUB_MODULE_IDS,
  adaptCprHubModules,
  discoverFromCprHubModules,
} from './cpr-readiness';

export { getPlatformFoundationStatus } from './foundation-status';
export type { FoundationPackageId } from './foundation-status';

export {
  getPackageSyncHealth,
  PLATFORM_VENDOR_PACKAGES,
  CHASSIS_VENDOR_PACKAGES,
} from './package-sync-health';
export type { PackageSyncRow, VendorPackageName } from './package-sync-health';

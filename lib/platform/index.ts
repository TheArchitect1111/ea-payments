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
export type { PlatformClientConfig, PlatformClientLandingConfig, AssembledClientApplication } from './client-configs';

export {
  reproduceClientFromPreset,
  enableKeysToHubModuleIds,
  listClientFactoryPresets,
} from './client-factory';
export type {
  ClientFactoryInput,
  ClientFactoryResult,
  ClientFactoryError,
} from './client-factory';

export { applyPortalCopy } from './portal-copy';

export {
  assembleReproduceSurfaces,
  listReproduceClientOptions,
} from './reproduce';
export type { ReproduceSurfaces } from './reproduce';

export {
  buildLandingPageConfigForClient,
  resolvePublicSiteBySlug,
  publicSitePathForSlug,
  publicSitePathForClient,
  listPublicSiteClients,
} from './landing-from-client';
export type { LandingSiteOverrides, ResolvedPublicSite } from './landing-from-client';

export {
  listContentPacks,
  listContentPackSummaries,
  getContentPackForClient,
  getContentPackById,
  cprAthleticsContentPack,
  eaPlatformContentPack,
  etfmCoachingContentPack,
  threeHcReadinessContentPack,
  bobRumballLearningContentPack,
} from './content-packs';

export {
  listClientDomainBindings,
  getClientDomainBinding,
  listDomainsForSlug,
  resolveClientDomainEntry,
  getClientDomainMapHealth,
  CLIENT_DOMAIN_BINDINGS,
} from './domain-map';
export type { ClientDomainBinding, ClientDomainSurface } from './domain-map';

export {
  getWebsiteSectionRegistry,
  listUnifiedWebsiteSections,
  listWebsiteSectionsBySource,
  assembleLandingTemplate,
  assembleCustomWebsitePage,
  assembleWebsiteForClient,
  buildClientLandingManifest,
  getWebsiteEngineSummary,
} from './website-bridge';
export type { AssembledClientWebsite, LandingPreviewCopy } from './website-bridge';

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

export {
  CPR_SITE_URL,
  CPR_SITE_URL_ALT,
  CPR_FAMILY_LOGIN_URL,
  CPR_STAFF_LOGIN_URL,
  CPR_QUARANTINED_EA_PATHS,
} from './cpr-canonical';

export { resolveAdminWorkspaceChrome } from './admin-workspace-chrome';

export { getPlatformFoundationStatus } from './foundation-status';
export type { FoundationPackageId } from './foundation-status';

export {
  getPackageSyncHealth,
  PLATFORM_VENDOR_PACKAGES,
  CHASSIS_VENDOR_PACKAGES,
} from './package-sync-health';
export type { PackageSyncRow, VendorPackageName } from './package-sync-health';

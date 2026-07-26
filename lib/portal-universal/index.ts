/**
 * EA Universal Portal Phase 1 — IndustryPack + universal capability nav.
 * @see docs/plans/EA-UNIVERSAL-PORTAL-PHASE-1-BLUEPRINT.md
 */
export {
  UNIVERSAL_CAPABILITY_IDS,
  UNIVERSAL_TO_MODULES,
  isUniversalCapabilityId,
  type UniversalCapabilityId,
} from '@/lib/portal-universal/capability-ids';
export type {
  IndustryPack,
  IndustryPackId,
  IndustryNavItem,
  IndustryPackBranding,
  IndustryPackExtensions,
  ResolvedNavItem,
  PortalPresentationMode,
} from '@/lib/portal-universal/industry-pack';
export { isUniversalNavPacksEnabled } from '@/lib/portal-universal/flags';
export {
  validateIndustryPack,
  assertValidIndustryPack,
  type ValidateIndustryPackResult,
} from '@/lib/portal-universal/validate-pack';
export { migrateIndustryPack } from '@/lib/portal-universal/migrations';
export {
  resolveIndustryNav,
  resolvedNavToSidebarGroups,
} from '@/lib/portal-universal/resolve-nav';
export { resolvePackForOrg } from '@/lib/portal-universal/resolve-pack-for-org';
export { applyPackBrandingToChrome } from '@/lib/portal-universal/apply-branding';
export {
  INDUSTRY_PACK_REGISTRY,
  DEFAULT_INDUSTRY_PACK_ID,
  listIndustryPacks,
  getIndustryPack,
  requireIndustryPack,
} from '@/lib/portal-universal/packs';

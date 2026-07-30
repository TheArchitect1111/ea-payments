/**
 * Universal Experience Generator public surface helpers.
 */
export {
  buildStructuredEvidenceModel,
  claimsForSection,
  detectOrgAttributedToSubject,
  WEBSITE_SECTION_BRIEFS,
  PORTAL_SECTION_BRIEFS,
  type StructuredEvidenceModel,
  type EvidenceClaim,
  type SectionBrief,
} from '@/lib/uxg/evidence-model';
export {
  evaluatePublicCopyQuality,
  repairPublicCopyBundle,
  enforcePublicCopyQuality,
  type PublicCopyBundle,
  type CopyQualityResult,
} from '@/lib/uxg/copy-quality';
export {
  buildPublicCopyBundle,
  applyRepairedPuckData,
  applyRepairedPortalShell,
} from '@/lib/uxg/collect-public-copy';
export { buildLensCopyFromEvidence } from '@/lib/uxg/lens-copy-from-evidence';

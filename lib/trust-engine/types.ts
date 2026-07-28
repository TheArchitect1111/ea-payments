/**
 * Trust Engine — Legal Document Pack types.
 * Legal entity: Ascension Systems. Product brands inherit packs via configuration.
 */

export type TrustLegalEntityId = 'ascension_systems';

export type TrustProductId =
  | 'efficiency_architects'
  | 'simplifi'
  | 'amplifi'
  | 'magnifi'
  | 'fortifi'
  | 'unifi'
  | 'pulse'
  | 'executive_portals'
  | 'portal_products';

export type TrustLegalDocType =
  | 'tos'
  | 'privacy'
  | 'eula'
  | 'ai_disclosure'
  | 'support'
  | 'cookie'
  | 'msa'
  | 'sow';

export type TrustLegalDocStatus = 'draft' | 'active' | 'superseded' | 'retired';

export type TrustLegalDocument = {
  docType: TrustLegalDocType;
  version: string;
  title: string;
  /** Path under docs/legal/ */
  sourcePath: string;
  /** Public route */
  href: string;
  effectiveDate: string;
  lastUpdated: string;
  status: TrustLegalDocStatus;
  /** Products that may include this doc (empty = platform-wide eligible). */
  applicableProducts: TrustProductId[] | 'all';
  optional?: boolean;
  requiresEsign?: boolean;
  esignTemplateEnvKey?: string;
};

export type TrustProductLegalPack = {
  productId: TrustProductId;
  label: string;
  /** Required acknowledgements for onboarding / app install. */
  requiredDocTypes: TrustLegalDocType[];
  /** Optional docs shown when relevant. */
  optionalDocTypes?: TrustLegalDocType[];
};

export type LegalAcceptanceRecord = {
  userId: string;
  productId: TrustProductId;
  docType: TrustLegalDocType;
  version: string;
  acceptedAt: string;
  href: string;
};

/** Display status on client Legal Status dashboard. */
export type LegalDocDisplayStatus =
  | 'current'
  | 'update_required'
  | 'pending'
  | 'signed';

export type ClientLegalDocRow = {
  docType: TrustLegalDocType;
  title: string;
  href: string;
  currentVersion: string;
  acceptedVersion: string | null;
  acceptanceDate: string | null;
  status: LegalDocDisplayStatus;
  requiresEsign?: boolean;
};

export type ClientLegalProfile = {
  clientId: string;
  userId: string;
  organizationId: string;
  organizationName: string;
  email: string;
  displayName: string;
  productId: TrustProductId;
  /** Append-only acceptance events — never overwritten. */
  acceptanceHistory: LegalAcceptanceRecord[];
  /** Latest accepted version per doc type (derived; history remains source of truth). */
  latestByDoc: Partial<Record<TrustLegalDocType, LegalAcceptanceRecord>>;
  msaStatus: 'pending' | 'sent' | 'signed';
  sowStatus: 'pending' | 'generated' | 'signed';
  msaSignedAt?: string;
  sowSignedAt?: string;
  requiresReacceptance: boolean;
  updatedAt: string;
};

export type LegalAuditEventType =
  | 'acceptance'
  | 'reacceptance'
  | 'version_upgrade'
  | 'msa_sent'
  | 'msa_signed'
  | 'sow_generated'
  | 'sow_signed'
  | 'reacceptance_required'
  | 'support_updated';

export type LegalAuditEvent = {
  id: string;
  at: string;
  type: LegalAuditEventType;
  userId: string;
  email?: string;
  organizationId: string;
  organizationName?: string;
  docType?: TrustLegalDocType;
  version?: string;
  productId?: TrustProductId;
  ipAddress?: string;
  summary: string;
  metadata?: Record<string, string | number | boolean>;
};

export type UpcomingLegalRelease = {
  docType: TrustLegalDocType;
  title: string;
  fromVersion: string;
  toVersion: string;
  plannedEffectiveDate: string;
  notes?: string;
};

export type LegalExecutiveMetrics = {
  totalClients: number;
  privacyAcceptedPct: number;
  termsAcceptedPct: number;
  aiDisclosureAcceptedPct: number;
  msaSignedPct: number;
  sowSignedPct: number;
  documentsRequiringReacceptance: number;
};

export type LegalJourneyMilestoneId =
  | 'questionnaire'
  | 'opportunity_review'
  | 'proposal'
  | 'msa_signed'
  | 'sow_signed'
  | 'payment'
  | 'design'
  | 'development'
  | 'launch';

export type LegalJourneyMilestone = {
  id: LegalJourneyMilestoneId;
  label: string;
  complete: boolean;
  completedAt?: string;
  legalLinked?: boolean;
};

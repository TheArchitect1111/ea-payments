/**
 * Legal Document Pack registry — versioned platform assets for all EA products.
 */
import type {
  TrustLegalDocType,
  TrustLegalDocument,
  TrustProductId,
  TrustProductLegalPack,
} from './types';

export const TRUST_LEGAL_ENTITY = {
  id: 'ascension_systems' as const,
  legalName: 'Ascension Systems',
  doingBusinessAs: [
    'Efficiency Architects',
    'Simplifi',
    'Simplifi Orb',
    'Amplifi',
    'Magnifi',
    'Fortifi',
    'Unifi',
    'Pulse',
  ],
  address: '1848 Olsen Lane, Charlotte, NC 28213',
  email: 'freedom@efficiencyarchitects.online',
  governingLaw: 'North Carolina',
};

const ALL: TrustProductId[] | 'all' = 'all';

/** Canonical Legal Pack — MSA/SOW included once; do not fork per product. */
export const LEGAL_DOCUMENT_PACK: TrustLegalDocument[] = [
  {
    docType: 'privacy',
    version: '1.0',
    title: 'Privacy Policy',
    sourcePath: 'docs/legal/privacy-v1.0.md',
    href: '/legal/privacy',
    effectiveDate: '2026-07-21',
    lastUpdated: '2026-07-21',
    status: 'active',
    applicableProducts: ALL,
  },
  {
    docType: 'tos',
    version: '1.0',
    title: 'Terms of Service',
    sourcePath: 'docs/legal/terms-v1.0.md',
    href: '/legal/terms',
    effectiveDate: '2026-07-21',
    lastUpdated: '2026-07-21',
    status: 'active',
    applicableProducts: ALL,
  },
  {
    docType: 'eula',
    version: '1.0',
    title: 'Mobile App End User License Agreement',
    sourcePath: 'docs/legal/eula-v1.0.md',
    href: '/legal/eula',
    effectiveDate: '2026-07-21',
    lastUpdated: '2026-07-21',
    status: 'active',
    applicableProducts: ['simplifi', 'amplifi', 'magnifi', 'fortifi', 'unifi'],
  },
  {
    docType: 'ai_disclosure',
    version: '1.0',
    title: 'AI Disclosure',
    sourcePath: 'docs/legal/ai-disclosure-v1.0.md',
    href: '/legal/ai-disclosure',
    effectiveDate: '2026-07-21',
    lastUpdated: '2026-07-21',
    status: 'active',
    applicableProducts: ALL,
  },
  {
    docType: 'support',
    version: '1.0',
    title: 'Support Policy',
    sourcePath: 'docs/legal/support-policy-v1.0.md',
    href: '/legal/support',
    effectiveDate: '2026-07-21',
    lastUpdated: '2026-07-21',
    status: 'active',
    applicableProducts: ALL,
  },
  {
    docType: 'cookie',
    version: '1.0',
    title: 'Cookie Policy',
    sourcePath: 'docs/legal/cookie-policy-v1.0.md',
    href: '/legal/cookies',
    effectiveDate: '2026-07-21',
    lastUpdated: '2026-07-21',
    status: 'active',
    applicableProducts: ALL,
    optional: true,
  },
  {
    docType: 'msa',
    version: '1.0',
    title: 'Master Services Agreement',
    sourcePath: 'docs/legal/msa-v1.0.md',
    href: '/legal/msa',
    effectiveDate: '2026-07-21',
    lastUpdated: '2026-07-21',
    status: 'active',
    applicableProducts: [
      'efficiency_architects',
      'portal_products',
      'executive_portals',
      'fortifi',
      'unifi',
    ],
    requiresEsign: true,
    esignTemplateEnvKey: 'ESIGNATURES_MSA_TEMPLATE_ID',
  },
  {
    docType: 'sow',
    version: '1.0',
    title: 'Statement of Work',
    sourcePath: 'docs/legal/sow-template-v1.0.md',
    href: '/legal/sow',
    effectiveDate: '2026-07-21',
    lastUpdated: '2026-07-21',
    status: 'active',
    applicableProducts: [
      'efficiency_architects',
      'portal_products',
      'executive_portals',
      'fortifi',
      'unifi',
    ],
    requiresEsign: true,
    esignTemplateEnvKey: 'ESIGNATURES_SOW_TEMPLATE_ID',
  },
];

/** Product → required legal documents. Future products only declare a pack. */
export const PRODUCT_LEGAL_PACKS: TrustProductLegalPack[] = [
  {
    productId: 'simplifi',
    label: 'Simplifi / Simplifi Orb',
    requiredDocTypes: ['privacy', 'tos', 'eula', 'ai_disclosure', 'support'],
    optionalDocTypes: ['cookie'],
  },
  {
    productId: 'amplifi',
    label: 'Amplifi',
    requiredDocTypes: ['privacy', 'tos', 'ai_disclosure', 'support'],
    optionalDocTypes: ['cookie', 'eula'],
  },
  {
    productId: 'magnifi',
    label: 'Magnifi',
    requiredDocTypes: ['privacy', 'tos', 'ai_disclosure', 'support'],
    optionalDocTypes: ['cookie', 'eula'],
  },
  {
    productId: 'fortifi',
    label: 'Fortifi',
    requiredDocTypes: ['privacy', 'tos', 'ai_disclosure', 'support', 'msa'],
    optionalDocTypes: ['cookie', 'eula', 'sow'],
  },
  {
    productId: 'unifi',
    label: 'Unifi',
    requiredDocTypes: ['privacy', 'tos', 'ai_disclosure', 'support', 'msa'],
    optionalDocTypes: ['cookie', 'eula', 'sow'],
  },
  {
    productId: 'pulse',
    label: 'Pulse',
    requiredDocTypes: ['privacy', 'tos', 'ai_disclosure', 'support'],
    optionalDocTypes: ['cookie'],
  },
  {
    productId: 'executive_portals',
    label: 'Executive Portals',
    requiredDocTypes: ['privacy', 'tos', 'msa', 'sow', 'support'],
    optionalDocTypes: ['ai_disclosure', 'cookie'],
  },
  {
    productId: 'portal_products',
    label: 'Portal Products (Website + Guided Project Experience)',
    requiredDocTypes: ['privacy', 'tos', 'msa', 'sow', 'support'],
    optionalDocTypes: ['ai_disclosure', 'cookie'],
  },
  {
    productId: 'efficiency_architects',
    label: 'Efficiency Architects Platform',
    requiredDocTypes: ['privacy', 'tos', 'ai_disclosure', 'support'],
    optionalDocTypes: ['cookie', 'msa', 'sow'],
  },
];

export function getLegalDocument(docType: TrustLegalDocType): TrustLegalDocument | undefined {
  return LEGAL_DOCUMENT_PACK.find((d) => d.docType === docType && d.status === 'active');
}

export function getLegalDocumentByHref(href: string): TrustLegalDocument | undefined {
  const clean = href.replace(/\/$/, '') || href;
  return LEGAL_DOCUMENT_PACK.find((d) => d.href === clean && d.status === 'active');
}

export function getProductLegalPack(productId: TrustProductId): TrustProductLegalPack | undefined {
  return PRODUCT_LEGAL_PACKS.find((p) => p.productId === productId);
}

/** Active documents required for a product (full pack, including eSign). */
export function resolveRequiredLegalDocs(productId: TrustProductId): TrustLegalDocument[] {
  const pack = getProductLegalPack(productId);
  if (!pack) return [];
  return pack.requiredDocTypes
    .map((t) => getLegalDocument(t))
    .filter((d): d is TrustLegalDocument => Boolean(d));
}

/**
 * Checkbox onboarding acknowledgements — excludes MSA/SOW (eSign flow).
 * Future products inherit this automatically from PRODUCT_LEGAL_PACKS.
 */
export function resolveOnboardingAcceptanceDocs(
  productId: TrustProductId
): TrustLegalDocument[] {
  return resolveRequiredLegalDocs(productId).filter((d) => !d.requiresEsign);
}

export function listActiveLegalDocuments(): TrustLegalDocument[] {
  return LEGAL_DOCUMENT_PACK.filter((d) => d.status === 'active');
}

/** Google Play / public privacy URL for Simplifi. */
export const SIMPLIFI_PRIVACY_POLICY_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
    ? `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')}/legal/privacy`
    : 'https://efficiencyarchitects.online/legal/privacy';

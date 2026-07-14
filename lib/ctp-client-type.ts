/**
 * Classify CTP submissions into acquisition/delivery tracks.
 * Drives later phases (BI vs digital audit vs website/portal auto-provision).
 */
import type { ProjectType } from '@/lib/analysis-engine';

export const CTP_CLIENT_TYPES = [
  'business_transformation',
  'website',
  'website_portal',
  'portal_only',
  'other',
] as const;

export type CtpClientType = (typeof CTP_CLIENT_TYPES)[number];

export const CTP_CLIENT_TYPE_LABELS: Record<CtpClientType, string> = {
  business_transformation: 'Business Transformation',
  website: 'Website',
  website_portal: 'Website + Portal',
  portal_only: 'Portal Only',
  other: 'Other Future Products',
};

export type CtpClientTypeClassification = {
  clientType: CtpClientType;
  label: string;
  confidence: number;
  reasons: string[];
  /** Portal workspace should be provisioned for this track. */
  portalRequired: boolean;
  /** Public starter website should be considered for this track. */
  websiteRequired: boolean;
  /** Run business intelligence / capacity executive snapshot. */
  businessIntelligence: boolean;
  /** Run digital presence audit when URLs exist. */
  digitalAudit: boolean;
};

export type ClassifyCtpClientTypeInput = {
  desiredExperiences?: string[] | null;
  discoveryAnswers?: Record<string, unknown> | null;
  operationalChallenges?: string[] | null;
  recommendedProjectType?: ProjectType | string | null;
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function hasWebsiteSignal(answers: Record<string, unknown> | null | undefined): boolean {
  if (!answers) return false;
  const keys = ['current_website', 'website_url', 'existing_website', 'public_presence', 'reference_links'];
  for (const key of keys) {
    const raw = answers[key];
    if (typeof raw === 'string' && /https?:\/\/|www\.|\.com|\.org|\.net/i.test(raw)) return true;
    if (Array.isArray(raw) && raw.some((item) => /https?:\/\/|www\./i.test(String(item)))) return true;
  }
  return false;
}

function trackFlags(clientType: CtpClientType): Pick<
  CtpClientTypeClassification,
  'portalRequired' | 'websiteRequired' | 'businessIntelligence' | 'digitalAudit'
> {
  switch (clientType) {
    case 'website_portal':
      return {
        portalRequired: true,
        websiteRequired: true,
        businessIntelligence: false,
        digitalAudit: true,
      };
    case 'website':
      return {
        portalRequired: false,
        websiteRequired: true,
        businessIntelligence: false,
        digitalAudit: true,
      };
    case 'portal_only':
      return {
        portalRequired: true,
        websiteRequired: false,
        businessIntelligence: false,
        digitalAudit: false,
      };
    case 'business_transformation':
      return {
        portalRequired: true,
        websiteRequired: false,
        businessIntelligence: true,
        digitalAudit: true,
      };
    default:
      return {
        portalRequired: false,
        websiteRequired: false,
        businessIntelligence: true,
        digitalAudit: false,
      };
  }
}

/**
 * Deterministic classifier from discovery answers + assessment signals.
 * Prefer explicit desired experiences; fall back to operational project type.
 */
export function classifyCtpClientType(input: ClassifyCtpClientTypeInput): CtpClientTypeClassification {
  const desired = new Set(
    (input.desiredExperiences ?? []).map((item) => String(item).trim().toLowerCase()).filter(Boolean),
  );
  const challenges = input.operationalChallenges ?? [];
  const projectType = String(input.recommendedProjectType ?? '');
  const websiteSignal = hasWebsiteSignal(input.discoveryAnswers ?? undefined);
  const reasons: string[] = [];

  const wantsLanding = desired.has('landing-page');
  const wantsPortal = desired.has('portal');
  const wantsOps =
    desired.has('operations') ||
    desired.has('automation') ||
    desired.has('communication') ||
    challenges.length >= 4;
  const heavyTransform =
    projectType === 'business_transformation' || projectType === 'enterprise_solution';

  let clientType: CtpClientType;
  let confidence = 0.7;

  if (wantsLanding && wantsPortal) {
    clientType = 'website_portal';
    confidence = 0.92;
    reasons.push('Selected both landing page and portal experiences');
  } else if (wantsPortal && !wantsLanding) {
    clientType = 'portal_only';
    confidence = 0.88;
    reasons.push('Selected portal without landing page');
  } else if (wantsLanding && !wantsPortal) {
    clientType = 'website';
    confidence = 0.88;
    reasons.push('Selected landing page without portal');
  } else if (heavyTransform || (wantsOps && !wantsLanding && !wantsPortal)) {
    clientType = 'business_transformation';
    confidence = heavyTransform ? 0.85 : 0.72;
    reasons.push(
      heavyTransform
        ? `Assessment project type is ${projectType}`
        : 'Operational / automation focus without explicit website or portal selection',
    );
  } else if (websiteSignal && wantsPortal) {
    clientType = 'website_portal';
    confidence = 0.7;
    reasons.push('Existing website signal plus portal interest');
  } else if (websiteSignal) {
    clientType = 'website';
    confidence = 0.65;
    reasons.push('Existing website / public presence signal without clear portal ask');
  } else if (desired.size > 0) {
    clientType = 'other';
    confidence = 0.6;
    reasons.push(`Desired experiences: ${[...desired].join(', ')}`);
  } else {
    clientType = 'business_transformation';
    confidence = 0.55;
    reasons.push('Defaulted to business transformation when experience intent was unclear');
  }

  if (websiteSignal && (clientType === 'website' || clientType === 'website_portal')) {
    reasons.push('Public web presence referenced in discovery answers');
  }

  const flags = trackFlags(clientType);
  return {
    clientType,
    label: CTP_CLIENT_TYPE_LABELS[clientType],
    confidence,
    reasons,
    ...flags,
  };
}

export function ctpClientTypeLabel(clientType?: CtpClientType | string | null): string {
  if (!clientType) return CTP_CLIENT_TYPE_LABELS.other;
  return CTP_CLIENT_TYPE_LABELS[clientType as CtpClientType] ?? String(clientType);
}

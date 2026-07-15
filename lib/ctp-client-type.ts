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
  const profile = answers.organizationProfile;
  if (profile && typeof profile === 'object') {
    const website = (profile as { website?: unknown }).website;
    if (typeof website === 'string' && website.trim().length > 3) return true;
  }
  return false;
}

/** Flatten CTP multi-select answer blocks (`{ selected: string[] }`) into text. */
function answerText(answers: Record<string, unknown> | null | undefined, key: string): string {
  if (!answers) return '';
  const raw = answers[key];
  if (typeof raw === 'string') return raw.toLowerCase();
  if (Array.isArray(raw)) return raw.map(String).join(' ').toLowerCase();
  if (raw && typeof raw === 'object') {
    const selected = asStringArray((raw as { selected?: unknown }).selected);
    const note = String((raw as { note?: unknown }).note ?? '');
    return `${selected.join(' ')} ${note}`.toLowerCase();
  }
  return '';
}

/**
 * Map CRA journey titles and free-text answers into canonical experience tokens.
 * Codex CTP sends titles like "Landing Page Experience™", not "landing-page".
 */
export function normalizeDesiredExperienceTokens(
  desiredExperiences?: string[] | null,
  discoveryAnswers?: Record<string, unknown> | null,
): Set<string> {
  const tokens = new Set<string>();
  const addFromText = (text: string) => {
    const t = text.toLowerCase();
    if (!t.trim()) return;
    if (/\blanding\b|\bwebsite\b|\bone[- ]?page\b|\bdigital front door\b|\bgoogle\b|\bsocial media\b/.test(t)) {
      tokens.add('landing-page');
    }
    if (/\bportal\b/.test(t)) tokens.add('portal');
    if (
      /\bfollow[- ]?up\b|\breach us\b|\bin person\b|\bqr\b|\bbook a call\b|\bstay in touch\b|\bea connect\b|\bconnect experience\b/.test(
        t,
      )
    ) {
      tokens.add('landing-page');
    }
    if (/\bautomation\b|\boperations\b|\bcapacity\b|\borganization discovery\b/.test(t)) {
      tokens.add('operations');
    }
    if (/\btraining\b|\blearning\b/.test(t)) tokens.add('training');
    if (/\bcommunication\b/.test(t)) tokens.add('communication');
  };

  for (const item of desiredExperiences ?? []) addFromText(String(item));

  const answers = discoveryAnswers ?? undefined;
  if (answers) {
    const journeyKey = String(answers.journeyKey ?? '').toLowerCase();
    if (journeyKey === 'landing' || journeyKey === 'connect') tokens.add('landing-page');
    if (journeyKey === 'organization') tokens.add('operations');
    if (journeyKey === 'training') tokens.add('training');

    addFromText(String(answers.primaryJourney ?? ''));
    addFromText(answerText(answers, 'presenceGoal'));
    addFromText(answerText(answers, 'connectionPath'));
    addFromText(answerText(answers, 'discoveryGoal'));
    addFromText(answerText(answers, 'impactAreas'));
  }

  return tokens;
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
        portalRequired: true,
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
  const desired = normalizeDesiredExperienceTokens(
    input.desiredExperiences,
    input.discoveryAnswers,
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

  // Presence intent wins over generic transform pricing labels from the assessment engine.
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
    reasons.push('Website / landing / follow-up presence intent from CTP answers');
  } else if (wantsOps && !wantsLanding && !wantsPortal) {
    clientType = 'business_transformation';
    confidence = heavyTransform ? 0.85 : 0.72;
    reasons.push(
      heavyTransform
        ? `Assessment project type is ${projectType}`
        : 'Operational / automation focus without explicit website or portal selection',
    );
  } else if (heavyTransform && !wantsLanding && !wantsPortal) {
    clientType = 'business_transformation';
    confidence = 0.8;
    reasons.push(`Assessment project type is ${projectType}`);
  } else if (websiteSignal && wantsPortal) {
    clientType = 'website_portal';
    confidence = 0.7;
    reasons.push('Existing website signal plus portal interest');
  } else if (websiteSignal) {
    clientType = 'website';
    confidence = 0.65;
    reasons.push('Existing website / public presence signal without clear portal ask');
  } else if (desired.has('training')) {
    clientType = 'other';
    confidence = 0.62;
    reasons.push('Training transformation intent');
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

/** Parse CRA strings like "$1,797 - $3,997" into numeric bounds. */
export function parseInvestmentRangeLabel(
  label: string | null | undefined,
): { low: number; high: number } | null {
  if (!label) return null;
  const nums = [...String(label).matchAll(/\$?\s*([\d,]+(?:\.\d+)?)/g)].map((m) =>
    Number(String(m[1]).replace(/,/g, '')),
  );
  if (nums.length < 2 || !Number.isFinite(nums[0]) || !Number.isFinite(nums[1])) return null;
  const low = Math.min(nums[0], nums[1]);
  const high = Math.max(nums[0], nums[1]);
  if (low <= 0 || high <= 0) return null;
  return { low, high };
}

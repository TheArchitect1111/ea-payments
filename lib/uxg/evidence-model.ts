/**
 * Universal Experience Generator — structured evidence model.
 * Subject-agnostic. Every public claim carries scope, confidence, and source.
 */

export type EvidenceScope = 'subject' | 'organization' | 'educational' | 'cta';

export type EvidenceKind =
  | 'identity'
  | 'role'
  | 'organization'
  | 'service'
  | 'geography'
  | 'history'
  | 'contact'
  | 'audience'
  | 'mission'
  | 'other';

export type EvidenceConfidence = 'verified' | 'inferred' | 'admin_clarification' | 'unknown';

export type EvidenceClaim = {
  id: string;
  text: string;
  kind: EvidenceKind;
  scope: EvidenceScope;
  confidence: EvidenceConfidence;
  sourceUrl?: string;
  sourceLabel?: string;
};

export type StructuredEvidenceModel = {
  schemaVersion: 1;
  subjectIdentity: string;
  verifiedRole?: string;
  verifiedOrganization?: string;
  organizationServices: EvidenceClaim[];
  geography: EvidenceClaim[];
  history: EvidenceClaim[];
  contactPaths: EvidenceClaim[];
  subjectFacts: EvidenceClaim[];
  organizationFacts: EvidenceClaim[];
  educationalFacts: EvidenceClaim[];
  allClaims: EvidenceClaim[];
};

export type SectionPurpose =
  | 'identity_introduction'
  | 'role_explanation'
  | 'organization_capabilities'
  | 'service_pathways'
  | 'journey_expectation'
  | 'geography_context'
  | 'public_invitation'
  | 'portal_orientation'
  | 'portal_tools'
  | 'portal_progress'
  | 'portal_communication'
  | 'portal_documents';

export type SectionBrief = {
  id: string;
  purpose: SectionPurpose;
  surface: 'website' | 'portal';
  /** Allowed evidence scopes for this section. */
  allowedScopes: EvidenceScope[];
  /** Human-readable intent — internal only, never public copy. */
  intent: string;
};

/** Website section purposes — public story + next step. */
export const WEBSITE_SECTION_BRIEFS: SectionBrief[] = [
  {
    id: 'hero',
    purpose: 'public_invitation',
    surface: 'website',
    allowedScopes: ['subject', 'organization', 'cta'],
    intent: 'Name the subject and invite one clear next conversation.',
  },
  {
    id: 'about',
    purpose: 'identity_introduction',
    surface: 'website',
    allowedScopes: ['subject'],
    intent: 'Introduce who the subject is without org service claims.',
  },
  {
    id: 'role',
    purpose: 'role_explanation',
    surface: 'website',
    allowedScopes: ['subject', 'educational'],
    intent: 'Explain the subject role; keep org capabilities attributed to the org.',
  },
  {
    id: 'pathways',
    purpose: 'service_pathways',
    surface: 'website',
    allowedScopes: ['organization', 'educational'],
    intent: 'Describe organization services as organizational facts.',
  },
  {
    id: 'journey',
    purpose: 'journey_expectation',
    surface: 'website',
    allowedScopes: ['educational', 'subject'],
    intent: 'Set expectations for the relationship without repeating the hero.',
  },
  {
    id: 'geography',
    purpose: 'geography_context',
    surface: 'website',
    allowedScopes: ['organization'],
    intent: 'Locate the work geographically using org/history evidence.',
  },
  {
    id: 'cta',
    purpose: 'public_invitation',
    surface: 'website',
    allowedScopes: ['cta', 'organization'],
    intent: 'Offer verified contact paths only.',
  },
];

/** Portal section purposes — continue the relationship; do not repeat website copy. */
export const PORTAL_SECTION_BRIEFS: SectionBrief[] = [
  {
    id: 'portal_home',
    purpose: 'portal_orientation',
    surface: 'portal',
    allowedScopes: ['subject', 'cta'],
    intent: 'Orient the member after the public story — not a restatement of the website.',
  },
  {
    id: 'portal_tools',
    purpose: 'portal_tools',
    surface: 'portal',
    allowedScopes: ['educational', 'organization'],
    intent: 'Point to useful tools and resources for ongoing work.',
  },
  {
    id: 'portal_progress',
    purpose: 'portal_progress',
    surface: 'portal',
    allowedScopes: ['educational', 'cta'],
    intent: 'Show progress and next actions inside the relationship.',
  },
  {
    id: 'portal_communication',
    purpose: 'portal_communication',
    surface: 'portal',
    allowedScopes: ['cta', 'contact'],
    intent: 'Enable private communication without marketing slogans.',
  },
  {
    id: 'portal_documents',
    purpose: 'portal_documents',
    surface: 'portal',
    allowedScopes: ['educational', 'organization'],
    intent: 'House documents and shared materials for the engagement.',
  },
];

let claimSeq = 0;
function nextClaimId(kind: EvidenceKind): string {
  claimSeq += 1;
  return `ev-${kind}-${claimSeq}`;
}

function normalizeConfidence(
  status?: string,
): EvidenceConfidence {
  if (status === 'verified') return 'verified';
  if (status === 'admin_clarification') return 'admin_clarification';
  if (status === 'inferred') return 'inferred';
  return 'unknown';
}

function classifyClaimText(text: string): { kind: EvidenceKind; scope: EvidenceScope } {
  const t = text.toLowerCase();
  if (
    /\b(phone|tel:|call\s|email|@|contact|1[-.\s]?\(?\d{3}\)?)\b/i.test(text)
  ) {
    return { kind: 'contact', scope: 'cta' };
  }
  if (
    /\b(home\s*health|hospice|palliative|therapy|service|program|offering|product|collection)\b/i.test(
      t,
    )
  ) {
    return { kind: 'service', scope: 'organization' };
  }
  if (/\b(county|region|serves|north\s*carolina|\bNC\b|headquarters|since\s+\d{4})\b/i.test(t)) {
    if (/since\s+\d{4}|founded|established/i.test(t)) {
      return { kind: 'history', scope: 'organization' };
    }
    return { kind: 'geography', scope: 'organization' };
  }
  if (/\b(liaison|coordinator|director|founder|owner|pastor|minister|nurse|clinician)\b/i.test(t)) {
    return { kind: 'role', scope: 'subject' };
  }
  if (/\b(audience|families|patients|customers|members|community)\b/i.test(t)) {
    return { kind: 'audience', scope: 'educational' };
  }
  if (/\b(mission|purpose|exists to|helps)\b/i.test(t)) {
    return { kind: 'mission', scope: 'educational' };
  }
  return { kind: 'other', scope: 'educational' };
}

export type EvidenceBuildInput = {
  subjectIdentity: string;
  distinguishingDetail?: string;
  organizations?: string[];
  biography?: string;
  claims?: Array<{ text: string; status?: string; sourceUrl?: string }>;
  sources?: Array<{ url: string; label?: string }>;
  currentWork?: string[];
  milestones?: string[];
};

/**
 * Build a structured evidence model from research pack fields.
 * Does not invent facts. Classifies existing claims by kind/scope.
 */
export function buildStructuredEvidenceModel(input: EvidenceBuildInput): StructuredEvidenceModel {
  claimSeq = 0;
  const subjectIdentity = (input.subjectIdentity || '').trim() || 'Subject';
  const detail = (input.distinguishingDetail || '').trim();
  const detailClause = detail.split(/[.;]/)[0]?.trim() || detail;
  const allClaims: EvidenceClaim[] = [];

  let verifiedRole: string | undefined;
  let verifiedOrganization: string | undefined;

  const at = detailClause.match(/^(.+?)\s+at\s+(.+)$/i);
  const withOrg = detailClause.match(/^(.+?)\s+with\s+(.+)$/i);
  if (at) {
    verifiedRole = at[1]!.trim();
    verifiedOrganization = at[2]!.trim();
    allClaims.push({
      id: nextClaimId('role'),
      text: `${subjectIdentity} serves as ${verifiedRole} at ${verifiedOrganization}.`,
      kind: 'role',
      scope: 'subject',
      confidence: 'admin_clarification',
    });
  } else if (withOrg) {
    verifiedRole = withOrg[1]!.trim();
    verifiedOrganization = withOrg[2]!.trim();
    allClaims.push({
      id: nextClaimId('role'),
      text: `${subjectIdentity} serves as ${verifiedRole} with ${verifiedOrganization}.`,
      kind: 'role',
      scope: 'subject',
      confidence: 'admin_clarification',
    });
  }

  const orgFromList = (input.organizations || []).map((o) => o.trim()).filter(Boolean);
  if (!verifiedOrganization && orgFromList[0]) {
    verifiedOrganization = orgFromList[0];
  }

  allClaims.push({
    id: nextClaimId('identity'),
    text: subjectIdentity,
    kind: 'identity',
    scope: 'subject',
    confidence: 'verified',
  });

  if (verifiedOrganization) {
    allClaims.push({
      id: nextClaimId('organization'),
      text: verifiedOrganization,
      kind: 'organization',
      scope: 'organization',
      confidence: orgFromList.includes(verifiedOrganization) ? 'verified' : 'admin_clarification',
    });
  }

  for (const work of input.currentWork || []) {
    const text = work.trim();
    if (!text) continue;
    allClaims.push({
      id: nextClaimId('service'),
      text,
      kind: 'service',
      scope: 'organization',
      confidence: 'inferred',
    });
  }

  for (const mile of input.milestones || []) {
    const text = mile.trim();
    if (!text) continue;
    allClaims.push({
      id: nextClaimId('history'),
      text,
      kind: 'history',
      scope: 'organization',
      confidence: 'inferred',
    });
  }

  for (const raw of input.claims || []) {
    const text = (raw.text || '').trim();
    if (!text) continue;
    const { kind, scope } = classifyClaimText(text);
    // Never promote service/history claims to subject scope when an org is known.
    const scoped: EvidenceScope =
      kind === 'service' || kind === 'history' || kind === 'geography'
        ? 'organization'
        : kind === 'role' || kind === 'identity'
          ? 'subject'
          : scope;
    const source = input.sources?.find((s) => s.url && raw.sourceUrl && s.url === raw.sourceUrl);
    allClaims.push({
      id: nextClaimId(kind),
      text,
      kind,
      scope: scoped,
      confidence: normalizeConfidence(raw.status),
      sourceUrl: raw.sourceUrl,
      sourceLabel: source?.label,
    });
  }

  const organizationServices = allClaims.filter((c) => c.kind === 'service');
  const geography = allClaims.filter((c) => c.kind === 'geography');
  const history = allClaims.filter((c) => c.kind === 'history');
  const contactPaths = allClaims.filter((c) => c.kind === 'contact');
  const subjectFacts = allClaims.filter((c) => c.scope === 'subject');
  const organizationFacts = allClaims.filter((c) => c.scope === 'organization');
  const educationalFacts = allClaims.filter((c) => c.scope === 'educational');

  return {
    schemaVersion: 1,
    subjectIdentity,
    verifiedRole,
    verifiedOrganization,
    organizationServices,
    geography,
    history,
    contactPaths,
    subjectFacts,
    organizationFacts,
    educationalFacts,
    allClaims,
  };
}

/** Facts allowed for a section purpose. */
export function claimsForSection(
  model: StructuredEvidenceModel,
  brief: SectionBrief,
): EvidenceClaim[] {
  return model.allClaims.filter((c) => brief.allowedScopes.includes(c.scope));
}

/**
 * Reject copy that attributes organization services/history to the individual.
 */
export function detectOrgAttributedToSubject(
  text: string,
  model: StructuredEvidenceModel,
): string | null {
  if (!model.verifiedOrganization || !model.subjectIdentity) return null;
  const subject = model.subjectIdentity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const orgServices = model.organizationServices.map((c) => c.text);
  for (const service of orgServices) {
    const serviceKey = service.split(/[:—–]/)[0]?.trim();
    if (!serviceKey || serviceKey.length < 4) continue;
    const mistype = new RegExp(
      `${subject}.{0,40}(provides|offers|operates|runs|owns).{0,40}${serviceKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
      'i',
    );
    if (mistype.test(text)) {
      return `Organization capability attributed to subject: ${serviceKey}`;
    }
  }
  return null;
}

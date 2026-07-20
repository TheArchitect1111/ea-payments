import crypto from 'crypto';
import type { CtpAssetManifest } from '@/lib/ctp-asset-store';
import type { CtpClientType, CtpClientTypeClassification } from '@/lib/ctp-client-type';
import type { DigitalPresenceAudit } from '@/lib/ctp-digital-presence';
import type { CtpProductionPackage } from '@/lib/ctp-production';
import type { CtpExecutiveSnapshot } from '@/lib/ctp-executive-snapshot';
import type { CtpExecutiveScore } from '@/lib/ctp-executive-scoring';
import type { ExecutiveIntelligencePackage } from '@/lib/praison-ai/types';
import {
  airtableConfigured,
  airtableQuery,
  airtableUpsertByField,
  escapeAirtableString,
} from '@/lib/data/airtable-client';
import type {
  GuideLifecycleStage,
  ProjectEvidenceState,
} from '@/lib/project-state-engine';

const TABLE = process.env.AIRTABLE_CTP_SUBMISSIONS_TABLE ?? 'CTP Submissions';

export type CtpWorkspaceStatus = 'Pending' | 'Provisioning' | 'Active' | 'Failed';
export type CtpStudioStatus = 'Not Started' | 'In Progress' | 'Ready For Review' | 'Completed';
export type CtpSubmissionStatus =
  | 'Submitted'
  | 'Workspace Pending'
  | 'Workspace Active'
  | 'Studio In Progress'
  | 'Ready For Review'
  | 'Review Scheduled'
  | 'Completed';

export type CtpIntakeAnalysisRecord = {
  agent: string;
  summary: string;
  keyFindings: Array<{ title: string; detail: string }>;
  opportunities: Array<{ title: string; detail: string }>;
  risks: Array<{ title: string; detail: string }>;
  recommendedNextSteps: string[];
  confidence: number;
  sources: string[];
  analyzedAt: string;
  requestId: string;
};

/** Persisted fields for deferred CTP executive email (portal tracks). */
export type CtpExecutiveEmailDraft = {
  clientType: CtpClientType;
  capacityScore: number;
  scoreBand: string;
  primaryConstraint: string;
  weeklyTimeRecovery: number;
  opportunityLow: number;
  opportunityHigh: number;
  projectTypeLabel: string;
  recommendedFee: number;
  recommendations?: unknown;
  operationalChallenges?: string[];
  /** Prefer journey investment range from CTP when present. */
  investmentLow?: number;
  investmentHigh?: number;
  timelineLabel?: string;
  /** Plain-language project scope bullets from the journey assignment. */
  scopePhases?: string[];
};

export type CtpSubmission = {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  status: CtpSubmissionStatus;
  workspaceStatus: CtpWorkspaceStatus;
  studioStatus: CtpStudioStatus;
  reviewScheduledAt?: string;
  considerSlug?: string;
  partnerSlug?: string;
  portalSlug?: string;
  /** Live starter site URL when website track auto-provisioned. */
  siteUrl?: string;
  creativeCampaignId?: string;
  assessmentId: string;
  proposalId: string;
  factoryOpportunity?: string;
  discoveryVersion?: string;
  discoveryAnswers?: Record<string, unknown>;
  desiredExperiences?: string[];
  recommendations?: unknown;
  /** Acquisition track — Business / Website / Website+Portal / Portal Only / Other. */
  clientType?: CtpClientType;
  clientTypeClassification?: CtpClientTypeClassification;
  digitalPresenceAudit?: DigitalPresenceAudit;
  /** Phase 3 executive snapshot (BI capacity / maturity / ROI). */
  executiveSnapshot?: CtpExecutiveSnapshot;
  /** Phase 10 AI production package (blueprint / site / portal artifacts). */
  productionPackage?: CtpProductionPackage;
  /** Draft fields for deferred executive email (portal tracks). */
  executiveEmailDraft?: CtpExecutiveEmailDraft;
  /** ISO timestamp when the executive email was successfully sent. */
  executiveEmailSentAt?: string;
  /** ISO timestamp when a collaborative review reminder email was sent. */
  reviewReminderSentAt?: string;
  executiveScoring?: CtpExecutiveScore;
  intakeAnalysis?: CtpIntakeAnalysisRecord;
  /** PraisonAI workforce package — full executive intelligence output. */
  workforcePackage?: ExecutiveIntelligencePackage;
  assetManifest?: CtpAssetManifest;
  /**
   * Canonical Guide stage — Project State Engine SSOT.
   * Never derive from siteUrl / WPS / incidental fields at read time.
   */
  guideStage?: GuideLifecycleStage;
  /** Accumulated evidence flags for the Project State Engine. */
  projectEvidence?: ProjectEvidenceState;
  /** ISO timestamp when authoritative payment completed Agreement. */
  agreementPaidAt?: string;
  submittedAt: string;
  updatedAt: string;
};

export type CtpSubmissionUpdate = Partial<
  Pick<
    CtpSubmission,
    | 'status'
    | 'workspaceStatus'
    | 'studioStatus'
    | 'reviewScheduledAt'
    | 'intakeAnalysis'
    | 'workforcePackage'
    | 'portalSlug'
    | 'siteUrl'
    | 'creativeCampaignId'
    | 'assetManifest'
    | 'clientType'
    | 'clientTypeClassification'
    | 'digitalPresenceAudit'
    | 'executiveSnapshot'
    | 'productionPackage'
    | 'executiveEmailDraft'
    | 'executiveEmailSentAt'
    | 'reviewReminderSentAt'
    | 'discoveryAnswers'
    | 'guideStage'
    | 'projectEvidence'
    | 'agreementPaidAt'
    | 'proposalId'
  >
>;

const memory = new Map<string, CtpSubmission>();

function initialWorkspaceStatus(portalRequired: boolean): CtpWorkspaceStatus {
  return portalRequired ? 'Pending' : 'Active';
}

function initialSubmissionStatus(portalRequired: boolean): CtpSubmissionStatus {
  return portalRequired ? 'Workspace Pending' : 'Submitted';
}

function toAirtableFields(submission: CtpSubmission): Record<string, unknown> {
  return {
    'Submission ID': submission.id,
    'Business Name': submission.businessName,
    'Contact Name': submission.contactName,
    Email: submission.email,
    Status: submission.status,
    'Workspace Status': submission.workspaceStatus,
    'Studio Status': submission.studioStatus,
    'Review Scheduled At': submission.reviewScheduledAt ?? null,
    'Consider Slug': submission.considerSlug ?? '',
    'Partner Slug': submission.partnerSlug ?? '',
    'Portal Slug': submission.portalSlug ?? '',
    'Creative Campaign ID': submission.creativeCampaignId ?? '',
    'Assessment ID': submission.assessmentId,
    'Proposal ID': submission.proposalId,
    'Discovery Version': submission.discoveryVersion ?? '',
    'Intake Analysis JSON': submission.intakeAnalysis
      ? JSON.stringify(submission.intakeAnalysis)
      : '',
    'Asset Manifest JSON': submission.assetManifest
      ? JSON.stringify(submission.assetManifest)
      : '',
    'Payload JSON': JSON.stringify({
      discoveryAnswers: submission.discoveryAnswers,
      factoryOpportunity: submission.factoryOpportunity,
      desiredExperiences: submission.desiredExperiences,
      recommendations: submission.recommendations,
      clientType: submission.clientType,
      clientTypeClassification: submission.clientTypeClassification,
      siteUrl: submission.siteUrl,
      digitalPresenceAudit: submission.digitalPresenceAudit,
      executiveSnapshot: submission.executiveSnapshot,
      productionPackage: submission.productionPackage,
      executiveEmailDraft: submission.executiveEmailDraft,
      executiveEmailSentAt: submission.executiveEmailSentAt,
      reviewReminderSentAt: submission.reviewReminderSentAt,
      executiveScoring: submission.executiveScoring,
      workforcePackage: submission.workforcePackage,
      guideStage: submission.guideStage,
      projectEvidence: submission.projectEvidence,
      agreementPaidAt: submission.agreementPaidAt,
    }),
    'Submitted At': submission.submittedAt,
    'Updated At': submission.updatedAt,
  };
}

function fromAirtableRecord(fields: Record<string, unknown>): CtpSubmission | null {
  const id = String(fields['Submission ID'] ?? '').trim();
  if (!id) return null;

  let payload: {
    discoveryAnswers?: Record<string, unknown>;
    factoryOpportunity?: string;
    desiredExperiences?: string[];
    recommendations?: unknown;
    clientType?: CtpClientType;
    clientTypeClassification?: CtpClientTypeClassification;
    siteUrl?: string;
    digitalPresenceAudit?: DigitalPresenceAudit;
    executiveSnapshot?: CtpExecutiveSnapshot;
    productionPackage?: CtpProductionPackage;
    executiveEmailDraft?: CtpExecutiveEmailDraft;
    executiveEmailSentAt?: string;
    reviewReminderSentAt?: string;
    executiveScoring?: CtpExecutiveScore;
    workforcePackage?: ExecutiveIntelligencePackage;
    guideStage?: GuideLifecycleStage;
    projectEvidence?: ProjectEvidenceState;
    agreementPaidAt?: string;
  } = {};
  const raw = fields['Payload JSON'];
  if (typeof raw === 'string' && raw.trim()) {
    try {
      payload = JSON.parse(raw) as typeof payload;
    } catch {
      payload = {};
    }
  }

  let intakeAnalysis: CtpIntakeAnalysisRecord | undefined;
  const intakeRaw = fields['Intake Analysis JSON'];
  if (typeof intakeRaw === 'string' && intakeRaw.trim()) {
    try {
      intakeAnalysis = JSON.parse(intakeRaw) as CtpIntakeAnalysisRecord;
    } catch {
      intakeAnalysis = undefined;
    }
  }

  let assetManifest: CtpAssetManifest | undefined;
  const manifestRaw = fields['Asset Manifest JSON'];
  if (typeof manifestRaw === 'string' && manifestRaw.trim()) {
    try {
      assetManifest = JSON.parse(manifestRaw) as CtpAssetManifest;
    } catch {
      assetManifest = undefined;
    }
  }

  return {
    id,
    businessName: String(fields['Business Name'] ?? ''),
    contactName: String(fields['Contact Name'] ?? ''),
    email: String(fields.Email ?? ''),
    status: (fields.Status as CtpSubmissionStatus) ?? 'Submitted',
    workspaceStatus: (fields['Workspace Status'] as CtpWorkspaceStatus) ?? 'Pending',
    studioStatus: (fields['Studio Status'] as CtpStudioStatus) ?? 'Not Started',
    reviewScheduledAt: fields['Review Scheduled At']
      ? String(fields['Review Scheduled At'])
      : undefined,
    considerSlug: String(fields['Consider Slug'] ?? '').trim() || undefined,
    partnerSlug: String(fields['Partner Slug'] ?? '').trim() || undefined,
    portalSlug: String(fields['Portal Slug'] ?? '').trim() || undefined,
    creativeCampaignId: String(fields['Creative Campaign ID'] ?? '').trim() || undefined,
    assessmentId: String(fields['Assessment ID'] ?? ''),
    proposalId: String(fields['Proposal ID'] ?? ''),
    factoryOpportunity: payload.factoryOpportunity,
    discoveryVersion: String(fields['Discovery Version'] ?? '').trim() || undefined,
    discoveryAnswers: payload.discoveryAnswers,
    desiredExperiences: payload.desiredExperiences,
    recommendations: payload.recommendations,
    clientType: payload.clientType,
    clientTypeClassification: payload.clientTypeClassification,
    siteUrl: payload.siteUrl,
    digitalPresenceAudit: payload.digitalPresenceAudit,
    executiveSnapshot: payload.executiveSnapshot,
    productionPackage: payload.productionPackage,
    executiveEmailDraft: payload.executiveEmailDraft,
    executiveEmailSentAt: payload.executiveEmailSentAt,
    reviewReminderSentAt: payload.reviewReminderSentAt,
    executiveScoring: payload.executiveScoring,
    workforcePackage: payload.workforcePackage,
    intakeAnalysis,
    assetManifest,
    guideStage: payload.guideStage,
    projectEvidence: payload.projectEvidence,
    agreementPaidAt: payload.agreementPaidAt,
    submittedAt: String(fields['Submitted At'] ?? new Date().toISOString()),
    updatedAt: String(fields['Updated At'] ?? new Date().toISOString()),
  };
}

export async function createCtpSubmission(input: {
  businessName: string;
  contactName: string;
  email: string;
  assessmentId: string;
  proposalId: string;
  factoryOpportunity?: string;
  considerSlug?: string;
  partnerSlug?: string;
  discoveryVersion?: string;
  discoveryAnswers?: Record<string, unknown>;
  desiredExperiences?: string[];
  recommendations?: unknown;
  clientType?: CtpClientType;
  clientTypeClassification?: CtpClientTypeClassification;
  executiveScoring?: CtpExecutiveScore;
  assetManifest?: CtpAssetManifest;
  portalRequired?: boolean;
}): Promise<{ ok: boolean; submission?: CtpSubmission; error?: string }> {
  const now = new Date().toISOString();
  const portalRequired = Boolean(input.portalRequired);
  const submission: CtpSubmission = {
    id: `CTP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
    businessName: input.businessName,
    contactName: input.contactName,
    email: input.email,
    status: initialSubmissionStatus(portalRequired),
    workspaceStatus: initialWorkspaceStatus(portalRequired),
    studioStatus: 'Not Started',
    considerSlug: input.considerSlug,
    partnerSlug: input.partnerSlug,
    assessmentId: input.assessmentId,
    proposalId: input.proposalId,
    factoryOpportunity: input.factoryOpportunity,
    discoveryVersion: input.discoveryVersion,
    discoveryAnswers: input.discoveryAnswers,
    desiredExperiences: input.desiredExperiences,
    recommendations: input.recommendations,
    clientType: input.clientType,
    clientTypeClassification: input.clientTypeClassification,
    executiveScoring: input.executiveScoring,
    assetManifest: input.assetManifest,
    guideStage: 'Welcome',
    projectEvidence: { flags: {}, at: {} },
    submittedAt: now,
    updatedAt: now,
  };

  memory.set(submission.id, submission);

  if (!airtableConfigured()) {
    return { ok: true, submission };
  }

  try {
    await airtableUpsertByField(
      TABLE,
      'Submission ID',
      submission.id,
      toAirtableFields(submission),
      true,
    );
    return { ok: true, submission };
  } catch (err) {
    console.error('[ctp-submissions] Airtable save failed:', err);
    return { ok: true, submission };
  }
}

export async function listCtpSubmissions(limit = 100): Promise<CtpSubmission[]> {
  const fromMemory = [...memory.values()].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );

  if (!airtableConfigured()) return fromMemory.slice(0, limit);

  try {
    const records = await airtableQuery(TABLE, {
      maxRecords: limit,
      sortField: 'Submitted At',
      sortDirection: 'desc',
    });
    const parsed = records
      .map((r) => fromAirtableRecord(r.fields ?? {}))
      .filter((row): row is CtpSubmission => row !== null);

    for (const row of parsed) {
      memory.set(row.id, row);
    }

    return parsed.length ? parsed : fromMemory.slice(0, limit);
  } catch (err) {
    console.error('[ctp-submissions] Airtable list failed:', err);
    return fromMemory.slice(0, limit);
  }
}

export async function updateCtpSubmission(
  id: string,
  patch: CtpSubmissionUpdate,
): Promise<{ ok: boolean; submission?: CtpSubmission; error?: string }> {
  const existing = memory.get(id) ?? (await getCtpSubmissionById(id));
  if (!existing) {
    return { ok: false, error: 'CTP submission not found.' };
  }

  const submission: CtpSubmission = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  memory.set(submission.id, submission);

  // Guide orchestration — adapts Progress from project state (non-blocking).
  void import('@/lib/ctp-guide-orchestration')
    .then(({ orchestrateGuideAfterSubmissionUpdate }) =>
      orchestrateGuideAfterSubmissionUpdate(existing, submission),
    )
    .catch((err) => {
      console.error('[ctp-submissions] guide orchestration failed:', err);
    });

  if (!airtableConfigured()) {
    return { ok: true, submission };
  }

  try {
    await airtableUpsertByField(
      TABLE,
      'Submission ID',
      submission.id,
      toAirtableFields(submission),
      true,
    );
    return { ok: true, submission };
  } catch (err) {
    console.error('[ctp-submissions] Airtable update failed:', err);
    return { ok: true, submission };
  }
}

export async function getCtpSubmissionForPortal(input: {
  portalSlug: string;
  email?: string;
}): Promise<CtpSubmission | null> {
  const portalSlug = input.portalSlug.trim();
  const email = input.email?.trim().toLowerCase();

  // Website + Portal demo: ensure in-memory/Airtable bind before lookup (idempotent).
  if (portalSlug === 'demo-website') {
    try {
      const { ensureDemoWebsitePortal } = await import('@/lib/demo-website-portal');
      await ensureDemoWebsitePortal();
    } catch (err) {
      console.error('[ctp-submissions] demo-website ensure failed:', err);
    }
  }

  const fromMemory = [...memory.values()]
    .filter(
      (row) =>
        (portalSlug && row.portalSlug === portalSlug) ||
        (email && row.email.toLowerCase() === email),
    )
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  if (fromMemory[0]) return await ensureCanonicalProjectState(fromMemory[0]);

  if (!airtableConfigured() || (!portalSlug && !email)) return null;

  const parts: string[] = [];
  if (portalSlug) parts.push(`{Portal Slug}='${escapeAirtableString(portalSlug)}'`);
  if (email) parts.push(`LOWER({Email})='${escapeAirtableString(email)}'`);
  const formula = parts.length === 1 ? parts[0] : `OR(${parts.join(',')})`;

  try {
    const records = await airtableQuery(TABLE, {
      filterByFormula: formula,
      maxRecords: 1,
      sortField: 'Submitted At',
      sortDirection: 'desc',
    });
    if (!records[0]) return null;
    const row = fromAirtableRecord(records[0].fields ?? {});
    if (!row) return null;
    memory.set(row.id, row);
    return await ensureCanonicalProjectState(row);
  } catch (err) {
    console.error('[ctp-submissions] portal lookup failed:', err);
    return fromMemory[0] ? await ensureCanonicalProjectState(fromMemory[0]) : null;
  }
}

export async function getCtpSubmissionByProposalId(proposalId: string): Promise<CtpSubmission | null> {
  const trimmed = proposalId.trim();
  if (!trimmed) return null;

  const fromMemory = [...memory.values()]
    .filter((row) => row.proposalId === trimmed)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];
  if (fromMemory) return fromMemory;

  if (!airtableConfigured()) return null;

  try {
    const formula = `{Proposal ID}='${escapeAirtableString(trimmed)}'`;
    const records = await airtableQuery(TABLE, {
      filterByFormula: formula,
      maxRecords: 1,
      sortField: 'Submitted At',
      sortDirection: 'desc',
    });
    const row = fromAirtableRecord(records[0]?.fields ?? {});
    if (row) memory.set(row.id, row);
    return row;
  } catch (err) {
    console.error('[ctp-submissions] proposal lookup failed:', err);
    return fromMemory ?? null;
  }
}

export async function getCtpSubmissionById(id: string): Promise<CtpSubmission | null> {
  const cached = memory.get(id);
  if (cached) return cached;

  if (!airtableConfigured()) return null;

  try {
    const formula = `{Submission ID}='${escapeAirtableString(id)}'`;
    const records = await airtableQuery(TABLE, { filterByFormula: formula, maxRecords: 1 });
    const row = fromAirtableRecord(records[0]?.fields ?? {});
    if (row) memory.set(row.id, row);
    return row;
  } catch (err) {
    console.error('[ctp-submissions] Airtable load failed:', err);
    return null;
  }
}

/**
 * Ensure guideStage is persisted. Bootstraps from legacy evidence once.
 * Does not use siteUrl / WPS as Agreement or Design.
 */
export async function ensureCanonicalProjectState(
  submission: CtpSubmission,
): Promise<CtpSubmission> {
  if (submission.guideStage && submission.projectEvidence) {
    return submission;
  }

  const { bootstrapProjectStateFromLegacy } = await import('@/lib/project-state-engine');
  const boot = bootstrapProjectStateFromLegacy(submission);
  const updated = await updateCtpSubmission(submission.id, boot.patch);
  return updated.submission ?? { ...submission, ...boot.patch };
}

/** Emit evidence → Project State Engine decides stage (only authority). */
export async function applyProjectEvidenceToSubmission(
  submissionId: string,
  kinds: import('@/lib/project-state-engine').ProjectEvidenceKind[],
): Promise<{ ok: boolean; submission?: CtpSubmission; error?: string }> {
  const existing = memory.get(submissionId) ?? (await getCtpSubmissionById(submissionId));
  if (!existing) return { ok: false, error: 'CTP submission not found.' };

  const ensured = await ensureCanonicalProjectState(existing);
  const { applyProjectEvidence, reconcileProjectState } = await import(
    '@/lib/project-state-engine'
  );
  const applied = applyProjectEvidence(
    {
      stage: ensured.guideStage ?? 'Welcome',
      evidence: ensured.projectEvidence,
      agreementPaidAt: ensured.agreementPaidAt,
    },
    kinds,
  );
  const result = reconcileProjectState({
    stage: applied.stage,
    evidence: applied.evidence,
    agreementPaidAt: applied.patch.agreementPaidAt ?? ensured.agreementPaidAt,
  });

  const sameFlags =
    JSON.stringify(ensured.projectEvidence?.flags ?? {}) ===
    JSON.stringify(result.evidence.flags);
  if (!result.changed && sameFlags && ensured.guideStage === result.stage) {
    return { ok: true, submission: ensured };
  }

  return updateCtpSubmission(submissionId, result.patch);
}

export function isCtpDiscoverySubmit(body: Record<string, unknown>): boolean {
  return Boolean(
    body.discoveryVersion ||
      body.discoveryAnswers ||
      (Array.isArray(body.desiredExperiences) && body.desiredExperiences.length > 0),
  );
}

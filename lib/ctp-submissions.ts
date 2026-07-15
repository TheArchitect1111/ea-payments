import crypto from 'crypto';
import type { CtpAssetManifest } from '@/lib/ctp-asset-store';
import type { CtpClientType, CtpClientTypeClassification } from '@/lib/ctp-client-type';
import type { DigitalPresenceAudit } from '@/lib/ctp-digital-presence';
import type { CtpProductionPackage } from '@/lib/ctp-production';
import type { CtpExecutiveSnapshot } from '@/lib/ctp-executive-snapshot';
import type { CtpExecutiveScore } from '@/lib/ctp-executive-scoring';
import {
  airtableConfigured,
  airtableQuery,
  airtableUpsertByField,
  escapeAirtableString,
} from '@/lib/data/airtable-client';

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
  executiveScoring?: CtpExecutiveScore;
  intakeAnalysis?: CtpIntakeAnalysisRecord;
  assetManifest?: CtpAssetManifest;
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
    | 'discoveryAnswers'
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
      executiveScoring: submission.executiveScoring,
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
    executiveScoring?: CtpExecutiveScore;
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
    executiveScoring: payload.executiveScoring,
    intakeAnalysis,
    assetManifest,
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

  const fromMemory = [...memory.values()]
    .filter(
      (row) =>
        (portalSlug && row.portalSlug === portalSlug) ||
        (email && row.email.toLowerCase() === email),
    )
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  if (fromMemory[0]) return fromMemory[0];

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
    const row = fromAirtableRecord(records[0]?.fields ?? {});
    if (row) memory.set(row.id, row);
    return row;
  } catch (err) {
    console.error('[ctp-submissions] portal lookup failed:', err);
    return fromMemory[0] ?? null;
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

export function isCtpDiscoverySubmit(body: Record<string, unknown>): boolean {
  return Boolean(
    body.discoveryVersion ||
      body.discoveryAnswers ||
      (Array.isArray(body.desiredExperiences) && body.desiredExperiences.length > 0),
  );
}

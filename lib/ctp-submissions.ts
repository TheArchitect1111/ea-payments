import crypto from 'crypto';
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
  assessmentId: string;
  proposalId: string;
  discoveryVersion?: string;
  discoveryAnswers?: Record<string, unknown>;
  desiredExperiences?: string[];
  recommendations?: unknown;
  submittedAt: string;
  updatedAt: string;
};

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
    'Assessment ID': submission.assessmentId,
    'Proposal ID': submission.proposalId,
    'Discovery Version': submission.discoveryVersion ?? '',
    'Payload JSON': JSON.stringify({
      discoveryAnswers: submission.discoveryAnswers,
      desiredExperiences: submission.desiredExperiences,
      recommendations: submission.recommendations,
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
    desiredExperiences?: string[];
    recommendations?: unknown;
  } = {};
  const raw = fields['Payload JSON'];
  if (typeof raw === 'string' && raw.trim()) {
    try {
      payload = JSON.parse(raw) as typeof payload;
    } catch {
      payload = {};
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
    assessmentId: String(fields['Assessment ID'] ?? ''),
    proposalId: String(fields['Proposal ID'] ?? ''),
    discoveryVersion: String(fields['Discovery Version'] ?? '').trim() || undefined,
    discoveryAnswers: payload.discoveryAnswers,
    desiredExperiences: payload.desiredExperiences,
    recommendations: payload.recommendations,
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
    discoveryVersion: input.discoveryVersion,
    discoveryAnswers: input.discoveryAnswers,
    desiredExperiences: input.desiredExperiences,
    recommendations: input.recommendations,
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

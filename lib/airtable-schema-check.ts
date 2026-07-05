import { getAirtableApiKey } from '@/lib/integration-env';

const BASE_ID = process.env.AIRTABLE_PAYMENTS_BASE_ID ?? 'appv0YoLIMY45fmDA';
const CAPTURES_TABLE = process.env.AIRTABLE_CAPTURES_TABLE ?? 'Capture Records';
const PULSE_TABLE = process.env.PULSE_EVENTS_TABLE ?? 'Pulse Events';
const ASSESSMENTS_TABLE_ID =
  process.env.AIRTABLE_ASSESSMENTS_TABLE_ID ?? 'tblbDbNP5PCMojNe1';
const PROPOSALS_TABLE_ID =
  process.env.AIRTABLE_PROPOSALS_TABLE_ID ?? 'tbl3P26zyteiPNLQY';
const ASSESSMENTS_TABLE_NAME = process.env.AIRTABLE_ASSESSMENTS_TABLE ?? 'Assessments';
const PROPOSALS_TABLE_NAME = process.env.AIRTABLE_PROPOSALS_TABLE ?? 'Proposals';

/** Minimum columns for a Simplifi image/URL capture save. */
export const CAPTURE_REQUIRED_FIELDS = [
  'Capture ID',
  'Title',
  'Description',
  'Capture Type',
  'Source',
  'Priority',
  'Status',
  'Date Captured',
  'Portal Slug',
  'Prospect Status',
] as const;

/** Columns used after analysis completes. */
export const CAPTURE_ANALYSIS_FIELDS = [
  'EA Fit Score',
  'Opportunity Score',
  'Analysis Summary',
  'Product Alignment',
  'Blueprint Template',
  'Trust Confidence',
  'Recommendation Summary',
  'Blueprint Summary',
  'Consider Slug',
  'Prospect Name',
  'Business Name',
  'Share URL',
  'Client Message',
  'Visibility Score',
  'Exposure Score',
  'Conversion Score',
  'Differentiation Score',
  'Modernity Score',
] as const;

export const PULSE_REQUIRED_FIELDS = [
  'Product',
  'Event Type',
  'Title',
  'Detail',
  'Priority',
  'URL',
  'Tenant ID',
  'Object ID',
  'Recorded At',
] as const;

export const ASSESSMENT_REQUIRED_FIELDS = [
  'Assessment ID',
  'Business Name',
  'Contact Name',
  'Email',
  'Team Size',
  'Revenue Range',
  'Current Systems',
  'Systems Count',
  'Operational Challenges',
  'Growth Goals',
  'Capacity Constraints',
  'Workflow Count',
  'Automation Count',
  'Integration Count',
  'Dashboard Required',
  'Portal Required',
  'User Count',
  'Business Complexity',
  'Linked Proposal',
] as const;

export const CREATIVE_STUDIO_REQUIRED_FIELDS = [
  'Record Key',
  'Record Type',
  'Organization ID',
  'Title',
  'Payload JSON',
  'Updated At',
] as const;

const CREATIVE_STUDIO_TABLE = process.env.AIRTABLE_CREATIVE_STUDIO_TABLE ?? 'Creative Studio';

export const CTP_SUBMISSIONS_REQUIRED_FIELDS = [
  'Submission ID',
  'Business Name',
  'Contact Name',
  'Email',
  'Status',
  'Workspace Status',
  'Studio Status',
  'Assessment ID',
  'Proposal ID',
  'Intake Analysis JSON',
  'Payload JSON',
  'Submitted At',
  'Updated At',
] as const;

const CTP_SUBMISSIONS_TABLE = process.env.AIRTABLE_CTP_SUBMISSIONS_TABLE ?? 'CTP Submissions';

export const PROPOSAL_REQUIRED_FIELDS = [
  'Proposal ID',
  'Business Name',
  'Contact Name',
  'Email',
  'Status',
  'Recommended Project Type',
  'Project Type Label',
  'Capacity Score',
  'Score Band',
  'Primary Constraint',
  'Weekly Time Recovery',
  'Opportunity Low',
  'Opportunity High',
  'Raw Fee',
  'Recommended Fee',
  'Scope Summary',
  'Payment Status',
  'Date Approved',
  'Stripe Session ID',
] as const;

export type TableSchemaCheck = {
  tableName: string;
  tableId?: string;
  exists: boolean;
  missingFields: string[];
  ok: boolean;
};

async function listTables(): Promise<{ id: string; name: string; fields?: { name: string }[] }[]> {
  const key = getAirtableApiKey();
  if (!key) return [];

  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`, {
    headers: { Authorization: `Bearer ${key}` },
    next: { revalidate: 300 },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { tables?: { id: string; name: string; fields?: { name: string }[] }[] };
  return data.tables ?? [];
}

function checkTable(
  tables: { id: string; name: string; fields?: { name: string }[] }[],
  tableName: string,
  required: readonly string[],
  tableId?: string,
): TableSchemaCheck {
  const table = tables.find((t) => (tableId ? t.id === tableId : false) || t.name === tableName);
  if (!table) {
    return { tableName, exists: false, missingFields: [...required], ok: false };
  }
  const names = new Set((table.fields ?? []).map((f) => f.name));
  const missingFields = required.filter((f) => !names.has(f));
  return {
    tableName: table.name,
    tableId: table.id,
    exists: true,
    missingFields,
    ok: missingFields.length === 0,
  };
}

export async function checkCaptureRecordsSchema(): Promise<TableSchemaCheck> {
  const tables = await listTables();
  return checkTable(tables, CAPTURES_TABLE, CAPTURE_REQUIRED_FIELDS);
}

export async function checkPulseEventsSchema(): Promise<TableSchemaCheck & { configured: boolean }> {
  const configured = Boolean(process.env.PULSE_EVENTS_TABLE?.trim());
  const tables = await listTables();
  const check = checkTable(tables, PULSE_TABLE, PULSE_REQUIRED_FIELDS);
  return { ...check, configured };
}

export async function checkAssessmentSchema(): Promise<TableSchemaCheck> {
  const tables = await listTables();
  return checkTable(tables, ASSESSMENTS_TABLE_NAME, ASSESSMENT_REQUIRED_FIELDS, ASSESSMENTS_TABLE_ID);
}

export async function checkCreativeStudioSchema(): Promise<TableSchemaCheck> {
  const tables = await listTables();
  return checkTable(tables, CREATIVE_STUDIO_TABLE, CREATIVE_STUDIO_REQUIRED_FIELDS);
}

export async function checkCtpSubmissionsSchema(): Promise<TableSchemaCheck> {
  const tables = await listTables();
  return checkTable(tables, CTP_SUBMISSIONS_TABLE, CTP_SUBMISSIONS_REQUIRED_FIELDS);
}

export async function checkProposalSchema(): Promise<TableSchemaCheck> {
  const tables = await listTables();
  return checkTable(tables, PROPOSALS_TABLE_NAME, PROPOSAL_REQUIRED_FIELDS, PROPOSALS_TABLE_ID);
}

export async function checkAirtableLaunchSchema(): Promise<{
  capture: TableSchemaCheck;
  pulse: TableSchemaCheck & { configured: boolean };
  assessment: TableSchemaCheck;
  proposal: TableSchemaCheck;
  creativeStudio: TableSchemaCheck;
  ctpSubmissions: TableSchemaCheck;
  captureAnalysisMissing: string[];
}> {
  const tables = await listTables();
  const capture = checkTable(tables, CAPTURES_TABLE, CAPTURE_REQUIRED_FIELDS);
  const pulse = {
    ...checkTable(tables, PULSE_TABLE, PULSE_REQUIRED_FIELDS),
    configured: Boolean(process.env.PULSE_EVENTS_TABLE?.trim()),
  };
  const assessment = checkTable(
    tables,
    ASSESSMENTS_TABLE_NAME,
    ASSESSMENT_REQUIRED_FIELDS,
    ASSESSMENTS_TABLE_ID,
  );
  const proposal = checkTable(
    tables,
    PROPOSALS_TABLE_NAME,
    PROPOSAL_REQUIRED_FIELDS,
    PROPOSALS_TABLE_ID,
  );
  const creativeStudio = checkTable(tables, CREATIVE_STUDIO_TABLE, CREATIVE_STUDIO_REQUIRED_FIELDS);
  const ctpSubmissions = checkTable(tables, CTP_SUBMISSIONS_TABLE, CTP_SUBMISSIONS_REQUIRED_FIELDS);

  const captureTable = tables.find((t) => t.name === CAPTURES_TABLE);
  const captureNames = new Set((captureTable?.fields ?? []).map((f) => f.name));
  const captureAnalysisMissing = CAPTURE_ANALYSIS_FIELDS.filter((f) => !captureNames.has(f));

  return { capture, pulse, assessment, proposal, creativeStudio, ctpSubmissions, captureAnalysisMissing };
}

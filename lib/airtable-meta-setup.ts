import { getAirtableApiKey } from '@/lib/integration-env';
import {
  ASSESSMENT_REQUIRED_FIELDS,
  CAPTURE_REQUIRED_FIELDS,
  PROPOSAL_REQUIRED_FIELDS,
  PULSE_REQUIRED_FIELDS,
} from '@/lib/airtable-schema-check';

const BASE_ID = process.env.AIRTABLE_PAYMENTS_BASE_ID ?? 'appv0YoLIMY45fmDA';
const CAPTURES_TABLE = process.env.AIRTABLE_CAPTURES_TABLE ?? 'Capture Records';
const PULSE_TABLE = process.env.PULSE_EVENTS_TABLE ?? 'Pulse Events';
const ASSESSMENTS_TABLE_ID =
  process.env.AIRTABLE_ASSESSMENTS_TABLE_ID ?? 'tblbDbNP5PCMojNe1';
const PROPOSALS_TABLE_ID =
  process.env.AIRTABLE_PROPOSALS_TABLE_ID ?? 'tbl3P26zyteiPNLQY';
const ASSESSMENTS_TABLE_NAME = process.env.AIRTABLE_ASSESSMENTS_TABLE ?? 'Assessments';
const PROPOSALS_TABLE_NAME = process.env.AIRTABLE_PROPOSALS_TABLE ?? 'Proposals';

type AirtableFieldDef = {
  name: string;
  type: string;
  options?: Record<string, unknown>;
};

const CAPTURE_FIELD_DEFS: AirtableFieldDef[] = [
  { name: 'Capture ID', type: 'singleLineText' },
  { name: 'Title', type: 'singleLineText' },
  { name: 'Description', type: 'multilineText' },
  {
    name: 'Capture Type',
    type: 'singleSelect',
    options: {
      choices: [
        { name: 'Signal' },
        { name: 'Opportunity' },
        { name: 'Resource' },
        { name: 'Organization' },
        { name: 'Person' },
        { name: 'Note' },
      ],
    },
  },
  { name: 'Source URL', type: 'url' },
  { name: 'Source', type: 'singleLineText' },
  { name: 'Category', type: 'singleLineText' },
  { name: 'Resource Category', type: 'singleLineText' },
  {
    name: 'Priority',
    type: 'singleSelect',
    options: { choices: [{ name: 'Low' }, { name: 'Normal' }, { name: 'High' }] },
  },
  {
    name: 'Status',
    type: 'singleSelect',
    options: {
      choices: [
        { name: 'Captured' },
        { name: 'Triaged' },
        { name: 'Analyzing' },
        { name: 'Routed' },
        { name: 'Archived' },
      ],
    },
  },
  { name: 'Tags', type: 'multilineText' },
  { name: 'Date Captured', type: 'date', options: { dateFormat: { name: 'iso' } } },
  { name: 'EA Fit Score', type: 'number', options: { precision: 0 } },
  { name: 'Opportunity Score', type: 'number', options: { precision: 0 } },
  { name: 'Analysis Summary', type: 'multilineText' },
  { name: 'Product Alignment', type: 'singleLineText' },
  { name: 'Blueprint Template', type: 'singleLineText' },
  { name: 'Trust Confidence', type: 'number', options: { precision: 0 } },
  { name: 'Recommendation Summary', type: 'multilineText' },
  { name: 'Blueprint Summary', type: 'multilineText' },
  { name: 'Consider Slug', type: 'singleLineText' },
  { name: 'Prospect Name', type: 'singleLineText' },
  { name: 'Business Name', type: 'singleLineText' },
  { name: 'Share URL', type: 'url' },
  { name: 'Client Message', type: 'multilineText' },
  { name: 'Visibility Score', type: 'number', options: { precision: 0 } },
  { name: 'Exposure Score', type: 'number', options: { precision: 0 } },
  { name: 'Conversion Score', type: 'number', options: { precision: 0 } },
  { name: 'Differentiation Score', type: 'number', options: { precision: 0 } },
  { name: 'Modernity Score', type: 'number', options: { precision: 0 } },
  {
    name: 'Prospect Status',
    type: 'singleSelect',
    options: {
      choices: [
        { name: 'New' },
        { name: 'Shared' },
        { name: 'Viewed' },
        { name: 'Assessment Started' },
        { name: 'Assessment Completed' },
        { name: 'Discovery Booked' },
        { name: 'Archived' },
      ],
    },
  },
  { name: 'Portal Slug', type: 'singleLineText' },
  { name: 'Next Action', type: 'singleLineText' },
  { name: 'Due Date', type: 'date', options: { dateFormat: { name: 'iso' } } },
  { name: 'Owner', type: 'singleLineText' },
  { name: 'Why This Matters', type: 'multilineText' },
  { name: 'What Most People Do', type: 'multilineText' },
  { name: 'What We Recommend', type: 'multilineText' },
  { name: 'Save Purpose', type: 'singleLineText' },
  { name: 'Save Reason', type: 'multilineText' },
  { name: 'Outcome Status', type: 'singleLineText' },
];

const PULSE_FIELD_DEFS: AirtableFieldDef[] = [
  { name: 'Product', type: 'singleLineText' },
  { name: 'Event Type', type: 'singleLineText' },
  { name: 'Title', type: 'singleLineText' },
  { name: 'Detail', type: 'multilineText' },
  {
    name: 'Priority',
    type: 'singleSelect',
    options: { choices: [{ name: 'critical' }, { name: 'high' }, { name: 'medium' }, { name: 'low' }] },
  },
  { name: 'URL', type: 'url' },
  { name: 'Tenant ID', type: 'singleLineText' },
  { name: 'Object ID', type: 'singleLineText' },
  {
    name: 'Recorded At',
    type: 'dateTime',
    options: { dateFormat: { name: 'iso' }, timeFormat: { name: '24hour' }, timeZone: 'utc' },
  },
];

const PROPOSAL_FIELD_DEFS: AirtableFieldDef[] = [
  { name: 'Proposal ID', type: 'singleLineText' },
  { name: 'Business Name', type: 'singleLineText' },
  { name: 'Contact Name', type: 'singleLineText' },
  { name: 'Email', type: 'email' },
  {
    name: 'Status',
    type: 'singleSelect',
    options: {
      choices: [
        { name: 'Pending Review' },
        { name: 'Approved' },
        { name: 'Client Accepted' },
        { name: 'Paid' },
        { name: 'Archived' },
      ],
    },
  },
  { name: 'Recommended Project Type', type: 'singleLineText' },
  { name: 'Project Type Label', type: 'singleLineText' },
  { name: 'Capacity Score', type: 'number', options: { precision: 0 } },
  { name: 'Score Band', type: 'singleLineText' },
  { name: 'Primary Constraint', type: 'singleLineText' },
  { name: 'Weekly Time Recovery', type: 'number', options: { precision: 0 } },
  { name: 'Opportunity Low', type: 'currency', options: { precision: 2, symbol: '$' } },
  { name: 'Opportunity High', type: 'currency', options: { precision: 2, symbol: '$' } },
  { name: 'Raw Fee', type: 'currency', options: { precision: 2, symbol: '$' } },
  { name: 'Recommended Fee', type: 'currency', options: { precision: 2, symbol: '$' } },
  { name: 'Scope Summary', type: 'multilineText' },
  {
    name: 'Payment Status',
    type: 'singleSelect',
    options: {
      choices: [
        { name: 'Not Started' },
        { name: 'Checkout Created' },
        { name: 'Paid' },
        { name: 'Payment Failed' },
        { name: 'Refunded' },
      ],
    },
  },
  { name: 'Date Approved', type: 'date', options: { dateFormat: { name: 'iso' } } },
  { name: 'Stripe Session ID', type: 'singleLineText' },
];

const ASSESSMENT_FIELD_DEFS: AirtableFieldDef[] = [
  { name: 'Assessment ID', type: 'singleLineText' },
  { name: 'Business Name', type: 'singleLineText' },
  { name: 'Contact Name', type: 'singleLineText' },
  { name: 'Email', type: 'email' },
  { name: 'Team Size', type: 'number', options: { precision: 0 } },
  { name: 'Revenue Range', type: 'singleLineText' },
  { name: 'Current Systems', type: 'singleLineText' },
  { name: 'Systems Count', type: 'number', options: { precision: 0 } },
  { name: 'Operational Challenges', type: 'multipleSelects', options: { choices: [] } },
  { name: 'Growth Goals', type: 'multilineText' },
  { name: 'Capacity Constraints', type: 'multilineText' },
  { name: 'Workflow Count', type: 'number', options: { precision: 0 } },
  { name: 'Automation Count', type: 'number', options: { precision: 0 } },
  { name: 'Integration Count', type: 'number', options: { precision: 0 } },
  {
    name: 'Dashboard Required',
    type: 'checkbox',
    options: { icon: 'check', color: 'greenBright' },
  },
  {
    name: 'Portal Required',
    type: 'checkbox',
    options: { icon: 'check', color: 'greenBright' },
  },
  { name: 'User Count', type: 'number', options: { precision: 0 } },
  { name: 'Business Complexity', type: 'singleLineText' },
  {
    name: 'Linked Proposal',
    type: 'multipleRecordLinks',
    options: { linkedTableId: PROPOSALS_TABLE_ID },
  },
];

type TableMeta = { id: string; name: string; fields?: { name: string }[] };

function authHeaders(key: string): Record<string, string> {
  return { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
}

async function listTables(key: string): Promise<TableMeta[]> {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`, {
    headers: authHeaders(key),
  });
  if (!res.ok) {
    throw new Error(`Meta API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const data = (await res.json()) as { tables?: TableMeta[] };
  return data.tables ?? [];
}

async function ensureTable(
  key: string,
  tables: TableMeta[],
  tableName: string,
  description: string,
  seedFields: AirtableFieldDef[],
  tableId?: string,
): Promise<{ table: TableMeta; created: string[]; skipped: string[] }> {
  let table = tables.find((t) => (tableId ? t.id === tableId : false) || t.name === tableName);
  const created: string[] = [];
  const skipped: string[] = [];

  if (!table) {
    const res = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`, {
      method: 'POST',
      headers: authHeaders(key),
      body: JSON.stringify({
        name: tableName,
        description,
        fields: seedFields.slice(0, 3),
      }),
    });
    if (!res.ok) {
      throw new Error(`Create table ${tableName}: ${res.status} ${(await res.text()).slice(0, 300)}`);
    }
    const createdTable = (await res.json()) as TableMeta;
    table = createdTable;
    tables.push(createdTable);
  }

  const existing = new Set((table.fields ?? []).map((f) => f.name));
  for (const field of seedFields) {
    if (existing.has(field.name)) {
      skipped.push(field.name);
      continue;
    }
    const res = await fetch(
      `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables/${table.id}/fields`,
      {
        method: 'POST',
        headers: authHeaders(key),
        body: JSON.stringify(field),
      },
    );
    if (res.status === 422) {
      skipped.push(field.name);
      continue;
    }
    if (!res.ok) {
      throw new Error(`Field ${field.name}: ${res.status} ${(await res.text()).slice(0, 200)}`);
    }
    created.push(field.name);
    existing.add(field.name);
  }

  return { table, created, skipped };
}

export type AirtableLaunchSetupResult = {
  ok: boolean;
  baseId: string;
  paymentsBaseConfigured: boolean;
  capture: { tableName: string; tableId: string; created: string[]; skipped: string[] };
  pulse: { tableName: string; tableId: string; created: string[]; skipped: string[] };
  assessment: { tableName: string; tableId: string; created: string[]; skipped: string[] };
  proposal: { tableName: string; tableId: string; created: string[]; skipped: string[] };
  errors: string[];
};

export async function ensureAirtableLaunchTables(): Promise<AirtableLaunchSetupResult> {
  const key = getAirtableApiKey();
  const errors: string[] = [];

  if (!key) {
    return {
      ok: false,
      baseId: BASE_ID,
      paymentsBaseConfigured: Boolean(process.env.AIRTABLE_PAYMENTS_BASE_ID),
      capture: { tableName: CAPTURES_TABLE, tableId: '', created: [], skipped: [] },
      pulse: { tableName: PULSE_TABLE, tableId: '', created: [], skipped: [] },
      assessment: { tableName: ASSESSMENTS_TABLE_NAME, tableId: '', created: [], skipped: [] },
      proposal: { tableName: PROPOSALS_TABLE_NAME, tableId: '', created: [], skipped: [] },
      errors: ['AIRTABLE_API_KEY missing on server'],
    };
  }

  try {
    const tables = await listTables(key);
    const captureResult = await ensureTable(
      key,
      tables,
      CAPTURES_TABLE,
      'Simplifi captures and Magnifi blueprint summaries',
      CAPTURE_FIELD_DEFS,
    );

    const pulseTables = await listTables(key);
    const pulseResult = await ensureTable(
      key,
      pulseTables,
      PULSE_TABLE,
      'Pulse™ activity bus — cross-product events',
      PULSE_FIELD_DEFS,
    );

    const proposalTables = await listTables(key);
    const proposalResult = await ensureTable(
      key,
      proposalTables,
      PROPOSALS_TABLE_NAME,
      'Assessment-generated client proposals',
      PROPOSAL_FIELD_DEFS,
      PROPOSALS_TABLE_ID,
    );

    const assessmentTables = await listTables(key);
    const assessmentResult = await ensureTable(
      key,
      assessmentTables,
      ASSESSMENTS_TABLE_NAME,
      'Client capacity assessment submissions',
      ASSESSMENT_FIELD_DEFS,
      ASSESSMENTS_TABLE_ID,
    );

    const captureNames = new Set([
      ...(captureResult.table.fields ?? []).map((f) => f.name),
      ...captureResult.created,
    ]);
    const pulseNames = new Set([
      ...(pulseResult.table.fields ?? []).map((f) => f.name),
      ...pulseResult.created,
    ]);
    const proposalNames = new Set([
      ...(proposalResult.table.fields ?? []).map((f) => f.name),
      ...proposalResult.created,
    ]);
    const assessmentNames = new Set([
      ...(assessmentResult.table.fields ?? []).map((f) => f.name),
      ...assessmentResult.created,
    ]);

    for (const field of CAPTURE_REQUIRED_FIELDS) {
      if (!captureNames.has(field)) errors.push(`Capture missing required field: ${field}`);
    }
    for (const field of PULSE_REQUIRED_FIELDS) {
      if (!pulseNames.has(field)) errors.push(`Pulse missing required field: ${field}`);
    }
    for (const field of PROPOSAL_REQUIRED_FIELDS) {
      if (!proposalNames.has(field)) errors.push(`Proposal missing required field: ${field}`);
    }
    for (const field of ASSESSMENT_REQUIRED_FIELDS) {
      if (!assessmentNames.has(field)) errors.push(`Assessment missing required field: ${field}`);
    }

    return {
      ok: errors.length === 0,
      baseId: BASE_ID,
      paymentsBaseConfigured: Boolean(process.env.AIRTABLE_PAYMENTS_BASE_ID),
      capture: {
        tableName: CAPTURES_TABLE,
        tableId: captureResult.table.id,
        created: captureResult.created,
        skipped: captureResult.skipped,
      },
      pulse: {
        tableName: pulseResult.table.name,
        tableId: pulseResult.table.id,
        created: pulseResult.created,
        skipped: pulseResult.skipped,
      },
      assessment: {
        tableName: assessmentResult.table.name,
        tableId: assessmentResult.table.id,
        created: assessmentResult.created,
        skipped: assessmentResult.skipped,
      },
      proposal: {
        tableName: proposalResult.table.name,
        tableId: proposalResult.table.id,
        created: proposalResult.created,
        skipped: proposalResult.skipped,
      },
      errors,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown setup error';
    return {
      ok: false,
      baseId: BASE_ID,
      paymentsBaseConfigured: Boolean(process.env.AIRTABLE_PAYMENTS_BASE_ID),
      capture: { tableName: CAPTURES_TABLE, tableId: '', created: [], skipped: [] },
      pulse: { tableName: PULSE_TABLE, tableId: '', created: [], skipped: [] },
      assessment: { tableName: ASSESSMENTS_TABLE_NAME, tableId: '', created: [], skipped: [] },
      proposal: { tableName: PROPOSALS_TABLE_NAME, tableId: '', created: [], skipped: [] },
      errors: [message],
    };
  }
}

/** Verify payments base contains Capture Records at the configured base ID. */
export async function verifyPaymentsBaseId(): Promise<{
  baseId: string;
  configured: boolean;
  captureTableFound: boolean;
  captureTableId?: string;
  clientRecordsFound: boolean;
}> {
  const key = getAirtableApiKey();
  if (!key) {
    return {
      baseId: BASE_ID,
      configured: Boolean(process.env.AIRTABLE_PAYMENTS_BASE_ID),
      captureTableFound: false,
      clientRecordsFound: false,
    };
  }

  const tables = await listTables(key);
  const capture = tables.find((t) => t.name === CAPTURES_TABLE);
  const client = tables.find((t) => t.name === 'Client Records');

  return {
    baseId: BASE_ID,
    configured: Boolean(process.env.AIRTABLE_PAYMENTS_BASE_ID),
    captureTableFound: Boolean(capture),
    captureTableId: capture?.id,
    clientRecordsFound: Boolean(client),
  };
}

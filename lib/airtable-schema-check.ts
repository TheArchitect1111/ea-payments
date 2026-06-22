import { getAirtableApiKey } from '@/lib/integration-env';

const BASE_ID = process.env.AIRTABLE_PAYMENTS_BASE_ID ?? 'appv0YoLIMY45fmDA';
const CAPTURES_TABLE = process.env.AIRTABLE_CAPTURES_TABLE ?? 'Capture Records';
const PULSE_TABLE = process.env.PULSE_EVENTS_TABLE ?? 'Pulse Events';

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
): TableSchemaCheck {
  const table = tables.find((t) => t.name === tableName);
  if (!table) {
    return { tableName, exists: false, missingFields: [...required], ok: false };
  }
  const names = new Set((table.fields ?? []).map((f) => f.name));
  const missingFields = required.filter((f) => !names.has(f));
  return {
    tableName,
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

export async function checkAirtableLaunchSchema(): Promise<{
  capture: TableSchemaCheck;
  pulse: TableSchemaCheck & { configured: boolean };
  captureAnalysisMissing: string[];
}> {
  const tables = await listTables();
  const capture = checkTable(tables, CAPTURES_TABLE, CAPTURE_REQUIRED_FIELDS);
  const pulse = {
    ...checkTable(tables, PULSE_TABLE, PULSE_REQUIRED_FIELDS),
    configured: Boolean(process.env.PULSE_EVENTS_TABLE?.trim()),
  };

  const captureTable = tables.find((t) => t.name === CAPTURES_TABLE);
  const captureNames = new Set((captureTable?.fields ?? []).map((f) => f.name));
  const captureAnalysisMissing = CAPTURE_ANALYSIS_FIELDS.filter((f) => !captureNames.has(f));

  return { capture, pulse, captureAnalysisMissing };
}
